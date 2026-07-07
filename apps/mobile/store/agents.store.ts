import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { Agent } from "../lib/opencode"

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
                const res = await fetch(`${url}/agent`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Basic ${btoa(`opencode:${token}`)}`
                    }
                })
                const all: Agent[] = await res.json()
                set({ agents: all.filter(a => a.mode === "primary" && !a.hidden) })
            }
        }),
        {
            name: "crosscode-agents",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)