import { Session } from "@/store/sessions.store"
import { getAuthHeader } from "@/lib/utils"

export const createSession = async (url: string, token: string, directory: string): Promise<Session | null> => {
    try {
        const res = await fetch(`${url}/session`, {
            method: "POST",
            headers: {
                "Authorization": getAuthHeader(token),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ directory }),
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

export const getSessionsByProjectDir = async (url: string, token: string, dir: string) => {
    try {
        const res = await fetch(`${url}/session?directory=${dir}`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })
        if (!res.ok) return
        const data = await res.json() as Session[]
        return data
    } catch {
        return
    }
}

export const deleteSession = async (url: string, token: string, sessionId: string) => {
    try {
        const res = await fetch(`${url}/session/${sessionId}`, {
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
        const res = await fetch(`${url}/session/${sessionId}/fork`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`,
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
