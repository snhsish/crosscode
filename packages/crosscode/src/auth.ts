import chalk from "chalk"
import ora from "ora"
import type { Config } from "./config"
import { saveConfig } from "./config"
import { debug, openBrowser, maskEmail } from "./util"

const WEB_URL = process.env.CROSSCODE_WEB_URL || "https://crosscode.site"
const AUTH_API_URL = process.env.CROSSCODE_AUTH_URL || `${WEB_URL}/api/auth`

export function promptInput(prompt: string): Promise<string> {
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

export async function validateApiKey(apiKey: string): Promise<{ email: string; name: string; tier: string } | null> {
    try {
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
        const data = await response.json() as { email: string; name: string; tier: string }
        debug("API key validated", { email: data.email, tier: data.tier })
        return { email: data.email, name: data.name, tier: data.tier }
    } catch (err) {
        debug("API key validation error", { error: err instanceof Error ? err.message : String(err) })
        console.log(chalk.dim(`\n Connection failed: ${err instanceof Error ? err.message : err}`))
        return null
    }
}

export async function refreshTier(config: Config): Promise<void> {
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

export async function loginFlow(config: Config): Promise<boolean> {
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

    console.log(chalk.green(`\n Logged in as ${maskEmail(result.email)}`))
    console.log(chalk.dim(` Tier: ${result.tier}\n`))
    return true
}

// Fix I2: use promptInput instead of raw stdin listener for consistency
export async function setupNgrokToken(): Promise<string> {
    console.log(chalk.cyan("\n ngrok requires a free auth token.\n"))
    console.log(chalk.white(" 1. Sign up at: ") + chalk.underline.blue("https://dashboard.ngrok.com/signup"))
    console.log(chalk.white(" 2. Get your token at: ") + chalk.underline.blue("https://dashboard.ngrok.com/get-started/your-authtoken"))
    console.log()

    const token = (await promptInput(chalk.yellow(" Paste your ngrok auth token: "))).trim()
    return token
}
