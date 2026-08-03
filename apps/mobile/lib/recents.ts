import { OpenCodeProject } from "@/store/recents.store"
import { getAuthHeader } from "@/lib/utils"

export const getRecents = async (url: string, token: string) => {
    try {
        const res = await fetch(`${url}/project`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })
        if (!res.ok) return
        const data = await res.json() as OpenCodeProject[]
        if (!data) return

        return data
            .sort((a, b) => b.time.updated - a.time.updated)
            .slice(0, 2)
    } catch {
        return
    }
}