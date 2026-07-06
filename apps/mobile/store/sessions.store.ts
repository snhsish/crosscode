import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

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

                    for (const session of incoming) {
                        const existing = byId.get(session.id)
                        byId.set(session.id, existing ? { ...existing, ...session } : session)
                    }

                    return { sessions: Array.from(byId.values()) }
                }),
        }),
        {
            name: "crosscode-sessions",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)