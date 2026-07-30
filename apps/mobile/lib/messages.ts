import { Message } from "@/store/messages.store"

export const getMessages = async (url: string, token: string, sessionId: string, limit?: number, offset?: number) => {
    try {
        const params = new URLSearchParams()
        if (limit) params.set("limit", limit.toString())
        if (offset) params.set("offset", offset.toString())
        
        const queryString = params.toString()
        const res = await fetch(`${url}/session/${sessionId}/message${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`
            }
        })
        if (!res.ok) return
        const data = await res.json() as Message[]
        if (!data) return
        return data
    } catch {
        return
    }
}