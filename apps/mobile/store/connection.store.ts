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
    healthy?: boolean | null
}

type ConnectionStore = {
    connections: Connection[]
    current: string | null
    activeConnections: string[]
    addConnection: (con: Omit<Connection, "id" | "added" | "healthy">) => void
    removeConnection: (id: string) => void
    updateConnection: (id: string, updates: Partial<Omit<Connection, "id" | "added">>) => void
    setCurrent: (id: string) => void
    setConnectionHealth: (id: string, healthy: boolean) => void
    toggleActiveConnection: (id: string) => void
    setActiveConnections: (ids: string[]) => void
}

export const useConnections = create<ConnectionStore>()(
    persist(
        (set) => ({
            connections: [],
            current: null,
            activeConnections: [],
            addConnection: (con) =>
                set((state) => {
                    const newCon = { ...con, id: uid(), added: Date.now(), healthy: null }
                    return {
                        connections: [...state.connections, newCon],
                        current: newCon.id,
                    }
                }),
            removeConnection: (id) =>
                set((state) => ({
                    connections: state.connections.filter((c) => c.id !== id),
                    current: state.current === id ? null : state.current,
                    activeConnections: state.activeConnections.filter((a) => a !== id),
                })),
            updateConnection: (id, updates) =>
                set((state) => ({
                    connections: state.connections.map((c) =>
                        c.id === id ? { ...c, ...updates } : c
                    ),
                })),
            setCurrent: (id) => set({ current: id }),
            setConnectionHealth: (id, healthy) =>
                set((state) => {
                    const conn = state.connections.find((c) => c.id === id)
                    if (conn && conn.healthy === healthy) return state
                    return {
                        connections: state.connections.map((c) =>
                            c.id === id ? { ...c, healthy } : c
                        ),
                    }
                }),
            toggleActiveConnection: (id) =>
                set((state) => ({
                    activeConnections: state.activeConnections.includes(id)
                        ? state.activeConnections.filter((a) => a !== id)
                        : [...state.activeConnections, id],
                })),
            setActiveConnections: (ids) => set({ activeConnections: ids }),
        }),
        {
            name: "crosscode-connections",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)