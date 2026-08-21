import { getAuthHeader } from "@/lib/utils"

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

export type GitLogResult =
    | { ok: true; commits: GitCommit[] }
    | { ok: false; reason: "unsupported" | "error"; message?: string }

export type GitCommitResult =
    | { ok: true; detail: GitCommitDetail }
    | { ok: false; reason: "unsupported" | "error"; message?: string }

function normalizeCommit(value: unknown): GitCommit | null {
    if (!value || typeof value !== "object") return null
    const c = value as Record<string, unknown>
    if (typeof c.hash !== "string" || typeof c.subject !== "string") return null
    return {
        hash: c.hash,
        shortHash: typeof c.shortHash === "string" ? c.shortHash : c.hash.slice(0, 7),
        parents: Array.isArray(c.parents) ? c.parents.filter((p): p is string => typeof p === "string") : [],
        subject: c.subject,
        author: typeof c.author === "string" ? c.author : "",
        date: typeof c.date === "string" ? c.date : "",
        refs: typeof c.refs === "string" ? c.refs : "",
    }
}

async function parseGitResponse(res: Response): Promise<{ unsupported: boolean; message?: string } & Record<string, any>> {
    const supported = res.headers.get("X-Crosscode-Git") === "1"
    let body: any = null
    try {
        body = await res.json()
    } catch {}
    if (res.ok) return { unsupported: false, ...body }
    if (!supported) return { unsupported: true }
    return { unsupported: false, error: body?.error ?? `HTTP ${res.status}` }
}

export async function fetchGitLog(url: string, token: string, limit = 100, offset = 0): Promise<GitLogResult> {
    try {
        const res = await fetch(`${url}/git-log?limit=${limit}&offset=${offset}`, {
            method: "GET",
            headers: { "Authorization": getAuthHeader(token) },
        })
        const parsed = await parseGitResponse(res)
        if (parsed.unsupported) return { ok: false, reason: "unsupported" }
        if (parsed.error) {
            return { ok: false, reason: "error", message: parsed.error }
        }
        const records = Array.isArray(parsed.commits) ? parsed.commits : []
        return { ok: true, commits: records.map(normalizeCommit).filter((c): c is GitCommit => c !== null) }
    } catch {
        return { ok: false, reason: "unsupported" }
    }
}

export async function fetchGitCommit(url: string, token: string, hash: string): Promise<GitCommitResult> {
    try {
        const res = await fetch(`${url}/git-commit/${encodeURIComponent(hash)}`, {
            method: "GET",
            headers: { "Authorization": getAuthHeader(token) },
        })
        const parsed = await parseGitResponse(res)
        if (parsed.unsupported) return { ok: false, reason: "unsupported" }
        if (parsed.error) return { ok: false, reason: "error", message: parsed.error }
        const d = parsed as Record<string, unknown>
        const files = Array.isArray(d.files)
            ? d.files.map((f: any) => ({
                  file: String(f?.file ?? ""),
                  additions: Number(f?.additions ?? 0),
                  deletions: Number(f?.deletions ?? 0),
              }))
            : []
        return {
            ok: true,
            detail: {
                hash: String(d.hash ?? hash),
                author: String(d.author ?? ""),
                date: String(d.date ?? ""),
                subject: String(d.subject ?? ""),
                body: String(d.body ?? ""),
                files,
                additions: Number(d.additions ?? 0),
                deletions: Number(d.deletions ?? 0),
            },
        }
    } catch {
        return { ok: false, reason: "error", message: "Network request failed" }
    }
}
