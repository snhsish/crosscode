import { Session } from "@/store/sessions.store"
import { apiUrl, getAuthHeader, unwrapData, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

type RawSession = Record<string, unknown> & {
    id: string
    directory?: string
    location?: { directory?: string }
    title?: string
    version?: string
}

// v2 sessions carry location.directory instead of directory and may omit
// title/version until summarized. Normalize to the v1 shape the app uses.
function normalizeSession(raw: RawSession): Session {
    return {
        ...(raw as object),
        id: raw.id,
        directory: raw.directory ?? raw.location?.directory ?? "",
        title: typeof raw.title === "string" ? raw.title : "",
        version: typeof raw.version === "string" ? raw.version : "",
    } as Session
}

export const createSession = async (url: string, token: string, directory: string): Promise<Session | null> => {
    try {
        const version = getServerVersion(url)
        const body = version >= 2 ? { location: { directory } } : { directory }
        const res = await fetch(apiUrl(url, version, "/session"), {
            method: "POST",
            headers: {
                "Authorization": getAuthHeader(token),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
        if (!res.ok) return null
        return normalizeSession(unwrapData<RawSession>(await res.json()))
    } catch {
        return null
    }
}

export const getSessionsByProjectDir = async (url: string, token: string, dir: string) => {
    try {
        const version = getServerVersion(url)
        const res = await fetch(`${apiUrl(url, version, "/session")}?directory=${encodeURIComponent(dir)}`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })
        if (!res.ok) return
        const data = unwrapList<RawSession>(await res.json())
        return data.map(normalizeSession)
    } catch {
        return
    }
}

export const deleteSession = async (url: string, token: string, sessionId: string) => {
    try {
        const version = getServerVersion(url)
        const res = await fetch(`${apiUrl(url, version, "/session")}/${sessionId}`, {
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
    // No v2 equivalent yet; the UI mutes this on v2 (see supportsFeature).
    if (getServerVersion(url) >= 2) return null
    try {
        const res = await fetch(`${url}/session/${sessionId}/share`, {
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
        const version = getServerVersion(url)
        if (version >= 2) {
            // v2 reverts the current turn via DELETE with no message selector.
            const res = await fetch(`${apiUrl(url, version, "/session")}/${sessionId}/revert`, {
                method: "DELETE",
                headers: {
                    "Authorization": getAuthHeader(token),
                },
            })
            return res.ok
        }
        const res = await fetch(`${url}/session/${sessionId}/revert`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`,
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
        const version = getServerVersion(url)
        const body = version >= 2 ? { before: messageID } : { messageID }
        const res = await fetch(`${apiUrl(url, version, "/session")}/${sessionId}/fork`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
        if (!res.ok) return null
        return normalizeSession(unwrapData<RawSession>(await res.json()))
    } catch {
        return null
    }
}
