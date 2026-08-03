import { getAuthHeader } from "@/lib/utils"

export type TodoTask = {
    content: string
    status: string
    priority?: string
}

export async function fetchSessionTodos(url: string, token: string, sessionId: string): Promise<TodoTask[]> {
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
