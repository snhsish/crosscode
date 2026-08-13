import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type QuickPrompt = {
    id: string
    title: string
    prompt: string
}

export const PRE_DEFINED_PROMPTS: QuickPrompt[] = [
    { id: "pre-explain", title: "Explain codebase", prompt: "Explain the structure and key components of this codebase" },
    { id: "pre-find-bugs", title: "Find bugs", prompt: "Find and fix any bugs in the recent changes" },
    { id: "pre-write-tests", title: "Write tests", prompt: "Write tests for the recent changes" },
    { id: "pre-refactor", title: "Refactor", prompt: "Refactor the recent code changes for better readability and maintainability" },
    { id: "pre-review", title: "Review code", prompt: "Review the recent changes and suggest improvements" },
    { id: "pre-add-docs", title: "Add docs", prompt: "Add documentation and comments to the recent code changes" },
    { id: "pre-fix-lint", title: "Fix lint", prompt: "Find and fix all linting and type errors" },
    { id: "pre-debug", title: "Debug error", prompt: "Help me debug the error in the current context" },
]

type QuickPromptsStore = {
    userPrompts: QuickPrompt[]
    addPrompt: (prompt: Omit<QuickPrompt, "id">) => void
    removePrompt: (id: string) => void
    updatePrompt: (id: string, updates: { title?: string; prompt?: string }) => void
}

export const useQuickPromptsStore = create<QuickPromptsStore>()(
    persist(
        (set) => ({
            userPrompts: [],
            addPrompt: (prompt) =>
                set((state) => ({
                    userPrompts: [
                        ...state.userPrompts,
                        { ...prompt, id: `user-${Date.now()}` },
                    ],
                })),
            removePrompt: (id) =>
                set((state) => ({
                    userPrompts: state.userPrompts.filter((p) => p.id !== id),
                })),
            updatePrompt: (id, updates) =>
                set((state) => ({
                    userPrompts: state.userPrompts.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                })),
        }),
        {
            name: "crosscode-quick-prompts",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
