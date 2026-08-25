import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export interface DailyBucket {
  inputTokens: number
  outputTokens: number
  cost: number
  responses: number
}

export const DAILY_HISTORY_LIMIT = 30

export interface ProjectStats {
  projectId: string
  projectName: string
  responseCount: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  lastResponseAt: string | null
  firstResponseAt: string | null
  /** Per-day usage keyed by YYYY-MM-DD (UTC), capped at DAILY_HISTORY_LIMIT days. */
  dailyHistory: Record<string, DailyBucket>
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

function pruneHistory(history: Record<string, DailyBucket>): Record<string, DailyBucket> {
  const keys = Object.keys(history).sort()
  if (keys.length <= DAILY_HISTORY_LIMIT) return history
  const next: Record<string, DailyBucket> = {}
  for (const key of keys.slice(keys.length - DAILY_HISTORY_LIMIT)) {
    next[key] = history[key]
  }
  return next
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

          const key = todayKey()
          const prevBucket = existing?.dailyHistory?.[key] ?? {
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
            responses: 0,
          }
          const dailyHistory = pruneHistory({
            ...(existing?.dailyHistory ?? {}),
            [key]: {
              inputTokens: prevBucket.inputTokens + inputTokens,
              outputTokens: prevBucket.outputTokens + outputTokens,
              cost: prevBucket.cost + cost,
              responses: prevBucket.responses + 1,
            },
          })

          const updated: ProjectStats = {
            projectId,
            projectName,
            responseCount: (existing?.responseCount ?? 0) + 1,
            totalInputTokens: (existing?.totalInputTokens ?? 0) + inputTokens,
            totalOutputTokens: (existing?.totalOutputTokens ?? 0) + outputTokens,
            totalCost: (existing?.totalCost ?? 0) + cost,
            lastResponseAt: now,
            firstResponseAt: existing?.firstResponseAt ?? now,
            dailyHistory,
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
