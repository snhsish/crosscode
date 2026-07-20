import { Project } from "@/store/projects.store"

export const getCurrentProject = async (url: string, token: string) => {
    try {
        const res = await fetch(`${url}/project/current`, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${token}`)}`
            }
        }).then((r) => r.json()) as Project

        if (!res) return

        return res
    } catch {
        return
    }
}
