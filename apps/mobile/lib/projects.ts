import { Project } from "@/store/projects.store"

export const getCurrentProject = async (url: string, token: string) => {
    try {
        const headers = {
            "Authorization": `Basic ${btoa(`opencode:${token}`)}`
        }

        const [projectRes, pathRes] = await Promise.all([
            fetch(`${url}/project/current`, { method: "GET", headers }).then((r) => r.json()),
            fetch(`${url}/path`, { method: "GET", headers }).then((r) => r.json())
        ])

        if (!projectRes) return

        const project = projectRes as Project
        const directory = pathRes?.directory as string | undefined

        return { ...project, directory: directory ?? project.worktree }
    } catch {
        return
    }
}
