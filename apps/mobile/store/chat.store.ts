import { create } from "zustand"

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error"

export type SelectedModel = {
    id: string
    providerID: string
    variant?: string
}

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

    modelBySession: Record<string, SelectedModel>
    setModel: (sessionId: string, model: SelectedModel) => void

    modelByAgent: Record<string, SelectedModel>
    setModelByAgent: (agent: string, model: SelectedModel) => void

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

    modelBySession: {},
    setModel: (sessionId, model) =>
        set((state) => ({
            modelBySession: {
                ...state.modelBySession,
                [sessionId]: model,
            },
        })),

    modelByAgent: {},
    setModelByAgent: (agent, model) =>
        set((state) => ({
            modelByAgent: {
                ...state.modelByAgent,
                [agent]: model,
            },
        })),

    resetSession: (sessionId) =>
        set((state) => {
            const streamingBySession = { ...state.streamingBySession }
            const activeMessageIdBySession = { ...state.activeMessageIdBySession }
            const modelBySession = { ...state.modelBySession }
            delete streamingBySession[sessionId]
            delete activeMessageIdBySession[sessionId]
            delete modelBySession[sessionId]
            return { streamingBySession, activeMessageIdBySession, modelBySession }
        }),
}))

