import { Session } from "@/store/sessions.store"
import { apiUrl, getAuthHeader, unwrapData, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

function sessionBase(url: string): string {
    return apiUrl(url, getServerVersion(url), "/session")
}

export const createSession = async (url: string, token: string, directory: string): Promise<Session | null> => {
    try {
        const version = getServerVersion(url)
        const body = version >= 2
            // v2 creates at a location; directory-only sessions use the location ref.
            ? { location: { directory } }
            : { directory }
        const res = await fetch(sessionBase(url), {
            method: "POST",
            headers: {
                "Authorization": getAuthHeader(token),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
        if (!res.ok) return null
        const json = await res.json()
        // v2 returns { data: Session }, v1 returns the session directly.
        const raw = (unwrapData<Session>(json) ?? json) as Session & { location?: { directory?: string } }
        return normalizeSession(raw, directory)
    } catch {
        return null
    }
}

// v2 sessions carry `location: { directory }` instead of a top-level
// `directory`. Normalize so screens can keep filtering on `directory`.
function normalizeSession(raw: Session & { location?: { directory?: string } }, fallbackDir?: string): Session {
    const directory =
        (typeof raw.directory === "string" && raw.directory) ||
        (raw.location && typeof raw.location.directory === "string" && raw.location.directory) ||
        fallbackDir ||
        ""
    return { ...raw, directory } as Session
}

export const getSessionsByProjectDir = async (url: string, token: string, dir: string) => {
    try {
        const res = await fetch(`${sessionBase(url)}?directory=${encodeURIComponent(dir)}`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })
        if (!res.ok) return
        const data = await res.json()
        const list = unwrapList<Session & { location?: { directory?: string } }>(data)
        if (!list) return
        return list.map((s) => normalizeSession(s, dir))
    } catch {
        return
    }
}

export const deleteSession = async (url: string, token: string, sessionId: string) => {
    try {
        const res = await fetch(`${sessionBase(url)}/${sessionId}`, {
            method: "DELETE",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })

        return res.ok
    } catch {
        return false
    }
}

export const shareSession = async (url: string, token: string, sessionId: string): Promise<Session | null> => {
    try {
        // Sharing was removed from the v2 API; the UI already gates it off there.
        if (getServerVersion(url) >= 2) return null
        const res = await fetch(`${sessionBase(url)}/${sessionId}/share`, {
            method: "POST",
            headers: {
                "Authorization": getAuthHeader(token),
                "Content-Type": "application/json",
            },
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

export const revertMessage = async (url: string, token: string, sessionId: string, messageID: string, partID?: string): Promise<boolean> => {
    try {
        // v2 stages reverts via /revert/stage + /revert/commit; the legacy
        // single-shot /revert only exists on v1.
        if (getServerVersion(url) >= 2) return false
        const res = await fetch(`${sessionBase(url)}/${sessionId}/revert`, {
            method: "POST",
            headers: {
                "Authorization": getAuthHeader(token),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messageID, partID }),
        })
        return res.ok
    } catch {
        return false
    }
}

export const forkSession = async (url: string, token: string, sessionId: string, messageID?: string): Promise<Session | null> => {
    try {
        if (getServerVersion(url) >= 2) return null
        const res = await fetch(`${sessionBase(url)}/${sessionId}/fork`, {
            method: "POST",
            headers: {
                "Authorization": getAuthHeader(token),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messageID }),
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}
