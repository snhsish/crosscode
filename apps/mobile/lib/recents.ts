import { OpenCodeProject } from "@/store/recents.store"

export const getRecents = async (url: string, token: string) => {
    try {
        const res = await fetch(`${url}/project`, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`
            }
        })
        if (!res.ok) return
        const data = await res.json() as OpenCodeProject[]
        if (!data) return

        return data
            .sort((a, b) => a.time.updated - b.time.updated)
            .filter((_, i) => i < 2)
    } catch {
        return
    }
}