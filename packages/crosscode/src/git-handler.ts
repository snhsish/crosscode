import { execFile } from "child_process"
import crypto from "crypto"
import http from "http"

const DEBUG = process.env.CROSSCODE_DEBUG === "1"
const GIT_TIMEOUT_MS = 10_000
const GIT_MAX_BUFFER = 10 * 1024 * 1024
const FIELD_SEP = "\x1f"
const RECORD_SEP = "\x1e"
const MAX_LIMIT = 200
const DEFAULT_LIMIT = 100
const MAX_OFFSET = 100_000

export type GitHandlerOpts = {
    worktree: string
    sessionToken: string
}

export type GitCommit = {
    hash: string
    shortHash: string
    parents: string[]
    subject: string
    author: string
    date: string
    refs: string
}

export type GitCommitFile = {
    file: string
    additions: number
    deletions: number
}

export type GitCommitDetail = {
    hash: string
    author: string
    date: string
    subject: string
    body: string
    files: GitCommitFile[]
    additions: number
    deletions: number
}

function debug(msg: string, meta?: Record<string, unknown>) {
    if (DEBUG) {
        const ts = new Date().toISOString()
        const extra = meta ? ` ${JSON.stringify(meta)}` : ""
        console.log(`[${ts}] [git-handler] ${msg}${extra}`)
    }
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
    if (res.headersSent) return
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Crosscode-Git": "1",
    })
    res.end(JSON.stringify(body))
}

function timingSafeEqualStr(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
}

function checkAuth(req: http.IncomingMessage, sessionToken: string): boolean {
    const header = req.headers["authorization"]
    if (!header) return false

    if (header.startsWith("Basic ")) {
        try {
            const decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
            const sep = decoded.indexOf(":")
            if (sep === -1) return false
            const user = decoded.slice(0, sep)
            const pass = decoded.slice(sep + 1)
            return user === "opencode" && timingSafeEqualStr(pass, sessionToken)
        } catch {
            return false
        }
    }

    return timingSafeEqualStr(header, sessionToken)
}

function runGit(worktree: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        execFile(
            "git",
            ["-C", worktree, ...args],
            { timeout: GIT_TIMEOUT_MS, maxBuffer: GIT_MAX_BUFFER, windowsHide: true },
            (err, stdout, stderr) => {
                if (err) {
                    const timedOut = err.killed && err.signal === "SIGTERM"
                    const e = new Error(stderr?.trim() || err.message) as Error & { code?: string | number }
                    e.code = timedOut ? "GIT_TIMEOUT" : ((err as { code?: string | number }).code ?? "GIT_ERROR")
                    reject(e)
                } else {
                    resolve(stdout)
                }
            },
        )
    })
}

function clampInt(value: string | null, min: number, max: number, fallback: number): number {
    if (!value || !/^-?\d+$/.test(value)) return fallback
    const n = parseInt(value, 10)
    return Math.min(max, Math.max(min, n))
}

function parseGitLog(raw: string): GitCommit[] {
    const commits: GitCommit[] = []
    for (const record of raw.split(RECORD_SEP)) {
        const trimmed = record.replace(/^\n/, "")
        if (!trimmed.trim()) continue
        const fields = trimmed.split(FIELD_SEP)
        if (fields.length < 7) continue
        const [hash, shortHash, parentsRaw, subject, author, date, refs] = fields
        commits.push({
            hash,
            shortHash,
            parents: parentsRaw ? parentsRaw.split(" ").filter(Boolean) : [],
            subject,
            author,
            date,
            refs,
        })
    }
    return commits
}

async function handleGitLog(req: http.IncomingMessage, res: http.ServerResponse, opts: GitHandlerOpts): Promise<void> {
    const url = new URL(req.url || "/", "http://localhost")
    const limit = clampInt(url.searchParams.get("limit"), 1, MAX_LIMIT, DEFAULT_LIMIT)
    const offset = clampInt(url.searchParams.get("offset"), 0, MAX_OFFSET, 0)

    debug("git-log", { limit, offset, worktree: opts.worktree })

    const format = [
        "%H", "%h", "%P", "%s", "%an", "%ar", "%D",
    ].join(FIELD_SEP)

    const raw = await runGit(opts.worktree, [
        "log",
        "--all",
        "--topo-order",
        `--pretty=format:${format}${RECORD_SEP}`,
        `--max-count=${limit}`,
        `--skip=${offset}`,
    ])

    sendJson(res, 200, { commits: parseGitLog(raw) })
}

