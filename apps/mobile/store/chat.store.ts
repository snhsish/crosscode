// DO NOT MAKE THIS PERSISTENT - JUST IN-MEMORY

import { create } from "zustand"

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error"

type ChatStore = {
    streamingBySession: Record<string, boolean>
    setStreaming: (sessionId: string, streaming: boolean) => void

    draftBySession: Record<string, string>
    setDraft: (sessionId: string, text: string) => void
    clearDraft: (sessionId: string) => void

    connectionStatus: ConnectionStatus
    setConnectionStatus: (status: ConnectionStatus) => void

    activeMessageIdBySession: Record<string, string | null>
    setActiveMessageId: (sessionId: string, messageId: string | null) => void

    resetSession: (sessionId: string) => void
}

export const useChatStore = create<ChatStore>()((set) => ({
    streamingBySession: {},
    setStreaming: (sessionId, streaming) =>
        set((state) => ({
            streamingBySession: {
                ...state.streamingBySession,
                [sessionId]: streaming,
            },
        })),

    draftBySession: {},
    setDraft: (sessionId, text) =>
        set((state) => ({
            draftBySession: {
                ...state.draftBySession,
                [sessionId]: text,
            },
        })),
    
    clearDraft: (sessionId) =>
        set((state) => {
            const next = { ...state.draftBySession }
            delete next[sessionId]
            return { draftBySession: next }
        }),
    
    connectionStatus: "disconnected",
    setConnectionStatus: (status) => set({ connectionStatus: status }),

    activeMessageIdBySession: {},
    setActiveMessageId: (sessionId, messageId) =>
        set((state) => ({
            activeMessageIdBySession: {
                ...state.activeMessageIdBySession,
                [sessionId]: messageId,
            },
        })),

    resetSession: (sessionId) =>
        set((state) => {
            const streamingBySession = { ...state.streamingBySession }
            const activeMessageIdBySession = { ...state.activeMessageIdBySession }
            delete streamingBySession[sessionId]
            delete activeMessageIdBySession[sessionId]
            return { streamingBySession, activeMessageIdBySession }
        }),
}))

