#!/usr/bin/env node

import { spawn, execSync } from "child_process"
import { createWriteStream, mkdirSync, existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import qrcode from "qrcode-terminal"
import chalk from "chalk"
import ora from "ora"
import crypto from "crypto"
import http from "http"
import httpProxy from "http-proxy"
import { encodeQrPayload } from "@crosscode/shared"
import { onKeypress, cleanupKeypress } from "./keypress"

const children: import("child_process").ChildProcess[] = []
const logDir = join(homedir(), ".crosscode")
const configFile = join(logDir, "config.json")

if (!existsSync(logDir))
    mkdirSync(logDir, {
        recursive: true
    })

const crosscodeLogFile = join(logDir, "crosscode.log")
const cloudflaredLogFile = join(logDir, "cloudflared.log")
const opencodeLogFile = join(logDir, "opencode.log")
const ngrokLogFile = join(logDir, "ngrok.log")

const crosscodeLogStream = createWriteStream(crosscodeLogFile, { flags: "a" })
const cloudflaredLogStream = createWriteStream(cloudflaredLogFile, { flags: "a" })
const opencodeLogStream = createWriteStream(opencodeLogFile, { flags: "a" })
const ngrokLogStream = createWriteStream(ngrokLogFile, { flags: "a" })

function logCrosscode(msg: string) {
    crosscodeLogStream.write(`${new Date().toISOString()} ${msg}\n`)
}

function checkDep(name: string): boolean {
    try {
        execSync(`which ${name}`, {
            stdio: "ignore"
        })
        return true
    } catch {
        return false
    }
}

type Config = {
    ngrokToken?: string
    port?: number
    auth?: {
        email?: string
        sessionToken?: string
        tier?: string
    }
}

function readConfig(): Config {
    if (!existsSync(configFile)) return {}
    try {
        return JSON.parse(readFileSync(configFile, "utf-8"))
    } catch {
        return {}
    }
}

function saveConfig(config: Config) {
    writeFileSync(configFile, JSON.stringify(config, null, 2))
}

const AUTH_API_URL = process.env.CROSSCODE_AUTH_URL || "http://localhost:3000/api/auth"
const WEB_URL = process.env.CROSSCODE_WEB_URL || "https://crosscode.sish.work"

function promptInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        process.stdout.write(prompt)
        process.stdin.resume()
        process.stdin.setEncoding("utf8")

        const onData = (data: string) => {
            const char = data.toString()
            if (char === "\n" || char === "\r") {
                process.stdin.removeListener("data", onData)
                process.stdin.pause()
                console.log()
                resolve(char)
            } else {
                process.stdout.write(char)
            }
        }

        process.stdin.on("data", onData)
    })
}

function openBrowser(url: string): void {
    const platform = process.platform
    try {
        if (platform === "darwin") {
            require("child_process").exec(`open ${url}`)
        } else if (platform === "win32") {
            require("child_process").exec(`start ${url}`)
        } else {
            require("child_process").exec(`xdg-open ${url}`)
        }
    } catch {}
}

