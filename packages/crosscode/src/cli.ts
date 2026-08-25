#!/usr/bin/env node

import { spawn, execFileSync } from "child_process"
import { createWriteStream, mkdirSync, existsSync, readFileSync, writeFileSync, statSync, renameSync, unlinkSync } from "fs"
import { readFile } from "fs/promises"
import { join } from "path"
import { homedir } from "os"
import qrcode from "qrcode-terminal"
import chalk from "chalk"
import ora from "ora"
import crypto from "crypto"
import http from "http"
import net from "net"
import { encodeQrPayload } from "@crosscode/shared"
import { onKeypress, cleanupKeypress } from "./keypress"
import { connectTunnel, deriveProjectId } from "./tunnel-client"
import { handleGitRequest } from "./git-handler"
import { waitForOpencodePort } from "./port-detect"

const children: import("child_process").ChildProcess[] = []
const logDir = join(homedir(), ".crosscode")
const configFile = join(logDir, "config.json")
const MAX_LOG_SIZE = 1024 * 1024
const DEBUG = process.env.CROSSCODE_DEBUG === "1"
const MAX_BODY_SIZE = 10 * 1024 * 1024
const HOP_BY_HOP = new Set(["host", "connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-authenticate", "proxy-authorization", "te", "trailer"])

const proxyAgent = new http.Agent({ keepAlive: true, maxSockets: 50 })

function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const srv = net.createServer()
        srv.on("error", reject)
        srv.listen(0, "127.0.0.1", () => {
            const addr = srv.address() as net.AddressInfo
            const port = addr.port
            srv.close(() => resolve(port))
        })
    })
}

if (!existsSync(logDir))
    mkdirSync(logDir, {
        recursive: true,
        mode: 0o700,
    })

const crosscodeLogFile = join(logDir, "crosscode.log")
const cloudflaredLogFile = join(logDir, "cloudflared.log")
const opencodeLogFile = join(logDir, "opencode.log")
const ngrokLogFile = join(logDir, "ngrok.log")

function rotateLogIfNeeded(logFile: string) {
    try {
        if (existsSync(logFile)) {
            const stats = statSync(logFile)
            if (stats.size > MAX_LOG_SIZE) {
                const backup = `${logFile}.1`
                if (existsSync(backup)) unlinkSync(backup)
                renameSync(logFile, backup)
            }
        }
    } catch {}
}

rotateLogIfNeeded(crosscodeLogFile)
rotateLogIfNeeded(cloudflaredLogFile)
rotateLogIfNeeded(opencodeLogFile)
rotateLogIfNeeded(ngrokLogFile)

const crosscodeLogStream = createWriteStream(crosscodeLogFile, { flags: "a", mode: 0o600 })
const cloudflaredLogStream = createWriteStream(cloudflaredLogFile, { flags: "a", mode: 0o600 })
const opencodeLogStream = createWriteStream(opencodeLogFile, { flags: "a", mode: 0o600 })
const ngrokLogStream = createWriteStream(ngrokLogFile, { flags: "a", mode: 0o600 })

function logCrosscode(msg: string) {
    crosscodeLogStream.write(`${new Date().toISOString()} ${msg}\n`)
}

function debug(msg: string, meta?: Record<string, unknown>) {
    if (DEBUG) {
        const ts = new Date().toISOString()
        const extra = meta ? ` ${JSON.stringify(meta)}` : ""
        const line = `[${ts}] [DEBUG] ${msg}${extra}`
        console.log(chalk.dim(line))
        logCrosscode(line)
    }
}

function censorAuth(val: string | undefined): string {
    if (!val) return "<none>"
    if (val.startsWith("Basic ")) {
        return `Basic ${val.substring(6, 14)}...`
    }
    return `${val.substring(0, 8)}...`
}

function censorToken(val: string): string {
    if (val.length <= 16) return "***"
    return `${val.substring(0, 8)}...${val.substring(val.length - 4)}`
}

function checkDep(name: string): boolean {
    const finder = process.platform === "win32" ? "where" : "which"
    try {
        execFileSync(finder, [name], { stdio: "ignore" })
        return true
    } catch {
        return false
    }
}

function spawnCmd(cmd: string, args: string[], opts: Parameters<typeof spawn>[2] = {}) {
    return spawn(cmd, args, { ...opts, shell: process.platform === "win32" })
}

