import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { FileDiff } from "./sessions.store"

export type ToolInvocation = {
    state: "call" | "result" | "error"
    toolCallId: string
    toolName: string
    args?: unknown
    result?: unknown
    error?: unknown
    step?: number
}

export type Part =
    | { type: "text"; text: string }
    | { type: "reasoning"; text: string }
    | { type: "tool-invocation"; toolInvocation: ToolInvocation }
    | { type: "source-url"; url: string; title?: string }
    | { type: "file"; mime: string; url: string; filename?: string }
    | { type: "step-start"; snapshot?: string }

export type UserMessage = {
    id: string
    sessionID: string
    role: "user"
    time: {
        created: number
    }
    summary?: {
        title?: string
        body?: string
        diffs: Array<FileDiff>
    }
    agent: string
    model: {
        providerID: string
        modelID: string
    }
    system?: string
    tools?: {
        [key: string]: boolean
    }
    parts?: Part[]
}

export type AssistantMessage = {
    id: string
    sessionID: string
    role: "assistant"
    time: {
        created: number
        completed?: number
    }
    error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError
    parentID: string
    modelID: string
    providerID: string
    mode: string
    path: {
        cwd: string
        root: string
    }
    summary?: boolean
    cost: number
    tokens: {
        input: number
        output: number
        reasoning: number
        cache: {
            read: number
            write: number
        }
    }
    finish?: string
    parts?: Part[]
}

export type ProviderAuthError = {
    name: "ProviderAuthError"
    data: {
        providerID: string
        message: string
    }
}

export type UnknownError = {
    name: "UnknownError"
    data: {
        message: string
    }
}

export type MessageOutputLengthError = {
    name: "MessageOutputLengthError"
    data: {
        [key: string]: unknown
    }
}

export type MessageAbortedError = {
    name: "MessageAbortedError"
    data: {
        message: string
    }
}

export type ApiError = {
    name: "APIError"
    data: {
        message: string
        statusCode?: number
        isRetryable: boolean
        responseHeaders?: {
            [key: string]: string
        }
        responseBody?: string
    }
}

export type Message = UserMessage | AssistantMessage

type MessagesStore = {
    messagesBySession: Record<string, Message[]>
    upsertMessages: (sessionId: string, messages: Message[]) => void
    getMessagesBySession: (sessionId: string) => Message[]
}

export const useMessages = create<MessagesStore>()(
    persist(
        (set, get) => ({
            messagesBySession: {},

            upsertMessages: (sessionId, messages) =>
                set((state) => {
                    const existing = state.messagesBySession[sessionId] ?? []
                    const map = new Map(existing.map((m) => [m.id, m]))

                    for (const m of messages) {
                        map.set(m.id, m)
                    }

                    return {
                        messagesBySession: {
                            ...state.messagesBySession,
                            [sessionId]: Array.from(map.values()),
                        },
                    }
                }),
            
            getMessagesBySession: (sessionId) => get().messagesBySession[sessionId] ?? [],
        }),
        {
            name: "crosscode-messages",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)