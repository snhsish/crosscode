import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

let nextID = 1

const uid = () => {
    return `${Date.now()}-${nextID++}`
}

export type Connection = {
    id: string
    url: string
    token: string
    name: string
    added: number
}

type ConnectionStore = {
    connections: Connection[]
    current: string | null
    addConnection: (con: Omit<Connection, "id" | "added">) => void
    removeConnection: (id: string) => void
    setCurrent: (id: string) => void
}

export const useConnections = create<ConnectionStore>()(
    persist(
        (set) => ({
            connections: [],
            current: null,
            addConnection: (con) =>
                set((state) => {
                    const newCon = { ...con, id: uid(), added: Date.now() }
                    return {
                        connections: [...state.connections, newCon],
                        current: newCon.id
                    }
                }),
            removeConnection: (id) =>
                set((state) => ({
                    connections: state.connections.filter((c) => c.id !== id),
                    current: state.current === id ? null : state.current,
                })),
            setCurrent: (id) => set({ current: id }),
        }),
        {
            name: "crosscode-connections",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)