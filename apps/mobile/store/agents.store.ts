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
                    // v2 serves agents under /api/agent; v1 under /agent.
                    // Try the versioned path first, fall back to the other.
                    const paths = version >= 2 ? ["/agent", "/agent"] : ["/agent", "/agent"]
                    const tried = version >= 2
                        ? [apiUrl(url, 2, "/agent"), apiUrl(url, 1, "/agent")]
                        : [apiUrl(url, 1, "/agent"), apiUrl(url, 2, "/agent")]
                    void paths
                    for (const endpoint of tried) {
                        const res = await fetch(endpoint, {
                            method: "GET",
                            headers: {
                                "Authorization": getAuthHeader(token)
                            }
                        })
                        if (!res.ok) continue
                        const json = await res.json()
                        const all: Agent[] = unwrapList<Agent>(json)
                        if (all.length > 0) {
                            set({ agents: all.filter(a => a.mode === "primary" && !a.hidden) })
                            return
                        }
                    }
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