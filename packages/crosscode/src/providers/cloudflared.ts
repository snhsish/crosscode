import type { ChildProcess } from "child_process"
import { execFile } from "child_process"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import chalk from "chalk"
import ora from "ora"
import { debug, getFreePort, spawnCmd } from "../util"
import { logCrosscode, cloudflaredLogStream, cloudflaredTunnelDir, cfCertPath } from "../log"
import { createOpencodeProxy } from "../proxy"
import { startOpencode } from "../opencode"
import type { Config, ProjectConfig, CloudflaredTunnel } from "../config"
import { ensureSessionToken, ensureProjectId, saveProjectConfig } from "../config"

// Use a persistent named cloudflared tunnel so the public URL is stable
// (<tunnelId>.cfargotunnel.com) across restarts and reconnects, instead of
// the random ephemeral quick tunnel that rotates its URL on every (re)start.
async function ensureCloudflaredNamedTunnel(
    config: Config,
    project?: ProjectConfig,
): Promise<CloudflaredTunnel | null> {
    if (!existsSync(cfCertPath)) {
        debug("cloudflared not logged in (no cert.pem); falling back to quick tunnel")
        return null
    }
    const target = project ?? (() => { throw new Error("project required") })()
    if (target.cloudflaredTunnel && existsSync(target.cloudflaredTunnel.credentialsPath)) {
        return target.cloudflaredTunnel
    }
    const projectId = ensureProjectId(config, target)
    const name = `crosscode-${projectId}`
    const credentialsPath = join(cloudflaredTunnelDir, `${name}.json`)
    try {
        if (!existsSync(cloudflaredTunnelDir)) mkdirSync(cloudflaredTunnelDir, { recursive: true, mode: 0o700 })
        await new Promise<void>((resolve, reject) => {
            execFile("cloudflared", ["tunnel", "create", "--credentials-file", credentialsPath, name], (err: Error | null) => {
                if (err) reject(err)
                else resolve()
            })
        })
    } catch (e) {
        debug("cloudflared tunnel create failed", { error: (e as Error).message })
        return null
    }
    let url = ""
    try {
        const creds = JSON.parse(readFileSync(credentialsPath, "utf-8"))
        const id = creds.TunnelID || creds.id
        if (id) url = `https://${id}.cfargotunnel.com`
    } catch {}
    target.cloudflaredTunnel = { name, credentialsPath, url }
    saveProjectConfig(config)
    logCrosscode(`Cloudflared named tunnel created: ${name} (${url})`)
    return target.cloudflaredTunnel
}

export async function startCloudflaredProvider(
    config: Config,
    project: ProjectConfig,
    port: number,
    children: ChildProcess[],
    isShuttingDown: () => boolean,
    onTunnelUrl: (url: string) => void,
    printQr: (url: string, token: string, opencodePort: number, requestedPort: number) => void,
) {
    const spinner = ora(chalk.blue("Starting ", chalk.italic("opencode serve"))).start()
    const sessionToken = ensureSessionToken(config, project)

    const { detectedPort, serverVersion } = await startOpencode({ port, sessionToken, spinner, children })

    let proxyPort = await getFreePort()
    while (proxyPort === port) proxyPort = await getFreePort()

    const proxy = createOpencodeProxy(detectedPort, sessionToken, "cf-proxy", serverVersion)

    proxy.listen(proxyPort, "127.0.0.1", async () => {
        logCrosscode(`SSE proxy started on port ${proxyPort}`)
        debug("proxy listening", { port: proxyPort, targetPort: detectedPort })
        spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Waiting for Cloudflare tunnel...")

        const namedTunnel = await ensureCloudflaredNamedTunnel(config, project)
        if (!namedTunnel) {
            logCrosscode("Using ephemeral quick tunnel (URL changes on restart). Run `cloudflared tunnel login` once for a stable, persistent URL.")
        }

        let tunnelUrl = ""

        function setTunnelUrl(url: string) {
            if (tunnelUrl) return
            tunnelUrl = url
            spinner.succeed(chalk.green("Tunnel ready"))
            logCrosscode("Cloudflare tunnel ready: " + tunnelUrl)
            debug("cloudflare tunnel ready", { tunnelUrl })
            onTunnelUrl(tunnelUrl)
            printQr(tunnelUrl, sessionToken, detectedPort, port)
        }

        function startCloudflared(): ChildProcess {
            let cfArgs: string[]
            if (namedTunnel) {
                const cfgPath = join(cloudflaredTunnelDir, `${namedTunnel.name}.yml`)
                writeFileSync(cfgPath, `url: http://127.0.0.1:${proxyPort}\ntunnel: ${namedTunnel.name}\ncredentials-file: ${namedTunnel.credentialsPath}\n`, { mode: 0o600 })
                cfArgs = ["tunnel", "--no-autoupdate", "--config", cfgPath, "run"]
            } else {
                cfArgs = ["tunnel", "--no-autoupdate", "--config", "/dev/null", "--url", `http://127.0.0.1:${proxyPort}`]
            }

            const cf = spawnCmd("cloudflared", cfArgs, { stdio: ["ignore", "pipe", "pipe"] })
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
                const m = text.match(/https:\/\/[a-zA-Z0-9.-]+\.(trycloudflare|cfargotunnel)\.com/)
                if (m && !tunnelUrl) setTunnelUrl(m[0])
                cloudflaredLogStream.write(data)
            })

            cf.on("exit", (code) => {
                logCrosscode("cloudflared exited (code: " + code + ")")
                if (isShuttingDown()) return
                if (namedTunnel) {
                    logCrosscode("Restarting cloudflared (named tunnel keeps stable URL)")
                    console.log(chalk.yellow("\n Cloudflare tunnel dropped — reconnecting (URL unchanged)...\n"))
                    startCloudflared()
                } else {
                    console.log(chalk.red("\n Cloudflare tunnel exited. The session URL may have changed — restart crosscode to reconnect.\n"))
                }
            })

            return cf
        }

        const cf = startCloudflared()

        if (namedTunnel?.url && !tunnelUrl) {
            const urlFallbackTimer = setTimeout(() => {
                if (!tunnelUrl) setTunnelUrl(namedTunnel.url)
            }, 8000)
            cf.on("exit", () => clearTimeout(urlFallbackTimer))
        }
    })
}
