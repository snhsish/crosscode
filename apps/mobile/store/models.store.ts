import { create } from "zustand"
import { Model, Provider, fetchModels, fetchProviders } from "../lib/models"

type ModelsStore = {
    models: Model[]
    providers: Provider[]
    fetchAll: (url: string, token: string) => Promise<void>
}

export const useModels = create<ModelsStore>()((set) => ({
    models: [],
    providers: [],

    fetchAll: async (url, token) => {
        const [models, providers] = await Promise.all([
            fetchModels(url, token),
            fetchProviders(url, token),
        ])
        set({ models, providers })
    },
}))
