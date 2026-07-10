import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type InputCapabilities = {
    text: boolean
    audio: boolean
    image: boolean
    video: boolean
    pdf: boolean
}

export type OutputCapabilities = {
    text: boolean
    audio: boolean
    image: boolean
    video: boolean
    pdf: boolean
}

export type ModelCapabilities = {
    temperature: boolean
    reasoning: boolean
    attachment: boolean
    toolcall: boolean
    input: InputCapabilities
    output: OutputCapabilities
    interleaved?: {
        field: string
    }
}

export type ModelCost = {
    input: number
    output: number
    cache: {
        read: number
        write: number
    }
}

export type ModelLimit = {
    context: number
    output: number
}

export type ModelApi = {
    id: string
    url: string
    npm: string
}

export type ReasoningEffort = "low" | "medium" | "high" | "max"

export type ModelVariant = {
    reasoningEffort: ReasoningEffort
}

export type ModelStatus = "active" | "deprecated" | "disabled" | string

export type Model = {
    id: string
    providerID: string
    api: ModelApi
    name: string
    family: string
    capabilities: ModelCapabilities
    cost: ModelCost
    limit: ModelLimit
    status: ModelStatus
    options: Record<string, unknown>
    headers: Record<string, string>
    release_date: string
    variants: Record<string, ModelVariant>
}

export type Provider = {
    id: string
    name: string
    source: "api" | "env" | "config" | string
    env: string[]
    /** raw credential */
    key?: string
    options: Record<string, unknown>
    models: Record<string, Model>
}

export type ProvidersResponse = {
    providers: Provider[]
}

export type SelectedModel = {
    providerID: string
    modelID: string
}

export type ModelOption = {
    providerID: string
    modelID: string
    label: string
    contextLimit: number
    reasoning: boolean
    toolcall: boolean
}

type ModelStore = {
    providers: Provider[]
    isLoadingProviders: boolean
    providersError: string | null
    fetchProviders: (baseURL: string) => Promise<void>

    selectedModelByAgent: Record<string, SelectedModel>
    setModelForAgent: (agent: string, model: SelectedModel) => void
    getModelForAgent: (agent: string) => SelectedModel | undefined

    activeAgent: string
    setActiveAgent: (agent: string) => void
}

export function flattenModels(response: ProvidersResponse): ModelOption[] {
    return response.providers.flatMap((provider) =>
        Object.values(provider.models)
            .filter((m) => m.status === "active")
            .map((m) => ({
                providerID: provider.id,
                modelID: m.id,
                label: `${provider.name} / ${m.name}`,
                contextLimit: m.limit.context,
                reasoning: m.capabilities.reasoning,
                toolcall: m.capabilities.toolcall,
            }))
    )
}

export function sanitizeProviders(response: ProvidersResponse): ProvidersResponse {
    return {
        providers: response.providers.map(({ key, ...rest }) => rest),
    }
}

export const useRecents = create<ModelStore>()(
    persist(
        (set, get) => ({
            
            providers: [],
            isLoadingProviders: false,
            providersError: null,

            fetchProviders: async (baseURL: string) => {
                set({ isLoadingProviders: true, providersError: null })
                try {
                    const res = await fetch(`${baseURL}/config/providers`)
                    if (!res.ok) throw new Error(`Failed to fetch providers: ${res.status}`)
                    const data: ProvidersResponse = await res.json()
                    const sanitized = sanitizeProviders(data)
                    set({ providers: sanitized.providers, isLoadingProviders: false })
                } catch (err) {
                    set({
                        providersError: err instanceof Error ? err.message : "Unknown error",
                        isLoadingProviders: false,
                    })
                }
            },

            selectedModelByAgent: {},

            setModelForAgent: (agent, model) =>
                set((state) => ({
                    selectedModelByAgent: {
                        ...state.selectedModelByAgent,
                        [agent]: model,
                    },
                })),

            getModelForAgent: (agent) => get().selectedModelByAgent[agent],

            activeAgent: "build",
            setActiveAgent: (agent) => set({ activeAgent: agent }),
        }),
        {
            name: "crosscode-model",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)