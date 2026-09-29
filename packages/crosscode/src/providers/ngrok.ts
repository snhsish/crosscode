import type { ChildProcess } from "child_process"
import http from "http"
import chalk from "chalk"
import ora from "ora"
import { debug, spawnCmd } from "../util"
import { logCrosscode, ngrokLogStream, cloudflaredLogStream } from "../log"
import { proxyAgent } from "../proxy"
import { startOpencode } from "../opencode"
import type { Config, ProjectConfig } from "../config"
import { ensureSessionToken, saveConfig, resolveOpencodeBin } from "../config"
import { setupNgrokToken } from "../auth"

export async function startNgrokProvider(
    config: Config,
    project: ProjectConfig,
    port: number,
    children: ChildProcess[],
    onTunnelUrl: (url: string) => void,
    printQr: (url: string, token: string, opencodePort: number, requestedPort: number) => void,
) {
    let ngrokToken = config.ngrokToken

    if (!ngrokToken) {
        ngrokToken = await setupNgrokToken()
        config.ngrokToken = ngrokToken
        saveConfig(config)
        logCrosscode("ngrok auth token saved")
        debug("ngrok token saved")
    }

    const spinner = ora(chalk.blue("Starting ", chalk.italic("opencode serve"))).start()
    const sessionToken = ensureSessionToken(config, project)
    const opencodeBin = resolveOpencodeBin(config)

    const { detectedPort } = await startOpencode({ port, sessionToken, spinner, children, opencodeBin })

    const ngrok = spawnCmd("ngrok", ["http", `--authtoken=${ngrokToken}`, `${detectedPort}`], {
        stdio: ["ignore", "pipe", "pipe"],
    })

    children.push(ngrok)

    ngrok.on("spawn", () => {
        logCrosscode("ngrok started (PID: " + ngrok.pid + ")")
        spinner.text = chalk.green.italic(`${opencodeBin} serve running`) + chalk.yellow.italic("  •  Starting ngrok tunnel...")
        debug("ngrok spawned", { pid: ngrok.pid })
    })
    ngrok.on("error", (err) => {
        logCrosscode("ngrok error: " + err.message)
        debug("ngrok error", { error: err.message })
    })
    ngrok.stdout?.on("data", d => { ngrokLogStream.write(d); cloudflaredLogStream.write(d) })
    ngrok.stderr?.on("data", d => { ngrokLogStream.write(d); cloudflaredLogStream.write(d) })

    let tunnelUrl = ""

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
                        onTunnelUrl(tunnelUrl)
                        printQr(tunnelUrl, sessionToken, detectedPort, port)
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
}
