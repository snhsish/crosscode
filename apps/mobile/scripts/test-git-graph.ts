import { computeGitGraph } from "../lib/git-graph.ts"

let failed = 0
function check(name: string, cond: boolean) {
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}`)
    if (!cond) failed++
}

// Fixture: linear history A -> B -> C (A newest)
const linear = [
    { hash: "a", parents: ["b"] },
    { hash: "b", parents: ["c"] },
    { hash: "c", parents: [] },
]
const lr = computeGitGraph(linear)
check("linear: 3 rows", lr.length === 3)
check("linear: row0 dot lane0", lr[0].dotLane === 0 && lr[0].dotColorIdx === 0)
check("linear: row0 pipe continues at lane0", lr[0].pipes.length === 1 && lr[0].pipes[0].lane === 0)
check("linear: no curves", lr.every((r) => r.curves.length === 0))
check("linear: row2 root no pipes", lr[2].pipes.length === 0 && lr[2].topHalves.length === 1)

// Fixture: simple branch & merge
//        D (merge)
//       / \
//  A--B--C
// topo order: D, B, C, A   (D newest; D's parents [B, C]; B's parent [A]; C's parent [A])
const branch = [
    { hash: "d", parents: ["b", "c"] },
    { hash: "b", parents: ["a"] },
    { hash: "c", parents: ["a"] },
    { hash: "a", parents: [] },
]
const br = computeGitGraph(branch)

check("branch: 4 rows", br.length === 4)
check("branch: d in lane0", br[0].dotLane === 0)
// d places parent b at dotLane 0, parent c in new lane 1 -> curve to 1
check("branch: d curves to lane1", br[0].curves.length === 1 && br[0].curves[0].to === 1)
check("branch: b continues pipe lane0", br[1].pipes.some((p) => p.lane === 0))
// c sits in lane1 (expected), its parent a: lane0 expects a? b placed a? not yet.
// c processes: lane1 expected. parent a -> lane0 free? lane0 currently holds "a" (b placed it). So indexOf(a)===0 -> curve from 1 to 0.
check("branch: c merges into lane0", br[2].dotLane === 1 && br[2].curves.length === 1 && br[2].curves[0].to === 0)
// a: expected by lane0 -> dot at lane0, root
check("branch: a root at lane0", br[3].dotLane === 0 && br[3].pipes.length === 0)

// Fixture: octopus merge E with parents [B, C, D]
const octo = [
    { hash: "e", parents: ["b", "c", "d"] },
    { hash: "b", parents: [] },
    { hash: "c", parents: [] },
    { hash: "d", parents: [] },
]
const or = computeGitGraph(octo)
check("octopus: e has 2 curves", or[0].curves.length === 2 && or[0].laneCount >= 3)
check("octopus: all roots terminate", or[3].pipes.length === 0 && or[3].topHalves.length === 1)

// Fixture: two tips starting simultaneously (new colors)
const twoTips = [
    { hash: "x", parents: ["z"] },
    { hash: "y", parents: ["z"] },
    { hash: "z", parents: [] },
]
const tr = computeGitGraph(twoTips)
check("twoTips: x lane0 color0", tr[0].dotLane === 0 && tr[0].dotColorIdx === 0)
check("twoTips: y gets fresh lane+color", tr[1].dotLane === 1 && tr[1].dotColorIdx !== 0)
check("twoTips: y curves into z lane", tr[1].curves.length === 1 && tr[1].curves[0].to === 0)
check("twoTips: z single dot", tr[2].dotLane === 0 && tr[2].pipes.length === 0 && tr[2].curves.length === 0)

// Empty input
check("empty input", computeGitGraph([]).length === 0)

process.exit(failed ? 1 : 0)
