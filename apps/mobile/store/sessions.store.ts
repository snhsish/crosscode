import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type SessionModel = {
    id: string
    providerID: string
    variant?: string
}

export type Session = {
    id: string
    projectID: string
    directory: string
    parentID?: string
    summary?: {
        additions: number
        deletions: number
        files: number
        diffs?: Array<FileDiff>
    }
    share?: {
        url: string
    }
    title: string
    agent?: string
    model?: SessionModel
    version: string
    time: {
        created: number
        updated: number
        compacting?: number
    }
    revert?: {
        messageID: string
        partID?: string
        snapshot?: string
        diff?: string
    }
}

export type FileDiff = {
    file: string
    before: string
    after: string
    additions: number
    deletions: number
}

export type SessionsStore = {
    sessions: Session[]
    upsertSession: (session: Session) => void
    upsertSessions: (sessions: Session[]) => void
    removeSession: (id: string) => void
}

export const useSessions = create<SessionsStore>()(
    persist(
        (set) => ({
            sessions: [],
            upsertSession: (session) =>
                set((state) => {
                    const index = state.sessions.findIndex((s) => s.id === session.id)

                    if (index === -1) {
                        return { sessions: [...state.sessions, session] }
                    }

                    const sessions = [...state.sessions]
                    sessions[index] = { ...sessions[index], ...session }
                    return { sessions }
                }),
            upsertSessions: (incoming) =>
                set((state) => {
                    const byId = new Map(state.sessions.map((s) => [s.id, s]))
                    let changed = false

                    for (const session of incoming) {
                        const existing = byId.get(session.id)
                        if (existing) {
                            const merged = { ...existing, ...session }
                            const hasChanges = Object.keys(merged).some(
                                (key) => (merged as any)[key] !== (existing as any)[key]
                            )
                            if (hasChanges) {
                                byId.set(session.id, merged)
                                changed = true
                            }
                        } else {
                            byId.set(session.id, session)
                            changed = true
                        }
                    }

                    if (!changed) return state
                    return { sessions: Array.from(byId.values()) }
                }),
            removeSession: (id) =>
                set((state) => ({
                    sessions: state.sessions.filter((s) => s.id !== id),
                })),
        }),
        {
            name: "crosscode-sessions",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)