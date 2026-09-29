import type { ChildProcess } from "child_process"
import http from "http"
import chalk from "chalk"
import ora from "ora"
import { debug, getFreePort, spawnCmd } from "../util"
import { logCrosscode, cloudflaredLogStream } from "../log"
import { createOpencodeProxy, proxyAgent } from "../proxy"
import { startOpencode } from "../opencode"
import { connectTunnel } from "../tunnel-client"
import type { Config, ProjectConfig } from "../config"
import { ensureSessionToken, ensureProjectId } from "../config"

export type TunnelCallbacks = {
    onTunnelUrl: (url: string) => void
    printQr: (url: string, token: string, opencodePort: number, requestedPort: number) => void
    onFallbackNeeded: () => void
}

export async function startTunnelProvider(
    config: Config,
    project: ProjectConfig,
    port: number,
    children: ChildProcess[],
    callbacks: TunnelCallbacks,
) {
    const spinner = ora(chalk.blue("Starting ", chalk.italic("opencode serve"))).start()
    const sessionToken = ensureSessionToken(config, project)

    const { detectedPort, serverVersion } = await startOpencode({ port, sessionToken, spinner, children })

    let proxyPort = await getFreePort()
    while (proxyPort === port) proxyPort = await getFreePort()

    const proxy = createOpencodeProxy(detectedPort, sessionToken, "tunnel", serverVersion)

    proxy.listen(proxyPort, "127.0.0.1", () => {
        logCrosscode(`SSE proxy started on port ${proxyPort}`)
        debug("proxy listening", { port: proxyPort, targetPort: detectedPort })

        const testReq = http.request(`http://127.0.0.1:${detectedPort}${serverVersion >= 2 ? "/api/info" : "/global/health"}`, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${Buffer.from(`opencode:${sessionToken}`).toString("base64")}`,
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

        const projectId = ensureProjectId(config, project)
        logCrosscode(`Project ID: ${projectId}`)
        debug("connecting to tunnel", { projectId, proxyPort })

        let tunnelUrl = ""

        const tunnelTimeout = setTimeout(() => {
            spinner.fail(chalk.red.italic("Tunnel connection timed out"))
            logCrosscode("Tunnel connection timed out, falling back to cloudflared")
            debug("tunnel connection timeout")
            console.log(chalk.yellow("\n Falling back to Cloudflare tunnel...\n"))
            disconnectTunnel()
            callbacks.onFallbackNeeded()
        }, 15_000)

        const disconnectTunnel = connectTunnel(
            config.auth!.sessionToken!,
            projectId,
            proxyPort,
            config.tunnelWsUrl,
            (url) => {
                clearTimeout(tunnelTimeout)
                if (tunnelUrl) {
                    if (tunnelUrl !== url) {
                        tunnelUrl = url
                        logCrosscode("Tunnel URL changed: " + tunnelUrl)
                        console.log(chalk.yellow(`\n Tunnel URL changed: ${tunnelUrl}\n`))
                    }
                    return
                }
                tunnelUrl = url
                spinner.succeed(chalk.green("Tunnel ready"))
                logCrosscode("Tunnel ready: " + tunnelUrl)
                debug("tunnel connected", { tunnelUrl })
                callbacks.onTunnelUrl(tunnelUrl)
                callbacks.printQr(tunnelUrl, sessionToken, detectedPort, port)
            },
            (err) => {
                clearTimeout(tunnelTimeout)
                spinner.fail(chalk.red.italic(`Tunnel error: ${err.message}`))
                logCrosscode(`Tunnel error: ${err.message}, falling back to cloudflared`)
                debug("tunnel error", { error: err.message })
                console.log(chalk.yellow("\n Falling back to Cloudflare tunnel...\n"))
                disconnectTunnel()
                callbacks.onFallbackNeeded()
            },
        )
    })
}
