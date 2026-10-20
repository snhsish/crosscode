import { Message } from "@/store/messages.store"
import { apiUrl, getAuthHeader, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export const getMessages = async (url: string, token: string, sessionId: string, limit?: number, offset?: number) => {
    try {
        const version = getServerVersion(url)
        const base = apiUrl(url, version, `/session/${sessionId}/message`)
        const params = new URLSearchParams()
        if (limit) params.set("limit", limit.toString())
        // v2 paginates with opaque cursors (no numeric offset); offset is v1-only.
        if (offset && version < 2) params.set("offset", offset.toString())
        if (version >= 2) params.set("order", "asc")
        
        const queryString = params.toString()
        const res = await fetch(`${base}${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })
        if (!res.ok) return
        const json = await res.json()
        const data = unwrapList<Message>(json)
        if (!data) return
        return data
    } catch {
        return
    }
}