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
    opencodeBin?: string
}): Promise<OpencodeInstance> {
    const { port, sessionToken, spinner, children, opencodeBin = "opencode" } = opts

    // v2 renamed --log-level values to lowercase ("DEBUG" is rejected and
    // the server exits immediately, which used to surface as a confusing
    // "Failed to start opencode serve" followed by a dead QR in #128).
    const serverVersion = await detectOpencodeMajor(opencodeBin)
    const logLevel = serverVersion >= 2 ? "debug" : "DEBUG"
    logCrosscode(`Detected ${opencodeBin} v${serverVersion}`)
    debug("opencode version", { bin: opencodeBin, serverVersion })

    const proc = spawnCmd(opencodeBin, [
        "serve", "--print-logs", "--log-level", logLevel,
        "--port", String(port), "--hostname", "127.0.0.1",
    ], {
        cwd: process.cwd(),
        env: { ...process.env, OPENCODE_SERVER_PASSWORD: sessionToken },
        stdio: ["ignore", "pipe", "pipe"],
    })

    children.push(proc)

    // Fail fast when the binary can't even spawn (missing executable):
    // reject here so callers never print a QR for a dead backend.
    let spawnError: Error | null = null
    const spawnFailed = new Promise<never>((_, reject) => {
        proc.once("error", (err) => {
            spawnError = err
            spinner.fail(chalk.red.italic(`Failed to start ${opencodeBin} serve`))
            logCrosscode(`${opencodeBin} serve error: ${err.message}`)
            debug("opencode spawn error", { bin: opencodeBin, error: err.message })
            reject(new Error(`Failed to start ${opencodeBin} serve: ${err.message}`))
        })
    })

    proc.on("spawn", () => {
        spinner.text = chalk.green.italic(`${opencodeBin} serve running`) + chalk.yellow.italic("  •  Detecting port...")
        logCrosscode(`${opencodeBin} serve started (PID: ` + proc.pid + ")")
        debug("opencode spawned", { bin: opencodeBin, pid: proc.pid })
    })

    const detectedPort = await Promise.race([
        spawnFailed,
        waitForOpencodePort({
            proc,
            requestedPort: port,
            healthPath: serverVersion >= 2 ? "/api/info" : "/global/health",
            onData: d => opencodeLogStream.write(d),
        }),
    ])
    void spawnError

    if (detectedPort !== port) {
        logCrosscode(`Using detected port ${detectedPort} instead of requested port ${port}`)
        debug("using detected port", { detected: detectedPort, requested: port })
    }

    return { proc, detectedPort, serverVersion }
}
