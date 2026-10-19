import { OpenCodeProject } from "@/store/recents.store"
import { apiUrl, getAuthHeader, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export const getRecents = async (url: string, token: string) => {
    try {
        const version = getServerVersion(url)
        const endpoints =
            version >= 2
                ? [apiUrl(url, 2, "/project"), apiUrl(url, 1, "/project")]
                : [apiUrl(url, 1, "/project"), apiUrl(url, 2, "/project")]
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    method: "GET",
                    headers: {
                        "Authorization": getAuthHeader(token)
                    }
                })
                if (!res.ok) continue
                const json = await res.json()
                const data = unwrapList<OpenCodeProject>(json)
                if (!data || data.length === 0) continue

                return data
                    .sort((a, b) => b.time.updated - a.time.updated)
                    .slice(0, 2)
            } catch {
                continue
            }
        }
        return
    } catch {
        return
    }
}