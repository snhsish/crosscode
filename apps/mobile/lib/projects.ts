import { Project } from "@/store/projects.store"
import { apiUrl, getAuthHeader, unwrapData, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export const getCurrentProject = async (url: string, token: string) => {
    try {
        const version = getServerVersion(url)
        const headers = {
            "Authorization": getAuthHeader(token)
        }

        // v2 exposes projects at /api/project (list) instead of
        // /project/current + /path. Try v2 first when detected, fall back to v1.
        if (version >= 2) {
            const listRes = await fetch(apiUrl(url, version, "/project"), { method: "GET", headers })
            if (listRes.ok) {
                const json = await listRes.json()
                const list = unwrapList<Project>(json)
                const first = list[0] ?? unwrapData<Project>(json)
                if (first && typeof first === "object") {
                    const p = first as Record<string, unknown>
                    const directory =
                        (p.directory as string | undefined) ??
                        (p.worktree as string | undefined) ??
                        ((p.location as Record<string, unknown> | undefined)?.directory as string | undefined)
                    if (directory) return { ...(first as object), directory } as Project & { directory: string }
                    return first as Project
                }
            }
            // Fall through to v1 paths below (bridged on some servers).
        }

        const [projectRes, pathRes] = await Promise.all([
            fetch(apiUrl(url, 1, "/project/current"), { method: "GET", headers }),
            fetch(apiUrl(url, 1, "/path"), { method: "GET", headers })
        ])

        if (!projectRes.ok || !pathRes.ok) return

        const projectData = await projectRes.json()
        const pathData = await pathRes.json()

        if (!projectData) return

        const project = (unwrapData<Project>(projectData) ?? projectData) as Project
        const directory = (pathData as { directory?: string } | null)?.directory as string | undefined

        return { ...project, directory: directory ?? project.worktree }
    } catch {
        return
    }
}
