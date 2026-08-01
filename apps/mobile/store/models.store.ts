import { create } from "zustand"
import { Model, Provider, fetchModels, fetchProviders } from "../lib/models"

type ModelsStore = {
    models: Model[]
    providers: Provider[]
    fetchAll: (url: string, token: string) => Promise<void>
}

export const useModels = create<ModelsStore>()((set, get) => ({
    models: [],
    providers: [],

    fetchAll: async (url, token) => {
        const [models, providers] = await Promise.all([
            fetchModels(url, token),
            fetchProviders(url, token),
        ])
        const current = get()
        if (current.models.length === models.length && current.providers.length === providers.length) {
            const modelsMatch = models.every((m, i) => m.id === current.models[i]?.id)
            const providersMatch = providers.every((p, i) => p.id === current.providers[i]?.id)
            if (modelsMatch && providersMatch) return
        }
        set({ models, providers })
    },
}))
