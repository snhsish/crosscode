import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type QuestionOption = {
    label: string
    description: string
}

export type QuestionInfo = {
    question: string
    header: string
    options: QuestionOption[]
    multiple?: boolean
    custom?: boolean
}

export type QuestionTool = {
    messageID: string
    callID: string
}

export type QuestionRequest = {
    id: string
    sessionID: string
    questions: QuestionInfo[]
    tool?: QuestionTool
}

type QuestionsStore = {
    questionsBySession: Record<string, QuestionRequest[]>
    setQuestions: (sessionId: string, questions: QuestionRequest[]) => void
    removeQuestion: (sessionId: string, requestId: string) => void
    clearSessionQuestions: (sessionId: string) => void
}

export const useQuestions = create<QuestionsStore>()(
    persist(
        (set) => ({
            questionsBySession: {},

            setQuestions: (sessionId, questions) =>
                set((state) => ({
                    questionsBySession: {
                        ...state.questionsBySession,
                        [sessionId]: questions,
                    },
                })),

            removeQuestion: (sessionId, requestId) =>
                set((state) => ({
                    questionsBySession: {
                        ...state.questionsBySession,
                        [sessionId]: (state.questionsBySession[sessionId] ?? []).filter(
                            (q) => q.id !== requestId
                        ),
                    },
                })),

            clearSessionQuestions: (sessionId) =>
                set((state) => {
                    const next = { ...state.questionsBySession }
                    delete next[sessionId]
                    return { questionsBySession: next }
                }),
        }),
        {
            name: "crosscode-questions",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
