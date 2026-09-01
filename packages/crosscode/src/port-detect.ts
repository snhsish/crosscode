import { ChildProcess, execFile } from "child_process"
import http from "http"

const PORT_PATTERNS = [
    /opencode server listening on \S*?:(\d+)/i,
    /listening on (?:https?:\/\/)?[^\s"']*?:(\d+)/i,
]

function probePort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get({ host: "127.0.0.1", port, path: "/global/health", timeout: 700 }, (res) => {
            res.resume()
            resolve(true)
        })
        req.on("timeout", () => {
            req.destroy()
            resolve(false)
        })
        req.on("error", () => resolve(false))
    })
}

function execAsync(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve) => {
        execFile(cmd, args, { encoding: "utf8", timeout: 5000 }, (err, stdout) => {
            resolve(err ? "" : stdout)
        })
    })
}

async function getListeningPorts(pid?: number): Promise<number[]> {
    if (!pid) return []
    try {
        if (process.platform === "win32") {
            const out = await execAsync("netstat", ["-ano"])
            const ports: number[] = []
            for (const line of out.split("\n")) {
                const cols = line.trim().split(/\s+/)
                if (cols.length >= 5 && cols[0] === "TCP" && cols[3] === "LISTENING" && cols[4] === String(pid)) {
                    const m = cols[1].match(/:(\d+)$/)
                    if (m) ports.push(parseInt(m[1], 10))
                }
            }
            return [...new Set(ports)]
        }
        const out = await execAsync("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN", "-a", "-p", String(pid)])
        const ports: number[] = []
        for (const match of out.matchAll(/:(\d+)\s+\(LISTEN\)/g)) {
            ports.push(parseInt(match[1], 10))
        }
        if (ports.length > 0) return [...new Set(ports)]
    } catch {}
    try {
        if (process.platform === "linux") {
            const out = await execAsync("ss", ["-tlnp"])
            const ports: number[] = []
            for (const line of out.split("\n")) {
                if (!line.includes(`pid=${pid},`)) continue
                const m = line.match(/:(\d+)\s/)
                if (m) ports.push(parseInt(m[1], 10))
            }
            return [...new Set(ports)]
        }
    } catch {}
    return []
}

export function waitForOpencodePort(opts: {
    proc: ChildProcess
    requestedPort: number
    onData?: (data: Buffer) => void
    timeoutMs?: number
}): Promise<number> {
    const { proc, requestedPort, onData, timeoutMs = 15_000 } = opts

    let buffer = ""
    let resolved = false
    let exited = false
    let probing = false

    const collect = (data: Buffer) => {
        if (onData) onData(data)
        buffer += data.toString()
    }
    proc.stdout?.on("data", collect)
    proc.stderr?.on("data", collect)
    proc.on("exit", () => {
        exited = true
    })

    const fromLogs = (): number | null => {
        for (const pattern of PORT_PATTERNS) {
            const match = buffer.match(pattern)
            if (match) return parseInt(match[1], 10)
        }
        return null
    }

    return new Promise<number>((resolve) => {
        const finish = (port: number) => {
            if (resolved) return
            resolved = true
            clearInterval(interval)
            clearTimeout(timeout)
            resolve(port)
        }

        const interval = setInterval(async () => {
            const logged = fromLogs()
            if (logged) return finish(logged)

            if (exited || probing) return
            probing = true
            const alive = await probePort(requestedPort)
            probing = false
            if (alive) return finish(requestedPort)
        }, 250)

        const timeout = setTimeout(async () => {
            const ports = (await getListeningPorts(proc.pid)).filter((p) => p > 0 && p <= 65535)
            if (ports.length > 0) return finish(ports[0])
            finish(fromLogs() ?? requestedPort)
        }, timeoutMs)
    })
}
