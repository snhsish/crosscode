import { OpenCodeProject } from "@/store/recents.store"

export const getRecents = async (url: string, token: string) => {
    try {
        const res = await fetch(`${url}/project`, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`
            }
        }).then((r) => r.json()) as OpenCodeProject[]

        if (!res) return

        const data = res
            .sort((a, b) => a.time.updated - b.time.updated)
            .filter((_, i) => i < 2)

        return data
    } catch {
        return
    }
}