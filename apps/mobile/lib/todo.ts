import { apiUrl, getAuthHeader, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export type TodoTask = {
    content: string
    status: string
    priority?: string
}

export async function fetchSessionTodos(url: string, token: string, sessionId: string): Promise<TodoTask[]> {
    try {
        const version = getServerVersion(url)
        // Gated off on v2 (endpoint removed); callers already mute it there.
        if (version >= 2) return []
        const res = await fetch(`${apiUrl(url, version, "/session")}/${sessionId}/todo`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token),
            },
        })
        if (!res.ok) return []
        const data = await res.json()
        const list = unwrapList<TodoTask>(data)
        return Array.isArray(list) ? list : []
    } catch {
        return []
    }
}
