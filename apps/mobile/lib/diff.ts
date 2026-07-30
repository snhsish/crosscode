export type DiffLine =
    | { type: "context"; content: string; oldLine?: number; newLine?: number }
    | { type: "add"; content: string; newLine: number }
    | { type: "remove"; content: string; oldLine: number }

export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split("\n")
    const newLines = newText.split("\n")
    const lcs = buildLCS(oldLines, newLines)
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
