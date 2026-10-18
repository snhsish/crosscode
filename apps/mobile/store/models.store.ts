import { create } from "zustand"
import { Model, Provider, fetchModelsAndProviders } from "../lib/models"

type FetchOptions = {
    /** Bypass the stale window and always hit the network. */
    force?: boolean
}

type ModelsStore = {
    models: Model[]
    providers: Provider[]
    fetchAll: (url: string, token: string, options?: FetchOptions) => Promise<void>
}

let inflight: { url: string; promise: Promise<void> } | null = null
let lastFetched: { url: string; at: number } | null = null
const STALE_MS = 5 * 60 * 1000

export const useModels = create<ModelsStore>()((set, get) => ({
    models: [],
    providers: [],

    fetchAll: async (url, token, options) => {
        const force = options?.force ?? false
        // Dedup concurrent calls for the same server (chat + models screens
        // mount together), then skip refetch within the stale window unless
        // forced or the connection changed.
        if (inflight && inflight.url === url) return inflight.promise
        const fresh = lastFetched?.url === url && Date.now() - lastFetched.at < STALE_MS
        if (!force && fresh && get().models.length > 0) return

        const promise = (async () => {
            const { models, providers } = await fetchModelsAndProviders(url, token)
            const current = get()
            lastFetched = { url, at: Date.now() }
            if (current.models.length === models.length && current.providers.length === providers.length) {
                const modelsMatch = models.every((m, i) => m.id === current.models[i]?.id && m.providerID === current.models[i]?.providerID && m.name === current.models[i]?.name)
                const providersMatch = providers.every((p, i) => p.id === current.providers[i]?.id && p.name === current.providers[i]?.name)
                if (modelsMatch && providersMatch) return
            }
            set({ models, providers })
        })()
        inflight = { url, promise }
        try {
            await promise
        } finally {
            if (inflight?.promise === promise) inflight = null
        }
    },
}))
