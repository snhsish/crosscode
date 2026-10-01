#!/usr/bin/env node

import { readFile } from "fs/promises"
import chalk from "chalk"
import qrcode from "qrcode-terminal"
import { encodeQrPayload } from "@crosscode/shared"
import { debug, checkDep, setLogWriter, getFreePort } from "./util"
import { logCrosscode, closeAllLogs, crosscodeLogFile, cloudflaredLogFile, opencodeLogFile } from "./log"
import { readConfig, saveConfig, getProjectConfig, ensureSessionToken, resolveOpencodeBin } from "./config"
import { initSentry, captureCliError } from "./sentry"
import * as Sentry from "@sentry/node"
import { loginFlow, refreshTier } from "./auth"
import { proxyAgent } from "./proxy"
import { onKeypress, cleanupKeypress } from "./keypress"
import { startTunnelProvider } from "./providers/tunnel"
import { startCloudflaredProvider } from "./providers/cloudflared"
import { startNgrokProvider } from "./providers/ngrok"

const children: import("child_process").ChildProcess[] = []
let isShuttingDown = false

setLogWriter(logCrosscode)

function printTunnelQr(url: string, token: string, opencodePort: number, requestedPort: number) {
    const payload = encodeQrPayload({ url, token, v: 1 })
    if (opencodePort !== requestedPort) {
        console.log(chalk.yellow(`opencode running on port ${opencodePort}`))
    }
    console.log(chalk.cyanBright("\n Scan with CrossCode App:"))
    qrcode.generate(payload, { small: true })
    console.log(chalk.grey(`URL: ${url}`))
    console.log(chalk.dim.bold("[Press 'l' for logs  •  'h' for help  •  Ctrl+C to exit]"))
}

function printHelp() {
    console.log(chalk.cyan("\n CrossCode Keybindings:\n"))
    console.log(`  ${chalk.green("l")}  Toggle log viewer`)
    console.log(`  ${chalk.green("h")}  Show this help`)
    console.log(`  ${chalk.green("Ctrl+C")}  Shut down`)
    console.log()
}

async function main() {
    const args = process.argv.slice(2)
    const config = readConfig()
    initSentry(config)
    await refreshTier(config)
    const command = args[0]

    if (command === "telemetry") {
        if (args[1] === "enable") {
            config.telemetry = true
            saveConfig(config)
            console.log(chalk.green("\n Telemetry enabled (requires CROSSCODE_SENTRY_DSN).\n"))
        } else if (args[1] === "disable") {
            config.telemetry = false
            saveConfig(config)
            console.log(chalk.dim("\n Telemetry disabled.\n"))
        } else {
            console.log(chalk.dim(`\n Telemetry: ${config.telemetry === true ? "enabled" : "disabled"} (CROSSCODE_SENTRY_DSN ${process.env.CROSSCODE_SENTRY_DSN ? "set" : "not set"})\n`))
        }
        process.exit(0)
    }

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
  ${chalk.green("telemetry")}          Enable/disable error reporting (enable|disable)
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
    initSentry(config, { tunnelProvider })
    Sentry.setTag("tunnelProvider", tunnelProvider)
    const project = getProjectConfig(config)
    const port = project.port || await getFreePort()

    let missingDep = false
    let logsVisible = false
    let tunnelUrl = ""

    logCrosscode(`CrossCode starting up (tunnel: ${tunnelProvider}, debug: ${process.env.CROSSCODE_DEBUG === "1"})`)
    debug("startup config", { tunnelProvider, port, hasAuth: !!config.auth?.sessionToken })

    const opencodeBin = resolveOpencodeBin(config)
    logCrosscode(`Using opencode binary: ${opencodeBin}`)
    debug("opencode binary", { opencodeBin })

    if (!checkDep(opencodeBin)) {
        console.error(chalk.red(`[DEPENDENCY ERROR] ${opencodeBin} not found. Install opencode and try again.`))
        console.log(chalk.dim(`Override the binary with "opencodeBin" in ~/.crosscode/config.json or CROSSCODE_OPENCODE_BIN.`))
        logCrosscode(`Dependency check failed: ${opencodeBin}`)
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

    // Fix C1: cloudflared fallback is invoked as a function, not gated behind an
    // else-if that already evaluated before the async tunnel error occurs.
    const launchCloudflaredFallback = () => {
        children.forEach(c => c.kill())
        children.length = 0
        startCloudflaredProvider(
            config, project, port, children,
            () => isShuttingDown,
            (url) => { tunnelUrl = url },
            printTunnelQr,
        )
    }

    if (tunnelProvider === "tunnel") {
        await startTunnelProvider(config, project, port, children, {
            onTunnelUrl: (url) => { tunnelUrl = url },
            printQr: printTunnelQr,
            onFallbackNeeded: launchCloudflaredFallback,
        })
    } else if (tunnelProvider === "ngrok") {
        await startNgrokProvider(
            config, project, port, children,
            (url) => { tunnelUrl = url },
            printTunnelQr,
        )
    } else {
        await startCloudflaredProvider(
            config, project, port, children,
            () => isShuttingDown,
            (url) => { tunnelUrl = url },
            printTunnelQr,
        )
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

    // Fix I1: await log stream flush before exiting
    const shutdown = async (source?: string) => {
        if (isShuttingDown) return
        isShuttingDown = true
        console.log(chalk.yellow("\nShutting down..."))
        logCrosscode(`Shutting down... (source: ${source || "unknown"})`)
        debug("shutdown initiated", { source: source || "unknown" })
        children.forEach(c => c.kill())
        cleanupKeypress()
        proxyAgent.destroy()
        await closeAllLogs()
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

    // Fix M2: 'h' keypress now handled
    onKeypress((key: string) => {
        if (key === "l")
            toggleLogs()
        else if (key === "h")
            printHelp()
        else if (key === "ctrl-c")
            shutdown("ctrl-c keypress")
    })
}

main()
    .catch(async err => {
        console.error(chalk.red(err))
        logCrosscode("Fatal error: " + (err instanceof Error ? err.message : String(err)))
        try {
            captureCliError(err)
            await Sentry.flush(2000)
        } catch {}
        proxyAgent.destroy()
        await closeAllLogs()
        process.exit(1)
    })
