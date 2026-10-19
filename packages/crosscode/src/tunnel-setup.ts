import chalk from "chalk"
import { checkDep } from "./util"
import { promptInput } from "./auth"
import type { TunnelPreference } from "./config"

export type TunnelChoice = TunnelPreference

function depStatus(bin: string): string {
    return checkDep(bin) ? "installed" : "not found"
}

export async function promptTunnelChoice(): Promise<TunnelChoice> {
    const cfStatus = depStatus("cloudflared")
    const ngrokStatus = depStatus("ngrok")

    console.log()
    console.log(chalk.cyan("How do you want to connect?"))
    console.log()
    console.log("1. CrossCode Tunnel (recommended): Zero installations or setup, login required, stable URL")
    console.log(`2. Cloudflared Named Tunnel (${cfStatus}): Stable URL`)
    console.log(`3. Cloudflared Quick Tunnel (${cfStatus}): Zero setup, URL changes`)
    console.log(`4. Ngrok (${ngrokStatus}): requires auth token`)
    console.log()

    for (;;) {
        const raw = (await promptInput("Select [1-4] (default 1): ")).trim()
        if (raw === "" || raw === "1") return "crosscode"
        if (raw === "2") return "cloudflared-named"
        if (raw === "3") return "cloudflared-quick"
        if (raw === "4") return "ngrok"
        console.log(chalk.yellow("Please enter a number between 1 and 4."))
    }
}

export async function promptRememberChoice(): Promise<boolean> {
    for (;;) {
        const raw = (await promptInput("Remember this tunnel choice so 'crosscode' starts instantly next time? [Y/n]: ")).trim().toLowerCase()
        if (raw === "" || raw === "y" || raw === "yes") return true
        if (raw === "n" || raw === "no") return false
        console.log(chalk.yellow("Please answer Y or n."))
    }
}

export async function maybeRememberTunnelChoice(
    config: { tunnelPreference?: TunnelPreference },
    save: () => void,
    choice: TunnelPreference | null,
    shouldAsk: boolean,
): Promise<void> {
    if (!shouldAsk || !choice) return
    try {
        if (await promptRememberChoice()) {
            config.tunnelPreference = choice
            save()
        }
    } catch {
        // Non-fatal: continue with the one-time choice.
    }
}

export function isPaidTier(tier: string | undefined): boolean {
    if (!tier) return false
    return tier.toLowerCase() !== "free"
}

export function shouldShowProUpsell(tier: string | undefined, provider: string): boolean {
    return !isPaidTier(tier) || provider !== "tunnel"
}
