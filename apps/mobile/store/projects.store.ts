import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type Project = {
    id: string
    name: string
    worktree: string
    directory: string
    vcs: string
    connectionId: string
    time: {
        created: number
        updated: number
    }
}

type ProjectsStore = {
    projects: Project[]
    setProjectForConnection: (connectionId: string, project: Omit<Project, "connectionId">) => void
}

export const useProjects = create<ProjectsStore>()(
    persist(
        (set) => ({
            projects: [],

            setProjectForConnection: (connectionId, project) =>
                set((state) => {
                    const existing = state.projects.findIndex((p) => p.connectionId === connectionId)
                    const newProject = { ...project, connectionId }
                    if (existing >= 0) {
                        const updated = [...state.projects]
                        updated[existing] = newProject
                        return { projects: updated }
                    }
                    return { projects: [...state.projects, newProject] }
                }),
        }),
        {
            name: "crosscode-projects",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)
