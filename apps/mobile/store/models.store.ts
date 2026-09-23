import { create } from "zustand"
import { Model, Provider, fetchModels, fetchProviders } from "../lib/models"

type ModelsStore = {
    models: Model[]
    providers: Provider[]
    fetchAll: (url: string, token: string) => Promise<void>
}

let inflight: Promise<void> | null = null
let lastFetchedAt = 0
const STALE_MS = 5 * 60 * 1000

export const useModels = create<ModelsStore>()((set, get) => ({
    models: [],
    providers: [],

    fetchAll: async (url, token) => {
        // Dedup concurrent calls (chat + models screens mount together)
        // and skip refetch within stale window.
        if (inflight) return inflight
        if (Date.now() - lastFetchedAt < STALE_MS && get().models.length > 0) return
        inflight = (async () => {
            const [models, providers] = await Promise.all([
                fetchModels(url, token),
                fetchProviders(url, token),
            ])
            const current = get()
            lastFetchedAt = Date.now()
            if (current.models.length === models.length && current.providers.length === providers.length) {
                const modelsMatch = models.every((m, i) => m.id === current.models[i]?.id && m.providerID === current.models[i]?.providerID && m.name === current.models[i]?.name)
                const providersMatch = providers.every((p, i) => p.id === current.providers[i]?.id && p.name === current.providers[i]?.name)
                if (modelsMatch && providersMatch) return
            }
            set({ models, providers })
        })()
        try {
            await inflight
        } finally {
            inflight = null
        }
    },
}))