function parseNumstat(raw: string): { files: GitCommitFile[]; additions: number; deletions: number; body: string } {
    const lines = raw.split("\n")
    const files: GitCommitFile[] = []
    let additions = 0
    let deletions = 0
    let bodyEnd = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const m = line.match(/^(\d+|-)\t(\d+|-)\t(.*)$/)
        if (m) {
            bodyEnd = i
            const add = m[1] === "-" ? 0 : parseInt(m[1], 10)
            const del = m[2] === "-" ? 0 : parseInt(m[2], 10)
            files.push({ file: m[3], additions: add, deletions: del })
            additions += add
            deletions += del
        }
    }

    return { files, additions, deletions, body: lines.slice(0, bodyEnd).join("\n") }
}

async function handleGitCommit(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    opts: GitHandlerOpts,
    hash: string,
): Promise<void> {
    debug("git-commit", { hash, worktree: opts.worktree })

    const metaFormat = ["%H", "%an", "%ar", "%s", "%b"].join(FIELD_SEP)
    const raw = await runGit(opts.worktree, [
        "show",
        "--numstat",
        `--format=${metaFormat}`,
        "--no-color",
        hash,
    ])

    const separatorIndex = raw.indexOf(FIELD_SEP)
    if (separatorIndex === -1) {
        sendJson(res, 500, { error: "Unexpected git output" })
        return
    }

    const metaEnd = raw.indexOf("\n", raw.indexOf(FIELD_SEP, separatorIndex + 1))
    const metaLine = raw.slice(0, metaEnd === -1 ? undefined : metaEnd).split("\n")[0]
    const [hashOut, author, date, subject, ...bodyParts] = metaLine.split(FIELD_SEP)
    const rest = raw.slice(metaLine.length)
    const { files, additions, deletions, body } = parseNumstat(rest)
    const fullBody = (bodyParts.join(FIELD_SEP).trim() + "\n" + body).trim()

    const detail: GitCommitDetail = {
        hash: hashOut || hash,
        author,
        date,
        subject,
        body: fullBody,
        files,
        additions,
        deletions,
    }

    sendJson(res, 200, detail)
}

export async function handleGitRequest(req: http.IncomingMessage, res: http.ServerResponse, opts: GitHandlerOpts): Promise<boolean> {
    let pathname: string
    try {
        pathname = encodeURI(new URL(req.url || "/", "http://localhost").pathname)
    } catch {
        return false
    }

    const isGitRoute = pathname === "/git-log" || /^\/git-commit\/[0-9a-f]{7,40}$/.test(pathname)
    if (!isGitRoute) return false

    debug("git route matched", { pathname, method: req.method })

    if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" })
        return true
    }

    if (!checkAuth(req, opts.sessionToken)) {
        debug("git request unauthorized")
        sendJson(res, 401, { error: "Unauthorized" })
        return true
    }

    try {
        if (pathname === "/git-log") {
            await handleGitLog(req, res, opts)
        } else {
            await handleGitCommit(req, res, opts, pathname.split("/")[2])
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        debug("git command failed", { message })
        if (/not a git repository/i.test(message)) {
            sendJson(res, 404, { error: "Not a git repository" })
        } else if ((err as { code?: unknown })?.code === "ENOENT") {
            sendJson(res, 500, { error: "git is not installed on the host" })
        } else if ((err as { code?: unknown }).code === "GIT_TIMEOUT") {
            sendJson(res, 504, { error: "git command timed out" })
        } else {
            sendJson(res, 500, { error: message.slice(0, 500) || "git command failed" })
        }
    }

    return true
}