async function validateApiKey(apiKey: string): Promise<{ email: string; name: string; tier: string } | null> {
    try {
        const response = await fetch(`${AUTH_API_URL}/api-key/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey }),
        })
        if (!response.ok) return null
        const data = await response.json()
        return { email: data.email, name: data.name, tier: data.tier }
    } catch {
        return null
    }
}

async function loginFlow(config: Config): Promise<boolean> {
    console.log(chalk.cyan("\n CrossCode Authentication\n"))
    console.log(chalk.white(" Sign in to unlock dedicated tunnels and unlimited connections.\n"))

    const loginUrl = `${WEB_URL}/login`
    console.log(chalk.blue(" Opening browser..."))
    console.log(chalk.dim(` If browser doesn't open, visit: ${loginUrl}\n`))

    openBrowser(loginUrl)

    console.log(chalk.white(" After logging in, you'll see an API key on the dashboard."))
    console.log(chalk.dim(" Copy the API key and paste it below.\n"))

    const apiKey = (await promptInput(chalk.yellow(" API Key: "))).trim()

    if (!apiKey) {
        console.log(chalk.red("\n API key is required.\n"))
        return false
    }

    const spinner = ora(chalk.blue("Validating API key...")).start()
    const result = await validateApiKey(apiKey)
    spinner.stop()

    if (!result) {
        console.log(chalk.red("\n Invalid API key. Please try again.\n"))
        return false
    }

    config.auth = {
        email: result.email,
        sessionToken: apiKey,
        tier: result.tier,
    }
    saveConfig(config)

    console.log(chalk.green(`\n Logged in as ${result.email}`))
    console.log(chalk.dim(` Tier: ${result.tier}\n`))
    return true
}

async function setupNgrokToken(): Promise<string> {
    console.log(chalk.cyan("\n ngrok requires a free auth token.\n"))
    console.log(chalk.white(" 1. Sign up at: ") + chalk.underline.blue("https://dashboard.ngrok.com/signup"))
    console.log(chalk.white(" 2. Get your token at: ") + chalk.underline.blue("https://dashboard.ngrok.com/get-started/your-authtoken"))
    console.log()

    const token = await new Promise<string>((resolve) => {
        process.stdout.write(chalk.yellow(" Paste your ngrok auth token: "))
        process.stdin.resume()
        process.stdin.setEncoding("utf8")

        const onData = (data: Buffer) => {
            const input = data.toString().trim()
            if (input.length > 0) {
                process.stdin.removeListener("data", onData)
                process.stdin.pause()
                resolve(input)
            }
        }

        process.stdin.on("data", onData)
    })

    return token
}

async function main() {
    const args = process.argv.slice(2)
    const config = readConfig()
    const command = args[0]

    if (command === "login") {
        const success = await loginFlow(config)
        process.exit(success ? 0 : 1)
    }

    if (command === "logout") {
        if (config.auth) {
            console.log(chalk.yellow(`\n Logged out ${config.auth.email}\n`))
            delete config.auth
            saveConfig(config)
        } else {
            console.log(chalk.dim("\n Not logged in.\n"))
        }
        process.exit(0)
    }

    if (command === "status") {
        if (config.auth?.sessionToken) {
            console.log(chalk.green(`\n Logged in as ${config.auth.email}`))
            console.log(chalk.dim(` Tier: ${config.auth.tier || "free"}\n`))
        } else {
            console.log(chalk.dim("\n Not logged in (free tier)\n"))
        }
        process.exit(0)
    }

    if (command === "help" || command === "--help" || command === "-h") {
        console.log(`
${chalk.cyan("CrossCode")} - Mobile remote client for OpenCode

${chalk.yellow("Usage:")}
  crosscode [options]

${chalk.yellow("Commands:")}
  login              Login with API key (opens browser)
  logout             Clear saved authentication
  status             Show login status and tier

${chalk.yellow("Options:")}
  --ngrok            Use ngrok instead of cloudflared
  --help, -h         Show this help message

${chalk.yellow("Examples:")}
  crosscode          Start with free tier (cloudflared)
  crosscode --ngrok  Start with ngrok tunnel
  crosscode login    Authenticate for paid tier features
`)
        process.exit(0)
    }

    const useNgrok = args.includes("--ngrok")
    const tunnelProvider = useNgrok ? "ngrok" : "cloudflared"
    const port = config.port || 4096

    let missingDep = false
    let logsVisible = false
    let tunnelUrl = ""

    logCrosscode(`CrossCode starting up (tunnel: ${tunnelProvider})`)

    if (!checkDep("opencode")) {
        console.error(chalk.red("[DEPENDENCY ERROR] opencode not found. Install opencode and try again."))
        logCrosscode("Dependency check failed: opencode")
        missingDep = true
    }

    if (tunnelProvider === "cloudflared") {
        if (!checkDep("cloudflared")) {
            console.error(chalk.red("[DEPENDENCY ERROR] cloudflared not found. Install cloudflared and try again."))
            console.log(chalk.yellow("Install cloudflared: ") + chalk.underline.blue("https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"))
            console.log(chalk.dim("Or use ngrok instead: ") + chalk.cyan("crosscode --ngrok"))
            logCrosscode("Dependency check failed: cloudflared")
            missingDep = true
        }
    } else {
        if (!checkDep("ngrok")) {
            console.error(chalk.red("[DEPENDENCY ERROR] ngrok not found."))
            console.log(chalk.yellow("Install ngrok: ") + chalk.underline.blue("https://ngrok.com/download"))
            console.log(chalk.dim("Or use cloudflared instead (default): ") + chalk.cyan("crosscode"))
            logCrosscode("Dependency check failed: ngrok")
            missingDep = true
        }
    }

    if (missingDep) process.exit(1)

    logCrosscode("All dependencies found")

    if (config.auth?.sessionToken) {
        console.log(chalk.green(`\n Logged in as ${config.auth.email}`))
        console.log(chalk.dim(` Tier: ${config.auth.tier || "free"}\n`))
    }

    if (tunnelProvider === "ngrok") {
        let ngrokToken = config.ngrokToken

        if (!ngrokToken) {
            ngrokToken = await setupNgrokToken()
            config.ngrokToken = ngrokToken
            saveConfig(config)
            logCrosscode("ngrok auth token saved")
        }

        const spinner = ora(chalk.blue("Starting ", chalk.italic("opencode serve"))).start()

        const sessionToken = crypto.randomBytes(32).toString("hex")
        logCrosscode("Session token generated")

        const opencode = spawn("opencode", ["serve", "--print-logs", "--log-level", "DEBUG"], {
            env: { ...process.env, OPENCODE_SERVER_PASSWORD: sessionToken },
            stdio: ["ignore", "pipe", "pipe"]
        })

        children.push(opencode)

        opencode.on("spawn", () => {
            spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Starting ngrok tunnel...")
            logCrosscode("opencode serve started (PID: " + opencode.pid + ")")
        })
        opencode.on("error", (err) => {
            spinner.fail(chalk.red.italic("Failed to start opencode serve"))
            logCrosscode("opencode serve error: " + err.message)
        })
        opencode.stdout?.on("data", d => opencodeLogStream.write(d))
        opencode.stderr?.on("data", d => opencodeLogStream.write(d))

        const ngrok = spawn("ngrok", ["http", `--authtoken=${ngrokToken}`, `${port}`], {
            stdio: ["ignore", "pipe", "pipe"]
        })

        children.push(ngrok)

        ngrok.on("spawn", () => logCrosscode("ngrok started (PID: " + ngrok.pid + ")"))
        ngrok.on("error", (err) => logCrosscode("ngrok error: " + err.message))
        ngrok.stdout?.on("data", d => { ngrokLogStream.write(d); cloudflaredLogStream.write(d) })
        ngrok.stderr?.on("data", d => { ngrokLogStream.write(d); cloudflaredLogStream.write(d) })

        const pollNgrokApi = () => {
            logCrosscode("Polling ngrok API at http://127.0.0.1:4040/api/tunnels")
            const req = http.get("http://127.0.0.1:4040/api/tunnels", (res) => {
                let data = ""
                res.on("data", chunk => data += chunk)
                res.on("end", () => {
                    logCrosscode("ngrok API response: " + data.substring(0, 100))
                    try {
                        const json = JSON.parse(data)
                        if (json.tunnels && json.tunnels.length > 0 && !tunnelUrl) {
                            tunnelUrl = json.tunnels[0].public_url
                            spinner.succeed(chalk.green("Tunnel ready"))
                            logCrosscode("ngrok tunnel ready: " + tunnelUrl)

                            const payload = encodeQrPayload({
                                url: tunnelUrl,
                                token: sessionToken,
                                v: 1
                            })

                            console.log(chalk.cyanBright("\n Scan with CrossCode App:"))
                            qrcode.generate(payload, { small: true })
                            console.log(chalk.grey(`URL: ${tunnelUrl}`))
                            console.log(chalk.dim.bold("[Press 'l' for logs  •  'h' for help  •  Ctrl+C to exit]"))
                        }
                    } catch (e) {
                        logCrosscode("ngrok API parse error: " + e.message)
                        setTimeout(pollNgrokApi, 500)
                    }
                })
            })
            req.on("error", (e) => {
                logCrosscode("ngrok API request error: " + e.message)
                setTimeout(pollNgrokApi, 500)
            })
        }

        setTimeout(pollNgrokApi, 1000)
    } else {
        const spinner = ora(chalk.blue("Starting ", chalk.italic("opencode serve"))).start()

        const sessionToken = crypto.randomBytes(32).toString("hex")
        logCrosscode("Session token generated")

        const opencode = spawn("opencode", ["serve", "--print-logs", "--log-level", "DEBUG"], {
            env: { ...process.env, OPENCODE_SERVER_PASSWORD: sessionToken },
            stdio: ["ignore", "pipe", "pipe"]
        })

        children.push(opencode)

        opencode.on("spawn", () => {
            spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Waiting for Cloudflare tunnel...")
            logCrosscode("opencode serve started (PID: " + opencode.pid + ")")
        })
        opencode.on("error", (err) => {
            spinner.fail(chalk.red.italic("Failed to start opencode serve"))
            logCrosscode("opencode serve error: " + err.message)
        })
        opencode.stdout?.on("data", d => opencodeLogStream.write(d))
        opencode.stderr?.on("data", d => opencodeLogStream.write(d))

        const cf = spawn("cloudflared", [
            "tunnel",
            "--no-autoupdate",
            "--config", "/dev/null",
            "--url", `http://127.0.0.1:${port}`
        ], {
            stdio: ["ignore", "pipe", "pipe"]
        })

        children.push(cf)

        cf.on("spawn", () => logCrosscode("cloudflared started (PID: " + cf.pid + ")"))
        cf.on("error", (err) => logCrosscode("cloudflared error: " + err.message))

        cf.stdout?.on("data", d => cloudflaredLogStream.write(d))

        cf.stderr?.on("data", (data: Buffer) => {
            const text = data.toString()

            const m = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/)

            if (m && !tunnelUrl) {
                tunnelUrl = m[0]
                spinner.succeed(chalk.green("Tunnel ready"))
                logCrosscode("Cloudflare tunnel ready: " + tunnelUrl)

                const payload = encodeQrPayload({
                    url: tunnelUrl,
                    token: sessionToken,
                    v: 1
                })

                console.log(chalk.cyanBright("\n Scan with CrossCode App:"))

                qrcode.generate(payload, { small: true })

                console.log(chalk.grey(`URL: ${tunnelUrl}`))
                console.log(chalk.dim.bold("[Press 'l' for logs  •  'h' for help  •  Ctrl+C to exit]"))
            }

            cloudflaredLogStream.write(data)
        })
    }

    const toggleLogs = () => {
        logsVisible = !logsVisible
        if (logsVisible) {
            try {
                const crosscodeContent = readFileSync(crosscodeLogFile, "utf-8")
                const cloudflaredContent = readFileSync(cloudflaredLogFile, "utf-8")
                const opencodeContent = readFileSync(opencodeLogFile, "utf-8")

                const crosscodeLines = crosscodeContent.split("\n").filter(Boolean).slice(-20)
                const cloudflaredLines = cloudflaredContent.split("\n").filter(Boolean).slice(-20)
                const opencodeLines = opencodeContent.split("\n").filter(Boolean).slice(-20)

                console.log("\n" + chalk.cyan.bold("═══ CROSSCODE LOGS ═══"))
                console.log(chalk.dim(crosscodeLines.join("\n")))
                console.log("\n" + chalk.yellow.bold("═══ TUNNEL LOGS ═══"))
                console.log(chalk.dim(cloudflaredLines.join("\n")))
                console.log("\n" + chalk.magenta.bold("═══ OPENCODE LOGS ═══"))
                console.log(chalk.dim(opencodeLines.join("\n")))
                console.log(chalk.dim("──────────────────────────────────────"))
            }
            catch {
                console.log(chalk.red("Could not read log files"))
            }
        }
        else {
            console.log(chalk.dim.bold("[Press 'l' for logs  •  'h' for help  •  Ctrl+C to exit]"))
        }
    }

    const shutdown = () => {
        console.log(chalk.yellow("\nShutting down..."))
        logCrosscode("Shutting down...")
        crosscodeLogStream.end()
        cloudflaredLogStream.end()
        ngrokLogStream.end()
        opencodeLogStream.end()
        children.forEach(c => c.kill())
        cleanupKeypress()
        process.exit(0)
    }

    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)

    onKeypress((key: string) => {
        if (key === "l")
            toggleLogs()
        else if (key === "ctrl-c")
            shutdown()
    })
}

main()
    .catch(err => {
        console.error(chalk.red(err))
        logCrosscode("Fatal error: " + err.message)
        crosscodeLogStream.end()
        cloudflaredLogStream.end()
        ngrokLogStream.end()
        opencodeLogStream.end()
        process.exit(1)
    })