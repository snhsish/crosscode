import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export interface ProjectStats {
  projectId: string
  projectName: string
  responseCount: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  lastResponseAt: string | null
  firstResponseAt: string | null
}

type OpencodeStatsStore = {
  projects: Record<string, ProjectStats>
  incrementProjectStats: (
    projectId: string,
    projectName: string,
    inputTokens: number,
    outputTokens: number,
    cost: number
  ) => void
  resetProjectStats: (projectId: string) => void
  resetAllStats: () => void
  getProjectStats: (projectId: string) => ProjectStats | null
  getAllProjectStats: () => ProjectStats[]
}

export const useOpencodeStats = create<OpencodeStatsStore>()(
  persist(
    (set, get) => ({
      projects: {},

      incrementProjectStats: (projectId, projectName, inputTokens, outputTokens, cost) => {
        set((state) => {
          const existing = state.projects[projectId]
          const now = new Date().toISOString()

          const updated: ProjectStats = {
            projectId,
            projectName,
            responseCount: (existing?.responseCount ?? 0) + 1,
            totalInputTokens: (existing?.totalInputTokens ?? 0) + inputTokens,
            totalOutputTokens: (existing?.totalOutputTokens ?? 0) + outputTokens,
            totalCost: (existing?.totalCost ?? 0) + cost,
            lastResponseAt: now,
            firstResponseAt: existing?.firstResponseAt ?? now,
          }

          return {
            projects: {
              ...state.projects,
              [projectId]: updated,
            },
          }
        })
      },

      resetProjectStats: (projectId) => {
        set((state) => {
          const newProjects = { ...state.projects }
          delete newProjects[projectId]
          return { projects: newProjects }
        })
      },

      resetAllStats: () => {
        set({ projects: {} })
      },

      getProjectStats: (projectId) => {
        return get().projects[projectId] ?? null
      },

      getAllProjectStats: () => {
        return Object.values(get().projects).sort(
          (a, b) => (b.lastResponseAt ?? "").localeCompare(a.lastResponseAt ?? "")
        )
      },
    }),
    {
      name: "crosscode-opencode-stats",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
