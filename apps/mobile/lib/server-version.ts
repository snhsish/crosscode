import { getAuthHeader } from "@/lib/utils"
import { useConnections } from "@/store/connection.store"

export type ServerVersion = 1 | 2

export type GatedFeature = "share" | "todo" | "question"

const memoryCache = new Map<string, ServerVersion>()

function normalizeUrl(url: string): string {
    return url.replace(/\/+$/, "")
}

export function cacheServerVersion(url: string, version: ServerVersion) {
    memoryCache.set(normalizeUrl(url), version)
}

// Sync lookup: memory cache, then the persisted connection, else v1.
// Unknown servers are treated as v1 so old CLIs keep working untouched.
export function getServerVersion(url: string | undefined | null): ServerVersion {
    if (!url) return 1
    const cached = memoryCache.get(normalizeUrl(url))
    if (cached) return cached
    const match = useConnections.getState().connections.find((c) => normalizeUrl(c.url) === normalizeUrl(url))
    if (match?.serverVersion === 2) {
        memoryCache.set(normalizeUrl(url), 2)
        return 2
    }
    return 1
}

async function probeJson(url: string, token: string, path: string): Promise<unknown | null> {
    try {
        const res = await fetch(`${normalizeUrl(url)}${path}`, {
            method: "GET",
            headers: { "Authorization": getAuthHeader(token) },
        })
        if (!res.ok) return null
        const contentType = res.headers.get("content-type") ?? ""
        if (!contentType.includes("json")) return null
        return (await res.json()) as unknown
    } catch {
        return null
    }
}

function persistVersion(url: string, version: ServerVersion) {
    cacheServerVersion(url, version)
    const state = useConnections.getState()
    const match = state.connections.find((c) => normalizeUrl(c.url) === normalizeUrl(url))
    if (match && match.serverVersion !== version) {
        state.updateConnection(match.id, { serverVersion: version })
    }
}

// Probe the server to learn whether it speaks the v1 or v2 API.
// v2 answers GET /api/info with {"version": "2.x", ...}; v1 answers
// GET /global/health with {"healthy": true, ...}. Returns null when
// the server is unreachable. Order matters: on v2, /global/health
// serves the web UI (HTML 200), so /api/info must be checked first.
export async function detectServerVersion(
    url: string,
    token: string,
    opts?: { force?: boolean },
): Promise<ServerVersion | null> {
    const key = normalizeUrl(url)
    if (!opts?.force) {
        const cached = memoryCache.get(key)
        if (cached) return cached
    }
    const info = await probeJson(url, token, "/api/info")
    if (info && typeof info === "object") {
        const version = (info as Record<string, unknown>).version
        if (typeof version === "string" && parseInt(version.split(".")[0]!, 10) >= 2) {
            persistVersion(url, 2)
            return 2
        }
    }
    const health = await probeJson(url, token, "/global/health")
    if (health && typeof health === "object" && (health as Record<string, unknown>).healthy === true) {
        persistVersion(url, 1)
        return 1
    }
    return null
}

// Features removed from the v2 API (expected to return later).
// The UI mutes these on v2 instead of removing them; v1 is unaffected.
export function supportsFeature(version: ServerVersion, feature: GatedFeature): boolean {
    if (version >= 2) {
        return feature !== "share" && feature !== "todo" && feature !== "question"
    }
    return true
}