type Config = {
    ngrokToken?: string
    port?: number
    tunnelWsUrl?: string
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
    writeFileSync(configFile, JSON.stringify(config, null, 2), { mode: 0o600 })
}

const WEB_URL = process.env.CROSSCODE_WEB_URL || "https://crosscode.site"
const AUTH_API_URL = process.env.CROSSCODE_AUTH_URL || `${WEB_URL}/api/auth`

function promptInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        process.stdout.write(prompt)
        process.stdin.resume()
        process.stdin.setEncoding("utf8")
        process.stdin.setRawMode(true)

        let input = ""
        const onData = (char: string) => {
            if (char === "\r" || char === "\n") {
                process.stdin.setRawMode(false)
                process.stdin.removeListener("data", onData)
                process.stdin.pause()
                console.log()
                resolve(input)
            } else if (char === "\u0003") {
                process.stdin.setRawMode(false)
                process.stdin.removeListener("data", onData)
                process.stdin.pause()
                console.log()
                process.exit(1)
            } else if (char === "\u007F" || char === "\b") {
                if (input.length > 0) {
                    input = input.slice(0, -1)
                    process.stdout.write("\b \b")
                }
            } else {
                input += char
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
            execFileSync("open", [url])
        } else if (platform === "win32") {
            execFileSync("cmd", ["/c", "start", url])
        } else {
            execFileSync("xdg-open", [url])
        }
    } catch {}
}

