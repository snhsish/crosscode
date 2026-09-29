import { Project } from "@/store/projects.store"
import { getAuthHeader } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export const getCurrentProject = async (url: string, token: string) => {
    try {
        const headers = {
            "Authorization": getAuthHeader(token)
        }

        if (getServerVersion(url) >= 2) {
            // v2 exposes the current location (directory + project) in one call.
            const res = await fetch(`${url.replace(/\/+$/, "")}/api/location`, { method: "GET", headers })
            if (!res.ok) return
            const data = await res.json() as {
                directory?: string
                project?: Project & { directory?: string }
            }
            if (!data?.project) return
            const project = data.project
            const directory = data.directory ?? project.directory ?? project.worktree ?? ""
            const name = project.name
                ?? directory.replace(/\/+$/, "").split("/").filter(Boolean).pop()
                ?? "Project"
            return {
                ...project,
                id: project.id,
                name,
                worktree: project.worktree ?? directory,
                directory,
                vcs: project.vcs ?? "",
                time: project.time ?? { created: 0, updated: 0 },
            }
        }

        const [projectRes, pathRes] = await Promise.all([
            fetch(`${url}/project/current`, { method: "GET", headers }),
            fetch(`${url}/path`, { method: "GET", headers })
        ])

        if (!projectRes.ok || !pathRes.ok) return

        const projectData = await projectRes.json()
        const pathData = await pathRes.json()

        if (!projectData) return

        const project = projectData as Project
        const directory = pathData?.directory as string | undefined

        return { ...project, directory: directory ?? project.worktree }
    } catch {
        return
    }
}
