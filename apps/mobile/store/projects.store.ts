import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type Project = {
    id: string
    name: string
    worktree: string
    vcs: string
    time: {
        created: number
        updated: number
    }
}

type ProjectsStore = {
    projects: Project[]
    currentProjectId: string | null
    updateProjects: (projects: Project[]) => void
    setCurrentProjectId: (id: string) => void
}

export const useProjects = create<ProjectsStore>()(
    persist(
        (set) => ({
            projects: [],
            currentProjectId: null,

            updateProjects: (projects) =>
                set(() => ({
                    projects
                })),

            setCurrentProjectId: (id) => set({ currentProjectId: id }),
        }),
        {
            name: "crosscode-projects",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)
