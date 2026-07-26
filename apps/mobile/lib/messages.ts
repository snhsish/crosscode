import { Message } from "@/store/messages.store"

export const getMessages = async (url: string, token: string, sessionId: string) => {
    try {
        const res = await fetch(`${url}/session/${sessionId}/message`, {
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