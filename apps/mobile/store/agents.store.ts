import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { Agent } from "../lib/opencode"
import { apiUrl, getAuthHeader, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export type AgentStore = {
    agents: Agent[]
    setAgents: (agents: Agent[]) => void
    fetchAgents: (url: string, token: string) => Promise<void>
}

export const useAgents = create<AgentStore>()(
    persist(
        (set, get) => ({
            agents: [],

            setAgents: (agents) => set({ agents }),
            fetchAgents: async (url, token) => {
                try {
                    const version = getServerVersion(url)
                    const res = await fetch(apiUrl(url, version, "/agent"), {
                        method: "GET",
                        headers: {
                            "Authorization": getAuthHeader(token)
                        }
                    })
                    if (!res.ok) return
                    const all = unwrapList<Agent>(await res.json())
                    set({ agents: all.filter(a => a.mode === "primary" && !a.hidden) })
                } catch (error) {
                    console.error("[fetchAgents] Failed to fetch agents:", error)
                }
            }
        }),
        {
            name: "crosscode-agents",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)