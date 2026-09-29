import { execFile } from "child_process"

export type OpencodeMajor = 1 | 2

let cached: OpencodeMajor | null = null

export function getCachedOpencodeMajor(): OpencodeMajor | null {
    return cached
}

function parseMajor(output: string): OpencodeMajor {
    const match = output.match(/(\d+)\.\d+\.\d+/)
    if (match && parseInt(match[1], 10) >= 2) return 2
    return 1
}

// `opencode --version` prints e.g. "1.15.7" (v1) or "opencode v2.0.6" (v2).
// Defaults to 1 when the binary is missing or the output is unrecognized,
// so old setups keep working.
export function detectOpencodeMajor(): Promise<OpencodeMajor> {
    if (cached) return Promise.resolve(cached)
    return new Promise((resolve) => {
        execFile("opencode", ["--version"], { encoding: "utf8", timeout: 8000 }, (err, stdout) => {
            cached = parseMajor(err ? "" : stdout)
            resolve(cached)
        })
    })
}
