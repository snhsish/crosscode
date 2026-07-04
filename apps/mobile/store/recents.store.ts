import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type OpenCodeProject = {
    id: string
    worktree: string
    vcs: string
    time: {
        created: number
        updated: number
    }
}

type RecentsStore = {
    recents: OpenCodeProject[]
    lastUpdated: number
    updateRecents: (recents: OpenCodeProject[]) => void
}

export const useRecents = create<RecentsStore>()(
    persist(
        (set) => ({
            recents: [],
            lastUpdated: Date.now(),
            updateRecents: (recents) =>
                set(() => ({
                    recents,
                    lastUpdated: Date.now()
                })),
        }),
        {
            name: "crosscode-recents",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)