import { Session } from "@/store/sessions.store"

export const getSessionsByProjectDir = async (url: string, token: string, dir: string) => {
    try {
        const res = await fetch(`${url}/session?directory=${dir}`, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`
            }
        }).then((r) => r.json()) as Session[]

        if (!res) return

        const data = res

        return data
    } catch {
        return
    }
}