import { OpenCodeProject } from "@/store/recents.store"
import { apiUrl, getAuthHeader, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export const getRecents = async (url: string, token: string) => {
    try {
        const version = getServerVersion(url)
        const res = await fetch(apiUrl(url, version, "/project"), {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })
        if (!res.ok) return
        const data = unwrapList<OpenCodeProject>(await res.json())
        if (data.length === 0) return

        return data
            .sort((a, b) => b.time.updated - a.time.updated)
            .slice(0, 2)
    } catch {
        return
    }
}
