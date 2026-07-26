#!/usr/bin/env node

import { spawn, execSync } from "child_process"
import { createWriteStream, mkdirSync, existsSync, readFileSync } from "fs"
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

if (!existsSync(logDir))
    mkdirSync(logDir, {
        recursive: true
    })

const crosscodeLogFile = join(logDir, "crosscode.log")
const cloudflaredLogFile = join(logDir, "cloudflared.log")
const opencodeLogFile = join(logDir, "opencode.log")

const crosscodeLogStream = createWriteStream(crosscodeLogFile, { flags: "a" })
const cloudflaredLogStream = createWriteStream(cloudflaredLogFile, { flags: "a" })
const opencodeLogStream = createWriteStream(opencodeLogFile, { flags: "a" })

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

async function main() {
    let missingDep = false
    let logsVisible = false
    let tunnelUrl = ""

    logCrosscode("CrossCode starting up")

    for (const dep of ["opencode", "cloudflared"]) {
        if (!checkDep(dep)) {
            console.error(chalk.red(`[DEPENDENCY ERROR] ${dep} not found. Install ${dep} and try again.`))
            logCrosscode(`Dependency check failed: ${dep}`)
            missingDep = true
        }
    }

    if (missingDep) process.exit(1)

    logCrosscode("All dependencies found")

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

    // // proxying for authorization
    // const proxy = httpProxy.createProxyServer({ target: "http://127.0.0.1:4096" })
    
    // const server = http.createServer((req, res) => {
    //     const auth = req.headers["authorization"]

    //     console.log(auth, sessionToken)

    //     if (auth !== `Bearer ${sessionToken}`) {
    //         res.writeHead(401, { "Content-Type": "application/json" })
    //         res.end(JSON.stringify({ error: "Unauthorized" }))
    //         return
    //     }

    //     proxy.web(req, res)
    // })

    // server.listen(4097)

    const cf = spawn("cloudflared", [
        "tunnel",
        "--no-autoupdate",
        "--config", "/dev/null",
        "--url", "http://127.0.0.1:4096"
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
                console.log("\n" + chalk.yellow.bold("═══ CLOUDFLARED LOGS ═══"))
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
        opencodeLogStream.end()
        process.exit(1)
    })