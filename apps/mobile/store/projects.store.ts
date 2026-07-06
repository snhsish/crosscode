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

export type RecentProject = {
    id: string
    lastWorkedOn: string
    sessions: string[]
}

type ProjectsStore = {
    projects: Project[]
    recents: RecentProject[]
    updateProjects: (projects: Project[]) => void
    upsertRecent: (recent: Partial<RecentProject> & { id: string }) => void
}

export const useProjects = create<ProjectsStore>()(
    persist(
        (set) => ({
            projects: [],
            recents: [],

            updateProjects: (projects) =>
                set(() => ({
                    projects
                })),

            upsertRecent: (recent) =>
                set((state) => {
                    const exists = state.recents.some((r) => r.id === recent.id)
                    return {
                        recents: exists
                            ? state.recents.map((r) =>
                                r.id === recent.id ? { ...r, ...recent } : r
                            )
                            : [
                                {
                                    lastWorkedOn: new Date().toISOString(),
                                    sessions: [],
                                    ...recent
                                },
                                ...state.recents
                            ]
                    }
                }),
        }),
        {
            name: "crosscode-projects",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)