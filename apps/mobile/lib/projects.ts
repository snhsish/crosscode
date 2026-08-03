import { Project } from "@/store/projects.store"
import { getAuthHeader } from "@/lib/utils"

export const getCurrentProject = async (url: string, token: string) => {
    try {
        const headers = {
            "Authorization": getAuthHeader(token)
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
