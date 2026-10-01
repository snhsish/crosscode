import { execFile } from "child_process"

export type OpencodeMajor = 1 | 2

let cached: { bin: string; major: OpencodeMajor } | null = null

export function getCachedOpencodeMajor(): OpencodeMajor | null {
    return cached?.major ?? null
}

function parseMajor(output: string): OpencodeMajor {
    const match = output.match(/(\d+)\.\d+\.\d+/)
    if (match && parseInt(match[1], 10) >= 2) return 2
    return 1
}

// `opencode --version` prints e.g. "1.15.7" (v1) or "opencode v2.0.6" (v2).
// Defaults to 1 when the binary is missing or the output is unrecognized,
// so old setups keep working.
export function detectOpencodeMajor(bin = "opencode"): Promise<OpencodeMajor> {
    if (cached && cached.bin === bin) return Promise.resolve(cached.major)
    return new Promise((resolve) => {
        execFile(bin, ["--version"], { encoding: "utf8", timeout: 8000 }, (err, stdout) => {
            const major = parseMajor(err ? "" : stdout)
            cached = { bin, major }
            resolve(major)
        })
    })
}
