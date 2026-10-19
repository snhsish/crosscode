#!/usr/bin/env node

import chalk from "chalk"
import { debug, checkDep, setLogWriter, getFreePort, terminateChild, openBrowser, maskEmail } from "./util"
import { logCrosscode, closeAllLogs } from "./log"
import { startConnectionServer, closeConnectionServer, connectionPageUrl, setConnectionInfo } from "./connection-page"
import { readConfig, saveConfig, getProjectConfig, ensureSessionToken, resolveOpencodeBin } from "./config"
import type { TunnelPreference } from "./config"
import { promptTunnelChoice, promptRememberChoice, shouldShowProUpsell } from "./tunnel-setup"
import { initSentry, captureCliError } from "./sentry"
import * as Sentry from "@sentry/node"
import { loginFlow, refreshTier } from "./auth"
import { printTunnelQr as renderTunnelQr } from "./qr"
import { proxyAgent } from "./proxy"
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
        console.log(chalk.yellow.bold("   Don't close this terminal. Closing it disconnects the app."))
        console.log(chalk.dim("   Press Ctrl+C to exit."))
        return
    }

    if (pageUrl) console.log(chalk.grey(`   Open in your browser: ${pageUrl}`))
    renderTunnelQr(url, token, opencodePort, requestedPort, {
        disabled: argv.includes("--no-qr"),
        small: argv.includes("--small-qr") || process.env.CROSSCODE_QR_SMALL === "1",
    })
    console.log(chalk.yellow.bold("   Don't close this terminal. Closing it disconnects the app."))
    console.log(chalk.dim("   Press Ctrl+C to exit."))
}

function printProUpsell() {
    console.log(chalk.dim("   Upgrade to CrossCode Pro for a stable URL and unlimited connections: https://crosscode.site/pricing"))
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
  ${chalk.green("--cloudflared")}      Use Cloudflare tunnel
  ${chalk.green("--ngrok")}            Use ngrok tunnel (requires auth token)
  ${chalk.green("--tunnel")}           Use CrossCode dedicated tunnel (login required)
  ${chalk.green("--no-open")}          Don't auto-open the connection page in a browser
  ${chalk.green("--no-qr")}            Skip QR graphic, print URL only
  ${chalk.green("--small-qr")}         Compact QR graphic (smaller margin)
  ${chalk.green("--help, -h")}         Show this help message

${chalk.yellow.bold("EXAMPLES:")}
  ${chalk.dim("$")} crosscode                   Start (prompts for tunnel when logged out)
  ${chalk.dim("$")} crosscode --ngrok           Start with ngrok tunnel
  ${chalk.dim("$")} crosscode --cloudflared     Start with Cloudflare tunnel
  ${chalk.dim("$")} crosscode login             Authenticate for paid tier features
  ${chalk.dim("$")} crosscode status            Check authentication status

${chalk.yellow.bold("TUNNEL PROVIDERS:")}
  ${chalk.blue("CrossCode")}       Dedicated tunnel (login required, stable URL)
  ${chalk.blue("Cloudflare")}      Named tunnel (stable URL) or Quick tunnel (URL changes)
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
    let cloudflaredMode: "auto" | "named" | "quick" = "auto"
    if (useNgrok) tunnelChoice = "ngrok"
    else if (useCloudflared) { tunnelChoice = "cloudflared-quick"; cloudflaredMode = "auto" }
    else if (useCrosscodeTunnel) tunnelChoice = "crosscode"
    else if (config.tunnelPreference) {
        tunnelChoice = config.tunnelPreference
        if (tunnelChoice === "cloudflared-named") cloudflaredMode = "named"
        else if (tunnelChoice === "cloudflared-quick") cloudflaredMode = "quick"
    }
    else if (canUseTunnel) tunnelChoice = "crosscode"
    else if (process.stdout.isTTY && process.stdin.isTTY) {
        tunnelChoice = await promptTunnelChoice()
        choiceFromPrompt = true
        if (tunnelChoice === "cloudflared-named") cloudflaredMode = "named"
        else if (tunnelChoice === "cloudflared-quick") cloudflaredMode = "quick"
    } else {
        tunnelChoice = "cloudflared-quick"
        cloudflaredMode = "quick"
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
        console.log(chalk.green(`\n Logged in as ${maskEmail(config.auth.email)}`))
        console.log(chalk.dim(` Tier: ${config.auth.tier || "free"}\n`))
    } else {
        console.log(chalk.cyan(" Tip:") + chalk.dim(" run ") +
            chalk.cyan("npx crosscode login") +
            chalk.dim(" to use the free built-in CrossCode tunnel.\n"))
    }

    const printQrWithUpsell = (url: string, token: string, opencodePort: number, requestedPort: number) => {
        printTunnelQr(url, token, opencodePort, requestedPort)
        if (shouldShowProUpsell(config.auth?.tier, tunnelProvider)) printProUpsell()
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
            printQrWithUpsell,
            { mode: cloudflaredMode === "named" ? "named" : "quick" },
        )
    }

    if (tunnelProvider === "tunnel") {
        await startTunnelProvider(config, project, port, children, {
            onTunnelUrl: (url) => { tunnelUrl = url },
            printQr: printQrWithUpsell,
            onFallbackNeeded: () => { void launchCloudflaredFallback().catch(handleFatalError) },
        })
    } else if (tunnelProvider === "ngrok") {
        await startNgrokProvider(
            config, project, port, children,
            (url) => { tunnelUrl = url },
            printQrWithUpsell,
        )
    } else {
        await startCloudflaredProvider(
            config, project, port, children,
            () => isShuttingDown,
            (url) => { tunnelUrl = url },
            printQrWithUpsell,
            { mode: cloudflaredMode },
        )
    }

    // Fix I1: await log stream flush before exiting
    const shutdown = async (source?: string) => {
        if (isShuttingDown) return
        isShuttingDown = true
        console.log(chalk.yellow("\nShutting down..."))
        logCrosscode(`Shutting down... (source: ${source || "unknown"})`)
        debug("shutdown initiated", { source: source || "unknown" })
        await Promise.all(children.map(terminateChild))
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