async function validateApiKey(apiKey: string): Promise<{ email: string; name: string; tier: string } | null> {    try {
        debug("validating API key", { keyPrefix: apiKey.substring(0, 8) + "..." })
        const response = await fetch(`${AUTH_API_URL}/api-key/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey }),
        })
        if (!response.ok) {
            console.log(chalk.dim(`\n Server returned ${response.status}`))
            debug("API key validation failed", { status: response.status })
            return null
        }
        const data = await response.json()
        debug("API key validated", { email: data.email, tier: data.tier })
        return { email: data.email, name: data.name, tier: data.tier }
    } catch (err) {
        debug("API key validation error", { error: err instanceof Error ? err.message : String(err) })
        console.log(chalk.dim(`\n Connection failed: ${err instanceof Error ? err.message : err}`))
        return null
    }
}

async function refreshTier(config: Config): Promise<void> {
    if (!config.auth?.sessionToken) return
    try {
        const result = await validateApiKey(config.auth.sessionToken)
        if (!result) return
        if (result.tier !== config.auth.tier || result.email !== config.auth.email) {
            config.auth.tier = result.tier
            config.auth.email = result.email
            saveConfig(config)
            debug("tier refreshed", { tier: result.tier, email: result.email })
        }
    } catch (err) {
        debug("tier refresh failed", { error: err instanceof Error ? err.message : String(err) })
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

function sanitizeUrlPath(url: string | undefined): string {
    if (!url || url.length === 0) return "/"
    const withoutHash = url.split("#")[0]
    const queryIndex = withoutHash.indexOf("?")
    const rawPath = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex)
    const rawQuery = queryIndex === -1 ? "" : withoutHash.slice(queryIndex + 1)
    if (!rawPath.startsWith("/")) return "/"
    const cleaned = rawPath
    if (cleaned.includes("..") || cleaned.includes("@")) return "/"
    return `${cleaned || "/"}${rawQuery ? `?${rawQuery}` : ""}`
}

async function main() {
    const args = process.argv.slice(2)
    const config = readConfig()
    await refreshTier(config)
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
            console.log(chalk.dim("\n Not logged in (using cloudflared tunnel)\n"))
        }
        process.exit(0)
    }

    if (command === "help" || command === "--help" || command === "-h") {
        console.log(`
${chalk.cyan.bold("CrossCode")} - Mobile remote client for OpenCode

${chalk.yellow.bold("USAGE:")}
  crosscode [command] [options]

${chalk.yellow.bold("COMMANDS:")}
  ${chalk.green("login")}              Authenticate with API key (opens browser)
  ${chalk.green("logout")}             Clear saved authentication data
  ${chalk.green("status")}             Show current login status and tier
  ${chalk.green("help")}               Show this help message

${chalk.yellow.bold("OPTIONS:")}
  ${chalk.green("--cloudflared")}      Use Cloudflare tunnel (default for free tier)
  ${chalk.green("--ngrok")}            Use ngrok tunnel (requires auth token)
  ${chalk.green("--help, -h")}         Show this help message

${chalk.yellow.bold("EXAMPLES:")}
  ${chalk.dim("$")} crosscode                   Start with auto-selected tunnel
  ${chalk.dim("$")} crosscode --ngrok           Start with ngrok tunnel
  ${chalk.dim("$")} crosscode --cloudflared     Start with Cloudflare tunnel
  ${chalk.dim("$")} crosscode login             Authenticate for paid tier features
  ${chalk.dim("$")} crosscode status            Check authentication status

${chalk.yellow.bold("TUNNEL PROVIDERS:")}
  ${chalk.blue("Free tier")}       Cloudflare tunnel (default when not logged in)
  ${chalk.blue("Paid tier")}       CrossCode tunnel (default when logged in)
  ${chalk.blue("ngrok")}           Alternative tunnel (requires ngrok auth token)

${chalk.dim("Default behavior: uses connect.crosscode.site when logged in with a paid tier.")}
${chalk.dim("Documentation: https://github.com/snhsish/crosscode")}
`)
        process.exit(0)
    }

    const useNgrok = args.includes("--ngrok")
    const useCloudflared = args.includes("--cloudflared")
    const canUseTunnel = !!(config.auth?.sessionToken)
    const tunnelProvider = useNgrok ? "ngrok" : (useCloudflared ? "cloudflared" : (canUseTunnel ? "tunnel" : "cloudflared"))
    const port = config.port || await getFreePort()

    let missingDep = false
    let logsVisible = false
    let tunnelUrl = ""

    logCrosscode(`CrossCode starting up (tunnel: ${tunnelProvider}, debug: ${DEBUG})`)
    debug("startup config", { tunnelProvider, port, hasAuth: !!config.auth?.sessionToken })

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
            console.log(chalk.dim("Or login for CrossCode tunnel: ") + chalk.cyan("crosscode login"))
            logCrosscode("Dependency check failed: cloudflared")
            missingDep = true
        }
    } else if (tunnelProvider === "ngrok") {
        if (!checkDep("ngrok")) {
            console.error(chalk.red("[DEPENDENCY ERROR] ngrok not found."))
            console.log(chalk.yellow("Install ngrok: ") + chalk.underline.blue("https://ngrok.com/download"))
            console.log(chalk.dim("Or use cloudflared instead: ") + chalk.cyan("crosscode --cloudflared"))
            logCrosscode("Dependency check failed: ngrok")
            missingDep = true
        }
    }

    if (missingDep) process.exit(1)

    logCrosscode("All dependencies found")

    if (config.auth?.sessionToken) {
        console.log(chalk.green(`\n Logged in as ${config.auth.email}`))
        console.log(chalk.dim(` Tier: ${config.auth.tier || "free"}\n`))
    } else {
        console.log(chalk.cyan(" Tip:") + chalk.dim(" run ") +
            chalk.cyan("npx crosscode login") +
            chalk.dim(" to use the free built-in CrossCode tunnel.\n"))
    }

    let tunnelFailed = false

    if (tunnelProvider === "tunnel") {
        const spinner = ora(chalk.blue("Starting ", chalk.italic("opencode serve"))).start()

        const sessionToken = crypto.randomBytes(32).toString("hex")
        logCrosscode(`Session token generated (censored: ${censorToken(sessionToken)})`)
        debug("session token generated", { length: sessionToken.length })

        const opencode = spawnCmd("opencode", ["serve", "--print-logs", "--log-level", "DEBUG", "--port", String(port), "--hostname", "127.0.0.1"], {
            cwd: process.cwd(),
            env: { ...process.env, OPENCODE_SERVER_PASSWORD: sessionToken },
            stdio: ["ignore", "pipe", "pipe"]
        })

        children.push(opencode)

        let opencodePort = port

        opencode.on("spawn", () => {
            spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Detecting port...")
            logCrosscode("opencode serve started (PID: " + opencode.pid + ")")
            debug("opencode spawned", { pid: opencode.pid })
        })
        opencode.on("error", (err) => {
            spinner.fail(chalk.red.italic("Failed to start opencode serve"))
            logCrosscode("opencode serve error: " + err.message)
            debug("opencode spawn error", { error: err.message })
        })

        let proxyPort = await getFreePort()
        while (proxyPort === port) proxyPort = await getFreePort()

        waitForOpencodePort({ proc: opencode, requestedPort: port, onData: d => opencodeLogStream.write(d) }).then((detectedPort) => {
            opencodePort = detectedPort
            startProxy(detectedPort, proxyPort, sessionToken, port, spinner)
        })

        function startProxy(targetPort: number, proxyPort: number, sessionToken: string, requestedPort: number, spinner: any) {
            if (targetPort !== requestedPort) {
                logCrosscode(`Using detected port ${targetPort} instead of requested port ${requestedPort}`)
                debug("using detected port", { detected: targetPort, requested: requestedPort })
            }

            const proxy = http.createServer(async (req, res) => {
                const safePath = sanitizeUrlPath(req.url)
                const targetUrl = `http://127.0.0.1:${targetPort}${safePath}`
                const authHeader = req.headers["authorization"]

                debug("proxy request received", {
                    method: req.method,
                    url: req.url,
                    safePath,
                    hasAuth: !!authHeader,
                    auth: censorAuth(authHeader),
                })

                if (req.method === "OPTIONS") {
                    debug("handling CORS preflight")
                    res.writeHead(204, {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, Authorization",
                        "Access-Control-Max-Age": "86400",
                    })
                    res.end()
                    return
                }

                if (req.url === "/mobile-event" && req.method === "POST") {
                    debug("handling SSE request")
                    res.writeHead(200, {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "Access-Control-Allow-Origin": "*",
                    })

                    let sseAuth = authHeader || ""
                    if (sseAuth && !sseAuth.startsWith("Basic ")) {
                        sseAuth = `Basic ${Buffer.from(`:${sseAuth}`).toString("base64")}`
                        debug("converted SSE auth to Basic format")
                    }

                    const sseReq = http.get(`http://127.0.0.1:${targetPort}/event`, {
                        headers: {
                            "Accept": "text/event-stream",
                            "Authorization": sseAuth,
                        },
                    }, (sseRes) => {
                        debug("SSE upstream connected", { status: sseRes.statusCode })
                        sseRes.on("data", (chunk) => {
                            res.write(chunk)
                        })
                        sseRes.on("end", () => {
                            debug("SSE upstream ended")
                            res.end()
                        })
                    })

                    sseReq.on("error", (err) => {
                        debug("SSE upstream error", { error: err.message })
                        res.end()
                    })

                    req.on("close", () => {
                        debug("SSE client disconnected")
                        sseReq.destroy()
                    })

                    return
                }

                if (await handleGitRequest(req, res, { worktree: process.cwd(), sessionToken })) {
                    return
                }

                const forwardHeaders: Record<string, string | string[]> = {}
                for (const [key, value] of Object.entries(req.headers)) {
                    if (!HOP_BY_HOP.has(key.toLowerCase())) forwardHeaders[key] = value
                }
                forwardHeaders["host"] = `127.0.0.1:${targetPort}`
                
                const authVal = req.headers["authorization"]
                if (authVal && !authVal.startsWith("Basic ")) {
                    forwardHeaders["authorization"] = `Basic ${Buffer.from(`:${authVal}`).toString("base64")}`
                    debug("converted auth to Basic format")
                }

                let bodySize = 0
                const bodyChunks: Buffer[] = []
                
                req.on("data", (chunk) => {
                    bodySize += chunk.length
                    if (bodySize > MAX_BODY_SIZE) {
                        debug("request body too large", { size: bodySize, max: MAX_BODY_SIZE })
                        req.destroy()
                        res.writeHead(413)
                        res.end("Request body too large")
                        return
                    }
                    bodyChunks.push(chunk)
                })

                req.on("end", () => {
                    const body = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : null
                    
                    debug("forwarding to opencode", {
                        targetUrl,
                        method: req.method,
                        hasAuth: !!forwardHeaders["authorization"],
                        auth: censorAuth(forwardHeaders["authorization"] as string),
                        bodySize: body?.length ?? 0,
                    })

                    const proxyReq = http.request(targetUrl, {
                        method: req.method,
                        headers: forwardHeaders,
                        agent: proxyAgent,
                    }, (proxyRes) => {
                        debug("opencode responded", { status: proxyRes.statusCode, method: req.method, path: safePath })
                        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers)
                        proxyRes.pipe(res)
                    })

                    proxyReq.on("error", (err) => {
                        debug("proxy request error", { error: err.message })
                        res.writeHead(502)
                        res.end("Bad Gateway")
                    })

                    if (body) proxyReq.write(body)
                    proxyReq.end()
                })

                req.on("error", (err) => {
                    debug("request stream error", { error: err.message })
                    if (!res.headersSent) {
                        res.writeHead(500)
                        res.end("Internal Server Error")
                    }
                })
            })

            proxy.listen(proxyPort, "127.0.0.1", () => {
                logCrosscode(`SSE proxy started on port ${proxyPort}`)
                debug("proxy listening", { port: proxyPort, targetPort })
                
                const testReq = http.request(`http://127.0.0.1:${targetPort}/global/health`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Basic ${Buffer.from(`opencode:${sessionToken}`).toString("base64")}`
                    },
                    agent: proxyAgent,
                }, (testRes) => {
                    debug("health check result", { status: testRes.statusCode })
                    logCrosscode(`Direct test to opencode: ${testRes.statusCode}`)
                })
                testReq.on("error", (e) => {
                    debug("health check failed", { error: e.message })
                    logCrosscode(`Direct test to opencode failed: ${e.message}`)
                })
                testReq.end()
                
                spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Connecting to tunnel server...")

                const projectId = deriveProjectId()
                logCrosscode(`Project ID: ${projectId}`)
                debug("connecting to tunnel", { projectId, proxyPort })

                const tunnelTimeout = setTimeout(() => {
                    spinner.fail(chalk.red.italic("Tunnel connection timed out"))
                    logCrosscode("Tunnel connection timed out, falling back to cloudflared")
                    debug("tunnel connection timeout")
                    console.log(chalk.yellow("\n Falling back to Cloudflare tunnel...\n"))
                    children.forEach(c => c.kill())
                    children.length = 0
                    tunnelFailed = true
                }, 15_000)

                const disconnectTunnel = connectTunnel(
                    config.auth!.sessionToken!,
                    projectId,
                    proxyPort,
                    config.tunnelWsUrl,
                    (url) => {
                        clearTimeout(tunnelTimeout)
                        tunnelUrl = url
                        spinner.succeed(chalk.green("Tunnel ready"))
                        logCrosscode("Tunnel ready: " + tunnelUrl)
                        debug("tunnel connected", { tunnelUrl })

                        const payload = encodeQrPayload({
                            url: tunnelUrl,
                            token: sessionToken,
                            v: 1
                        })

                        if (opencodePort !== port) {
                            console.log(chalk.yellow(`opencode running on port ${opencodePort}`))
                        }
                        console.log(chalk.cyanBright("\n Scan with CrossCode App:"))
                        qrcode.generate(payload, { small: true })
                        console.log(chalk.grey(`URL: ${tunnelUrl}`))
                        console.log(chalk.dim.bold("[Press 'l' for logs  •  'h' for help  •  Ctrl+C to exit]"))
                    },
                    (err) => {
                        clearTimeout(tunnelTimeout)
                        spinner.fail(chalk.red.italic(`Tunnel error: ${err.message}`))
                        logCrosscode(`Tunnel error: ${err.message}, falling back to cloudflared`)
                        debug("tunnel error", { error: err.message })
                        console.log(chalk.yellow("\n Falling back to Cloudflare tunnel...\n"))
                        children.forEach(c => c.kill())
                        children.length = 0
                        disconnectTunnel()
                        tunnelFailed = true
                    }
                )
            })
        }
    }

    if (tunnelProvider === "ngrok") {
        let ngrokToken = config.ngrokToken

        if (!ngrokToken) {
            ngrokToken = await setupNgrokToken()
            config.ngrokToken = ngrokToken
            saveConfig(config)
            logCrosscode("ngrok auth token saved")
            debug("ngrok token saved")
        }

        const spinner = ora(chalk.blue("Starting ", chalk.italic("opencode serve"))).start()

        const sessionToken = crypto.randomBytes(32).toString("hex")
        logCrosscode(`Session token generated (censored: ${censorToken(sessionToken)})`)
        debug("session token generated", { length: sessionToken.length })

        const opencode = spawnCmd("opencode", ["serve", "--print-logs", "--log-level", "DEBUG", "--port", String(port), "--hostname", "127.0.0.1"], {
            cwd: process.cwd(),
            env: { ...process.env, OPENCODE_SERVER_PASSWORD: sessionToken },
            stdio: ["ignore", "pipe", "pipe"]
        })

        children.push(opencode)

        let opencodePort = port

        opencode.on("spawn", () => {
            spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Detecting port...")
            logCrosscode("opencode serve started (PID: " + opencode.pid + ")")
            debug("opencode spawned", { pid: opencode.pid })
        })
        opencode.on("error", (err) => {
            spinner.fail(chalk.red.italic("Failed to start opencode serve"))
            logCrosscode("opencode serve error: " + err.message)
            debug("opencode spawn error", { error: err.message })
        })

        waitForOpencodePort({ proc: opencode, requestedPort: port, onData: d => opencodeLogStream.write(d) }).then((detectedPort) => {
            opencodePort = detectedPort
            if (detectedPort !== port) {
                logCrosscode(`Using detected port ${detectedPort} instead of requested port ${port}`)
                debug("using detected port", { detected: detectedPort, requested: port })
            }

            const ngrok = spawnCmd("ngrok", ["http", `--authtoken=${ngrokToken}`, `${detectedPort}`], {
                stdio: ["ignore", "pipe", "pipe"]
            })

            children.push(ngrok)

            ngrok.on("spawn", () => {
                logCrosscode("ngrok started (PID: " + ngrok.pid + ")")
                spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Starting ngrok tunnel...")
                debug("ngrok spawned", { pid: ngrok.pid })
            })
            ngrok.on("error", (err) => {
                logCrosscode("ngrok error: " + err.message)
                debug("ngrok error", { error: err.message })
            })
            ngrok.stdout?.on("data", d => { ngrokLogStream.write(d); cloudflaredLogStream.write(d) })
            ngrok.stderr?.on("data", d => { ngrokLogStream.write(d); cloudflaredLogStream.write(d) })

            const pollNgrokApi = () => {
                debug("polling ngrok API")
                const req = http.get("http://127.0.0.1:4040/api/tunnels", { agent: proxyAgent }, (res) => {
                    let data = ""
                    res.on("data", chunk => data += chunk)
                    res.on("end", () => {
                        debug("ngrok API response", { size: data.length })
                        try {
                            const json = JSON.parse(data)
                            if (json.tunnels && json.tunnels.length > 0 && !tunnelUrl) {
                                tunnelUrl = json.tunnels[0].public_url
                                spinner.succeed(chalk.green("Tunnel ready"))
                                logCrosscode("ngrok tunnel ready: " + tunnelUrl)
                                debug("ngrok tunnel ready", { tunnelUrl })

                                const payload = encodeQrPayload({
                                    url: tunnelUrl,
                                    token: sessionToken,
                                    v: 1
                                })

                                if (opencodePort !== port) {
                                    console.log(chalk.yellow(`opencode running on port ${opencodePort}`))
                                }
                                console.log(chalk.cyanBright("\n Scan with CrossCode App:"))
                                qrcode.generate(payload, { small: true })
                                console.log(chalk.grey(`URL: ${tunnelUrl}`))
                                console.log(chalk.dim.bold("[Press 'l' for logs  •  'h' for help  •  Ctrl+C to exit]"))
                            }
                        } catch (e) {
                            debug("ngrok API parse error", { error: e instanceof Error ? e.message : String(e) })
                            setTimeout(pollNgrokApi, 500)
                        }
                    })
                })
                req.on("error", (e) => {
                    debug("ngrok API request error", { error: e.message })
                    setTimeout(pollNgrokApi, 500)
                })
            }

            setTimeout(pollNgrokApi, 1000)
        })
    } else if (tunnelProvider === "cloudflared" || tunnelFailed) {
        const spinner = ora(chalk.blue("Starting ", chalk.italic("opencode serve"))).start()

        const sessionToken = crypto.randomBytes(32).toString("hex")
        logCrosscode(`Session token generated (censored: ${censorToken(sessionToken)})`)
        debug("session token generated", { length: sessionToken.length })

        const opencode = spawnCmd("opencode", ["serve", "--print-logs", "--log-level", "DEBUG", "--port", String(port), "--hostname", "127.0.0.1"], {
            cwd: process.cwd(),
            env: { ...process.env, OPENCODE_SERVER_PASSWORD: sessionToken },
            stdio: ["ignore", "pipe", "pipe"]
        })

        children.push(opencode)

        let opencodePort = port

        opencode.on("spawn", () => {
            spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Detecting port...")
            logCrosscode("opencode serve started (PID: " + opencode.pid + ")")
            debug("opencode spawned", { pid: opencode.pid })
        })
        opencode.on("error", (err) => {
            spinner.fail(chalk.red.italic("Failed to start opencode serve"))
            logCrosscode("opencode serve error: " + err.message)
            debug("opencode spawn error", { error: err.message })
        })

        let proxyPort = await getFreePort()
        while (proxyPort === port) proxyPort = await getFreePort()

        waitForOpencodePort({ proc: opencode, requestedPort: port, onData: d => opencodeLogStream.write(d) }).then((detectedPort) => {
            opencodePort = detectedPort
            if (detectedPort !== port) {
                logCrosscode(`Using detected port ${detectedPort} instead of requested port ${port}`)
                debug("using detected port", { detected: detectedPort, requested: port })
            }

            const proxy = http.createServer(async (req, res) => {
                const safePath = sanitizeUrlPath(req.url)
                const targetUrl = `http://127.0.0.1:${detectedPort}${safePath}`
                const authHeader = req.headers["authorization"]

                debug("cf-proxy request received", {
                    method: req.method,
                    url: req.url,
                    safePath,
                    hasAuth: !!authHeader,
                    auth: censorAuth(authHeader),
                })

                if (req.method === "OPTIONS") {
                    debug("handling CORS preflight")
                    res.writeHead(204, {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, Authorization",
                        "Access-Control-Max-Age": "86400",
                    })
                    res.end()
                    return
                }

                if (req.url === "/mobile-event" && req.method === "POST") {
                    debug("handling SSE request")
                    res.writeHead(200, {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "Access-Control-Allow-Origin": "*",
                    })

                    let sseAuth = authHeader || ""
                    if (sseAuth && !sseAuth.startsWith("Basic ")) {
                        sseAuth = `Basic ${Buffer.from(`:${sseAuth}`).toString("base64")}`
                        debug("converted SSE auth to Basic format")
                    }

                    const sseReq = http.get(`http://127.0.0.1:${detectedPort}/event`, {
                        headers: {
                            "Accept": "text/event-stream",
                            "Authorization": sseAuth,
                        },
                    }, (sseRes) => {
                        debug("SSE upstream connected", { status: sseRes.statusCode })
                        sseRes.on("data", (chunk) => {
                            res.write(chunk)
                        })
                        sseRes.on("end", () => {
                            debug("SSE upstream ended")
                            res.end()
                        })
                    })

                    sseReq.on("error", (err) => {
                        debug("SSE upstream error", { error: err.message })
                        res.end()
                    })

                    req.on("close", () => {
                        debug("SSE client disconnected")
                        sseReq.destroy()
                    })

                    return
                }

                if (await handleGitRequest(req, res, { worktree: process.cwd(), sessionToken })) {
                    return
                }

                const forwardHeaders: Record<string, string | string[]> = {}
                for (const [key, value] of Object.entries(req.headers)) {
                    if (!HOP_BY_HOP.has(key.toLowerCase())) forwardHeaders[key] = value
                }
                forwardHeaders["host"] = `127.0.0.1:${detectedPort}`
                
                if (req.headers["authorization"] && !req.headers["authorization"].startsWith("Basic ")) {
                    const token = req.headers["authorization"]
                    forwardHeaders["authorization"] = `Basic ${Buffer.from(`:${token}`).toString("base64")}`
                    debug("converted auth to Basic format")
                }

                let bodySize = 0
                const bodyChunks: Buffer[] = []
                
                req.on("data", (chunk) => {
                    bodySize += chunk.length
                    if (bodySize > MAX_BODY_SIZE) {
                        debug("request body too large", { size: bodySize, max: MAX_BODY_SIZE })
                        req.destroy()
                        res.writeHead(413)
                        res.end("Request body too large")
                        return
                    }
                    bodyChunks.push(chunk)
                })

                req.on("end", () => {
                    const body = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : null
                    
                    debug("forwarding to opencode", {
                        targetUrl,
                        method: req.method,
                        hasAuth: !!forwardHeaders["authorization"],
                        auth: censorAuth(forwardHeaders["authorization"] as string),
                        bodySize: body?.length ?? 0,
                    })

                    const proxyReq = http.request(targetUrl, {
                        method: req.method,
                        headers: forwardHeaders,
                        agent: proxyAgent,
                    }, (proxyRes) => {
                        debug("opencode responded", { status: proxyRes.statusCode, method: req.method, path: safePath })
                        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers)
                        proxyRes.pipe(res)
                    })

                    proxyReq.on("error", (err) => {
                        debug("proxy request error", { error: err.message })
                        res.writeHead(502)
                        res.end("Bad Gateway")
                    })

                    if (body) proxyReq.write(body)
                    proxyReq.end()
                })

                req.on("error", (err) => {
                    debug("request stream error", { error: err.message })
                    if (!res.headersSent) {
                        res.writeHead(500)
                        res.end("Internal Server Error")
                    }
                })
            })

            proxy.listen(proxyPort, "127.0.0.1", () => {
                logCrosscode(`SSE proxy started on port ${proxyPort}`)
                debug("proxy listening", { port: proxyPort, targetPort: detectedPort })
                spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Waiting for Cloudflare tunnel...")

                const cf = spawnCmd("cloudflared", [
                    "tunnel",
                    "--no-autoupdate",
                    "--config", "/dev/null",
                    "--url", `http://127.0.0.1:${proxyPort}`
                ], {
                    stdio: ["ignore", "pipe", "pipe"]
                })

                children.push(cf)

                cf.on("spawn", () => {
                    logCrosscode("cloudflared started (PID: " + cf.pid + ")")
                    debug("cloudflared spawned", { pid: cf.pid })
                })
                cf.on("error", (err) => {
                    logCrosscode("cloudflared error: " + err.message)
                    debug("cloudflared error", { error: err.message })
                })

                cf.stdout?.on("data", d => cloudflaredLogStream.write(d))

                cf.stderr?.on("data", (data: Buffer) => {
                    const text = data.toString()

                    const m = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/)

                    if (m && !tunnelUrl) {
                        tunnelUrl = m[0]
                        spinner.succeed(chalk.green("Tunnel ready"))
                        logCrosscode("Cloudflare tunnel ready: " + tunnelUrl)
                        debug("cloudflare tunnel ready", { tunnelUrl })

                        const payload = encodeQrPayload({
                            url: tunnelUrl,
                            token: sessionToken,
                            v: 1
                        })

                        if (opencodePort !== port) {
                            console.log(chalk.yellow(`opencode running on port ${opencodePort}`))
                        }
                        console.log(chalk.cyanBright("\n Scan with CrossCode App:"))

                        qrcode.generate(payload, { small: true })

                        console.log(chalk.grey(`URL: ${tunnelUrl}`))
                        console.log(chalk.dim.bold("[Press 'l' for logs  •  'h' for help  •  Ctrl+C to exit]"))
                    }

                    cloudflaredLogStream.write(data)
                })
            })
        })
    }

    const toggleLogs = async () => {
        logsVisible = !logsVisible
        if (logsVisible) {
            try {
                const [crosscodeContent, cloudflaredContent, opencodeContent] = await Promise.all([
                    readFile(crosscodeLogFile, "utf-8").catch(() => ""),
                    readFile(cloudflaredLogFile, "utf-8").catch(() => ""),
                    readFile(opencodeLogFile, "utf-8").catch(() => ""),
                ])

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

    const shutdown = (source?: string) => {
        console.log(chalk.yellow("\nShutting down..."))
        logCrosscode(`Shutting down... (source: ${source || "unknown"})`)
        debug("shutdown initiated", { source: source || "unknown" })
        crosscodeLogStream.end()
        cloudflaredLogStream.end()
        ngrokLogStream.end()
        opencodeLogStream.end()
        proxyAgent.destroy()
        children.forEach(c => c.kill())
        cleanupKeypress()
        process.exit(0)
    }

    process.on("SIGINT", () => shutdown("SIGINT"))
    process.on("SIGTERM", () => shutdown("SIGTERM"))
    process.on("exit", (code) => {
        logCrosscode(`Process exit event (code: ${code})`)
    })
    process.stdin.on("end", () => {
        logCrosscode("stdin end event")
        debug("stdin end event")
    })
    process.stdin.on("close", () => {
        logCrosscode("stdin close event")
        debug("stdin close event")
    })

    onKeypress((key: string) => {
        if (key === "l")
            toggleLogs()
        else if (key === "ctrl-c")
            shutdown("ctrl-c keypress")
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
        proxyAgent.destroy()
        process.exit(1)
    })
