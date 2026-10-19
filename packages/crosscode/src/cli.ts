#!/usr/bin/env node

import { readFile } from "fs/promises"
import chalk from "chalk"
import { debug, checkDep, setLogWriter, getFreePort, terminateChild, openBrowser, maskEmail } from "./util"
import { logCrosscode, closeAllLogs, crosscodeLogFile, cloudflaredLogFile, opencodeLogFile } from "./log"
import { startConnectionServer, closeConnectionServer, connectionPageUrl, setConnectionInfo } from "./connection-page"
import { readConfig, saveConfig, getProjectConfig, ensureSessionToken, resolveOpencodeBin } from "./config"
import type { TunnelPreference } from "./config"
import { promptTunnelChoice, promptRememberChoice } from "./tunnel-setup"
import { initSentry, captureCliError } from "./sentry"
import * as Sentry from "@sentry/node"
import { loginFlow, refreshTier } from "./auth"
import { printTunnelQr as renderTunnelQr } from "./qr"
import { proxyAgent } from "./proxy"
import { onKeypress, cleanupKeypress } from "./keypress"
import { startTunnelProvider } from "./providers/tunnel"
import { startCloudflaredProvider } from "./providers/cloudflared"
import { startNgrokProvider } from "./providers/ngrok"

const children: import("child_process").ChildProcess[] = []
let isShuttingDown = false
let browserOpened = false

setLogWriter(logCrosscode)

function printTunnelQr(url: string, token: string, opencodePort: number, requestedPort: number) {
    // Keep the page in sync across reconnects and provider fallbacks. The
    // connection page server itself is stable, so only open the browser once.
    setConnectionInfo({ url, token, ready: true })

    const argv = process.argv.slice(2)
    const noOpen = argv.includes("--no-open") || process.env.CROSSCODE_NO_OPEN === "1"
    const pageUrl = connectionPageUrl()
    const openedNow = !browserOpened && !!pageUrl && !!process.stdout.isTTY && !noOpen && openBrowser(pageUrl)
    if (openedNow) browserOpened = true

    if (browserOpened && pageUrl) {
        if (opencodePort !== requestedPort) {
            console.log(chalk.yellow(`opencode running on port ${opencodePort}`))
        }
        console.log(chalk.cyanBright("\n Scan with CrossCode App:"))
        console.log(chalk.green(`   Browser opened: ${pageUrl}`))
        console.log(chalk.dim("   Scan the QR, or copy the URL/token from that page."))
        console.log(chalk.grey(`   URL: ${url}`))
        console.log(chalk.yellow.bold("   Don't close this terminal — closing it disconnects the app."))
        console.log(chalk.dim.bold("[Press 'l' for logs  •  'h' for help  •  Ctrl+C to exit]"))
        return
    }

    if (pageUrl) console.log(chalk.grey(`   Open in your browser: ${pageUrl}`))
    renderTunnelQr(url, token, opencodePort, requestedPort, {
        disabled: argv.includes("--no-qr"),
        small: argv.includes("--small-qr") || process.env.CROSSCODE_QR_SMALL === "1",
    })
    console.log(chalk.yellow.bold("   Don't close this terminal — closing it disconnects the app."))
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
            console.log(chalk.yellow(`\n Logged out ${maskEmail(config.auth.email)}\n`))
            delete config.auth
            saveConfig(config)
        } else {
            console.log(chalk.dim("\n Not logged in.\n"))
        }
        process.exit(0)
    }

    if (command === "status") {
        if (config.auth?.sessionToken) {
            console.log(chalk.green(`\n Logged in as ${maskEmail(config.auth.email)}`))
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
  ${chalk.green("--no-open")}          Don't auto-open the connection page in a browser
  ${chalk.green("--no-qr")}            Skip QR graphic, print URL only
  ${chalk.green("--small-qr")}         Compact QR graphic (smaller margin)
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
    const useCrosscodeTunnel = args.includes("--tunnel") || args.includes("--crosscode")
    const canUseTunnel = !!(config.auth?.sessionToken)

    let tunnelChoice: TunnelPreference | null = null
    let choiceFromPrompt = false
    if (useNgrok) tunnelChoice = "ngrok"
    else if (useCloudflared) tunnelChoice = "cloudflared-quick"
    else if (useCrosscodeTunnel) tunnelChoice = "crosscode"
    else if (config.tunnelPreference) tunnelChoice = config.tunnelPreference
    else if (canUseTunnel) tunnelChoice = "crosscode"
    else if (process.stdout.isTTY && process.stdin.isTTY) {
        tunnelChoice = await promptTunnelChoice()
        choiceFromPrompt = true
    } else {
        tunnelChoice = "cloudflared-quick"
    }

    // CrossCode dedicated tunnel requires login. Offer it inline so the
    // user never has to leave the flow to figure out the `login` command.
    if (tunnelChoice === "crosscode" && !config.auth?.sessionToken) {
        const success = await loginFlow(config)
        if (!success) {
            console.log(chalk.red("\n Login required for CrossCode tunnel.\n"))
            process.exit(1)
        }
        await refreshTier(config)
    }

    if (choiceFromPrompt && tunnelChoice) {
        try {
            if (await promptRememberChoice()) {
                config.tunnelPreference = tunnelChoice
                saveConfig(config)
                logCrosscode(`Tunnel preference saved: ${tunnelChoice}`)
            }
        } catch {
            // Non-fatal: continue with the one-time choice.
        }
    }

    const tunnelProvider = tunnelChoice === "ngrok" ? "ngrok" : (tunnelChoice === "crosscode" ? "tunnel" : "cloudflared")
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

    try {
        const connectionPort = await startConnectionServer()
        logCrosscode(`Connection page server started on http://127.0.0.1:${connectionPort}/`)
    } catch (err) {
        debug("connection page server failed to start", { error: err instanceof Error ? err.message : String(err) })
    }

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
    const launchCloudflaredFallback = async () => {
        await Promise.all(children.map(terminateChild))
        children.length = 0
        await startCloudflaredProvider(
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
            onFallbackNeeded: () => { void launchCloudflaredFallback().catch(handleFatalError) },
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
        await Promise.all(children.map(terminateChild))
        cleanupKeypress()
        closeConnectionServer()
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

async function handleFatalError(err: unknown) {
    console.error(chalk.red(err))
    logCrosscode("Fatal error: " + (err instanceof Error ? err.message : String(err)))
    await Promise.all(children.map(terminateChild))
    try {
        captureCliError(err)
        await Sentry.flush(2000)
    } catch {}
    closeConnectionServer()
    proxyAgent.destroy()
    await closeAllLogs()
    process.exit(1)
}

main().catch(handleFatalError)
