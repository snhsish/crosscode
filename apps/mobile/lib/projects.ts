import { Project } from "@/store/projects.store"

export const getProjects = async (url: string, token: string) => {
    try {
        const res = await fetch(`${url}/project`, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`
            }
        }).then((r) => r.json()) as Project[]

        if (!res) return

        const data = res

        return data
    } catch {
        return
    }
}