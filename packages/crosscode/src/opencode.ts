import type { ChildProcess } from "child_process"
import type { Ora } from "ora"
import chalk from "chalk"
import { debug, spawnCmd } from "./util"
import { logCrosscode, opencodeLogStream } from "./log"
import { waitForOpencodePort } from "./port-detect"
import { detectOpencodeMajor, type OpencodeMajor } from "./opencode-version"

export type OpencodeInstance = {
    proc: ChildProcess
    detectedPort: number
    serverVersion: OpencodeMajor
}

export async function startOpencode(opts: {
    port: number
    sessionToken: string
    spinner: Ora
    children: ChildProcess[]
}): Promise<OpencodeInstance> {
    const { port, sessionToken, spinner, children } = opts

    // v2 renamed --log-level values to lowercase ("DEBUG" is rejected).
    const serverVersion = await detectOpencodeMajor()
    const logLevel = serverVersion >= 2 ? "debug" : "DEBUG"
    logCrosscode(`Detected opencode v${serverVersion}`)
    debug("opencode version", { serverVersion })

    const proc = spawnCmd("opencode", [
        "serve", "--print-logs", "--log-level", logLevel,
        "--port", String(port), "--hostname", "127.0.0.1",
    ], {
        cwd: process.cwd(),
        env: { ...process.env, OPENCODE_SERVER_PASSWORD: sessionToken },
        stdio: ["ignore", "pipe", "pipe"],
    })

    children.push(proc)

    proc.on("spawn", () => {
        spinner.text = chalk.green.italic("opencode serve running") + chalk.yellow.italic("  •  Detecting port...")
        logCrosscode("opencode serve started (PID: " + proc.pid + ")")
        debug("opencode spawned", { pid: proc.pid })
    })
    proc.on("error", (err) => {
        spinner.fail(chalk.red.italic("Failed to start opencode serve"))
        logCrosscode("opencode serve error: " + err.message)
        debug("opencode spawn error", { error: err.message })
    })

    const detectedPort = await waitForOpencodePort({
        proc,
        requestedPort: port,
        healthPath: serverVersion >= 2 ? "/api/info" : "/global/health",
        onData: d => opencodeLogStream.write(d),
    })

    if (detectedPort !== port) {
        logCrosscode(`Using detected port ${detectedPort} instead of requested port ${port}`)
        debug("using detected port", { detected: detectedPort, requested: port })
    }

    return { proc, detectedPort, serverVersion }
}
