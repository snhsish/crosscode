import { getAuthHeader } from "@/lib/utils"

export type FileDiff = {
    file: string
    patch: string
    before: string
    after: string
    additions: number
    deletions: number
}

function normalizeFileDiff(value: unknown): FileDiff | null {
    if (!value || typeof value !== "object") return null

    const diff = value as Record<string, unknown>
    const file = typeof diff.file === "string" ? diff.file : diff.filePath
    if (typeof file !== "string") return null

    const before = diff.before ?? diff.oldString ?? diff.old
    const after = diff.after ?? diff.newString ?? diff.new

    return {
        file,
        patch: typeof diff.patch === "string" ? diff.patch : "",
        before: typeof before === "string" ? before : "",
        after: typeof after === "string" ? after : "",
        additions: typeof diff.additions === "number" ? diff.additions : 0,
        deletions: typeof diff.deletions === "number" ? diff.deletions : 0,
    }
}

export async function fetchSessionDiffs(url: string, token: string, sessionId: string): Promise<FileDiff[]> {
    try {
        const res = await fetch(`${url}/session/${sessionId}/diff`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token),
            },
        })
        if (!res.ok) return []
        const data = await res.json()
        const records = Array.isArray(data)
            ? data
            : data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).diffs)
                ? (data as { diffs: unknown[] }).diffs
                : []
        return records.map(normalizeFileDiff).filter((diff): diff is FileDiff => diff !== null)
    } catch {
        return []
    }
}

export type DiffLine =
    | { type: "context"; content: string; oldLine?: number; newLine?: number }
    | { type: "add"; content: string; newLine: number }
    | { type: "remove"; content: string; oldLine: number }

export function computeLineDiff(oldText: string | null | undefined, newText: string | null | undefined): DiffLine[] {
    const oldLines = (typeof oldText === "string" ? oldText : "").split("\n")
    const newLines = (typeof newText === "string" ? newText : "").split("\n")

    if (oldLines.length * newLines.length > 250000) {
        return computeLineDiffDeferred(oldLines, newLines)
    }

    const lcs = buildLCS(oldLines, newLines)
    return buildDiffResult(oldLines, newLines, lcs)
}

export function computePatchDiff(patch: string | null | undefined): DiffLine[] {
    if (typeof patch !== "string") return []

    const result: DiffLine[] = []
    let oldLine = 0
    let newLine = 0
    let inHunk = false

    for (const line of patch.split("\n")) {
        const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
        if (hunk) {
            oldLine = Number(hunk[1])
            newLine = Number(hunk[2])
            inHunk = true
            continue
        }
        if (!inHunk || line === "\\ No newline at end of file" || line.startsWith("diff ")) continue

        if (line.startsWith("+")) {
            result.push({ type: "add", content: line.slice(1), newLine })
            newLine++
        } else if (line.startsWith("-")) {
            result.push({ type: "remove", content: line.slice(1), oldLine })
            oldLine++
        } else if (line.startsWith(" ")) {
            result.push({ type: "context", content: line.slice(1), oldLine, newLine })
            oldLine++
            newLine++
        }
    }

    return result
}

function computeLineDiffDeferred(oldLines: string[], newLines: string[]): DiffLine[] {
    const result: DiffLine[] = []
    const oldSet = new Set(oldLines)
    const newSet = new Set(newLines)

    let oi = 0
    let ni = 0
    while (oi < oldLines.length && ni < newLines.length) {
        if (oldLines[oi] === newLines[ni]) {
            result.push({ type: "context", content: oldLines[oi], oldLine: oi + 1, newLine: ni + 1 })
            oi++
            ni++
        } else if (!newSet.has(oldLines[oi])) {
            result.push({ type: "remove", content: oldLines[oi], oldLine: oi + 1 })
            oi++
        } else if (!oldSet.has(newLines[ni])) {
            result.push({ type: "add", content: newLines[ni], newLine: ni + 1 })
            ni++
        } else {
            result.push({ type: "remove", content: oldLines[oi], oldLine: oi + 1 })
            result.push({ type: "add", content: newLines[ni], newLine: ni + 1 })
            oi++
            ni++
        }
    }
    while (oi < oldLines.length) {
        result.push({ type: "remove", content: oldLines[oi], oldLine: oi + 1 })
        oi++
    }
    while (ni < newLines.length) {
        result.push({ type: "add", content: newLines[ni], newLine: ni + 1 })
        ni++
    }
    return result
}

function buildDiffResult(oldLines: string[], newLines: string[], lcs: LCSEntry[]): DiffLine[] {
    const result: DiffLine[] = []
    let oi = 0
    let ni = 0
    for (const entry of lcs) {
        while (oi < entry.oldIdx) {
            result.push({ type: "remove", content: oldLines[oi], oldLine: oi + 1 })
            oi++
        }
        while (ni < entry.newIdx) {
            result.push({ type: "add", content: newLines[ni], newLine: ni + 1 })
            ni++
        }
        result.push({ type: "context", content: oldLines[oi], oldLine: oi + 1, newLine: ni + 1 })
        oi++
        ni++
    }
    while (oi < oldLines.length) {
        result.push({ type: "remove", content: oldLines[oi], oldLine: oi + 1 })
        oi++
    }
    while (ni < newLines.length) {
        result.push({ type: "add", content: newLines[ni], newLine: ni + 1 })
        ni++
    }
    return result
}

type LCSEntry = { oldIdx: number; newIdx: number }

function buildLCS(oldLines: string[], newLines: string[]): LCSEntry[] {
    const m = oldLines.length
    const n = newLines.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
            }
        }
    }
    const result: LCSEntry[] = []
    let i = m
    let j = n
    while (i > 0 && j > 0) {
        if (oldLines[i - 1] === newLines[j - 1]) {
            result.unshift({ oldIdx: i - 1, newIdx: j - 1 })
            i--
            j--
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--
        } else {
            j--
        }
    }
    return result
}

export function countChanges(diffLines: DiffLine[]): { additions: number; deletions: number } {
    let additions = 0
    let deletions = 0
    for (const line of diffLines) {
        if (line.type === "add") additions++
        else if (line.type === "remove") deletions++
    }
    return { additions, deletions }
}
