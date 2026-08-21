export type GraphPipe = { lane: number; colorIdx: number }
export type GraphCurve = { to: number; colorIdx: number }

export type GraphRowData = {
    laneCount: number
    dotLane: number
    dotColorIdx: number
    pipes: GraphPipe[]
    topHalves: GraphPipe[]
    curves: GraphCurve[]
}

export type GitGraphCommit = {
    hash: string
    parents: string[]
}

export const GIT_GRAPH_PALETTE_SIZE = 8

const MAX_LANES = 24

export function computeGitGraph(commits: GitGraphCommit[]): GraphRowData[] {
    const rows: GraphRowData[] = []

    const lanes: (string | null)[] = []
    const laneColors: number[] = []
    let nextColor = 0

    const ensureCapacity = (index: number) => {
        while (lanes.length <= index) {
            lanes.push(null)
            laneColors.push(0)
        }
    }

    const allocFreeLane = (): number => {
        const free = lanes.indexOf(null)
        if (free !== -1) return free
        if (lanes.length < MAX_LANES) {
            ensureCapacity(lanes.length)
            return lanes.length - 1
        }
        return -1
    }

    for (const commit of commits) {
        if (!commit || typeof commit.hash !== "string") continue

        let dotLane = lanes.indexOf(commit.hash)
        let dotWasExpected = dotLane !== -1

        if (!dotWasExpected) {
            const lane = allocFreeLane()
            if (lane === -1) {
                rows.push({
                    laneCount: lanes.length,
                    dotLane: -1,
                    dotColorIdx: 0,
                    pipes: [],
                    topHalves: [],
                    curves: [],
                })
                continue
            }
            dotLane = lane
            laneColors[dotLane] = nextColor % GIT_GRAPH_PALETTE_SIZE
            nextColor++
            lanes[dotLane] = commit.hash
        }

        const dotColorIdx = laneColors[dotLane]
        lanes[dotLane] = null

        const curves: GraphCurve[] = []
        const parents = Array.isArray(commit.parents) ? commit.parents : []

        parents.forEach((parent, pi) => {
            if (typeof parent !== "string" || !parent) return

            let target = lanes.indexOf(parent)
            if (target === -1) {
                if (pi === 0) {
                    target = dotLane
                } else {
                    const lane = allocFreeLane()
                    target = lane === -1 ? dotLane : lane
                }
                ensureCapacity(target)
                lanes[target] = parent
                laneColors[target] = dotColorIdx
            }

            if (target !== dotLane) {
                curves.push({ to: target, colorIdx: laneColors[target] })
            }
        })

        const pipes: GraphPipe[] = []
        lanes.forEach((hash, i) => {
            if (hash === null) return
            pipes.push({ lane: i, colorIdx: laneColors[i] })
        })

        const topHalves: GraphPipe[] = []
        if (dotWasExpected) {
            topHalves.push({ lane: dotLane, colorIdx: dotColorIdx })
        }

        let laneCount = lanes.length
        for (const curve of curves) {
            laneCount = Math.max(laneCount, curve.to + 1)
        }

        rows.push({
            laneCount,
            dotLane,
            dotColorIdx,
            pipes,
            topHalves,
            curves,
        })
    }

    return rows
}
