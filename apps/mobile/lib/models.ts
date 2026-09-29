import { apiUrl, getAuthHeader, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

type ModelEndpoint = {
    type: string
    url?: string | null
    package?: string
    websocket?: boolean
    reasoning?: { type: string }
}

type ModelCapabilities = {
    tools: boolean
    input: string[]
    output: string[]
}

type ModelCostTier = {
    tier?: { type: string; size: number }
    input: number
    output: number
    cache: { read: number; write: number }
}

type ModelLimit = {
    context: number
    input: number | null
    output: number
}

export type ModelVariant = {
    name: string
    size?: number
}

export type ModelOptions = {
    variant: string | null
    [key: string]: unknown
}

export type Model = {
    id: string
    apiID: string
    providerID: string
    family: string
    name: string
    endpoint: ModelEndpoint
    capabilities: ModelCapabilities
    status: "alpha" | "beta" | "deprecated" | "active"
    enabled: boolean
    limit: ModelLimit
    cost: ModelCostTier[]
    variants: ModelVariant[]
    options: ModelOptions
    time: { released: number }
}

export type Provider = {
    id: string
    name: string
    enabled: { via: string; service?: string; name?: string } | boolean
    env: string[]
    endpoint: ModelEndpoint
}

export async function fetchModels(url: string, token: string): Promise<Model[]> {
    try {
        // Unchanged across versions: both serve GET /api/model.
        const endpoint = `${url.replace(/\/+$/, "")}/api/model`
        const res = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })
        if (!res.ok) {
            console.error(`[fetchModels] HTTP ${res.status} from ${endpoint}`)
            return []
        }
        const json = await res.json()
        // v1 may return a map of models instead of an array
        if (json && typeof json === "object" && !Array.isArray(json) && !("data" in json)) {
            const raw = json as Record<string, unknown>
            if (Array.isArray(raw.models)) return raw.models as Model[]
            if (Array.isArray(raw.data)) return raw.data as Model[]
            const values = Object.values(raw)
            if (values.length > 0 && typeof values[0] === "object" && !Array.isArray(values[0])) {
                return values as Model[]
            }
            console.error("[fetchModels] Unexpected response shape:", JSON.stringify(json).slice(0, 200))
            return []
        }
        const data = unwrapList<Model>(json)
        return data
    } catch (error) {
        console.error("[fetchModels] Network error:", error)
        return []
    }
}

export async function fetchProviders(url: string, token: string): Promise<Provider[]> {
    try {
        // Unchanged across versions: both serve GET /api/provider.
        const res = await fetch(`${url.replace(/\/+$/, "")}/api/provider`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })
        if (!res.ok) return []
        const data = await res.json()
        const list = unwrapList<Provider | Record<string, unknown>>(data)
        if (list.length > 0) return list as Provider[]
        if (data && typeof data === "object" && !Array.isArray(data)) {
            return Object.values(data) as Provider[]
        }
        return []
    } catch (error) {
        console.error("[fetchProviders] Network error:", error)
        return []
    }
}

export async function updateSessionModel(url: string, token: string, sessionId: string, model: { id: string; providerID: string; variant?: string }) {
    try {
        const version = getServerVersion(url)
        if (version >= 2) {
            // v2 sets the model via a dedicated endpoint (PATCH /session no longer accepts it).
            await fetch(`${apiUrl(url, version, "/session")}/${sessionId}/model`, {
                method: "POST",
                headers: {
                    "Authorization": getAuthHeader(token),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ model })
            })
            return
        }
        await fetch(`${url}/session/${sessionId}`, {
            method: "PATCH",
            headers: {
                "Authorization": getAuthHeader(token),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ model })
        })
    } catch (error) {
        console.error("[updateSessionModel] Failed:", error)
    }
}
