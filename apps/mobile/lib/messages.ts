import { Message } from "@/store/messages.store"

export const getMessages = async (url: string, token: string, sessionId: string) => {
    try {
        const res = await fetch(`${url}/session/${sessionId}/message`, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`
            }
        }).then((r) => r.json()) as Message[]

        if (!res) return

        const data = res

        return data
    } catch {
        return
    }
}