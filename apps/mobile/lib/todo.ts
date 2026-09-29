import { getAuthHeader } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export type TodoTask = {
    content: string
    status: string
    priority?: string
}

export async function fetchSessionTodos(url: string, token: string, sessionId: string): Promise<TodoTask[]> {
    // No v2 equivalent yet; the UI mutes todos on v2 (see supportsFeature).
    if (getServerVersion(url) >= 2) return []
    try {
        const res = await fetch(`${url}/session/${sessionId}/todo`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token),
            },
        })
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}
