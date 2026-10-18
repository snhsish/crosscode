import { apiUrl, getAuthHeader } from "@/lib/utils"
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

// The classic `GET /provider` route (served by both OpenCode v1 and v2) returns
// this shape: every model.dev provider in `all` (each carrying its own `models`
// map) plus the ids of providers that are actually connected/configured.
type LegacyModel = {
    id: string
    providerID?: string
    name?: string
    family?: string
    status?: string
    api?: { id?: string; url?: string; npm?: string }
    options?: Record<string, unknown>
    cost?: { input?: number; output?: number; cache?: { read?: number; write?: number } }
    limit?: { context?: number; input?: number | null; output?: number }
    capabilities?: {
        toolcall?: boolean
        input?: Record<string, boolean>
        output?: Record<string, boolean>
    }
    release_date?: string
    variants?: Record<string, unknown>
}

type LegacyProvider = {
    id: string
    name?: string
    env?: string[]
    models?: Record<string, LegacyModel>
}

type ProviderListResult = {
    all?: LegacyProvider[] | Record<string, LegacyProvider>
    connected?: string[]
}

function toArray<T>(value: T[] | Record<string, T> | undefined | null): T[] {
    if (!value) return []
    return Array.isArray(value) ? value : Object.values(value)
}

function modalityList(modalities: Record<string, boolean> | undefined): string[] {
    if (!modalities) return []
    return Object.entries(modalities)
        .filter(([, enabled]) => enabled === true)
        .map(([name]) => name)
}

function normalizeStatus(status: string | undefined): Model["status"] {
    if (status === "alpha" || status === "beta" || status === "deprecated" || status === "active") return status
    return "active"
}

function adaptModel(raw: LegacyModel, providerID: string): Model {
    const released = raw.release_date ? Date.parse(raw.release_date) : 0
    return {
        id: raw.id,
        apiID: raw.api?.id ?? raw.id,
        providerID: raw.providerID ?? providerID,
        family: raw.family ?? "",
        name: raw.name ?? raw.id,
        endpoint: {
            type: "unknown",
            url: raw.api?.url ?? null,
            package: raw.api?.npm,
        },
        capabilities: {
            tools: raw.capabilities?.toolcall ?? true,
            input: modalityList(raw.capabilities?.input),
            output: modalityList(raw.capabilities?.output),
        },
        status: normalizeStatus(raw.status),
        enabled: true,
        limit: {
            context: raw.limit?.context ?? 0,
            input: raw.limit?.input ?? null,
            output: raw.limit?.output ?? 0,
        },
        cost: [{
            input: raw.cost?.input ?? 0,
            output: raw.cost?.output ?? 0,
            cache: {
                read: raw.cost?.cache?.read ?? 0,
                write: raw.cost?.cache?.write ?? 0,
            },
        }],
        variants: raw.variants ? Object.keys(raw.variants).map((name) => ({ name })) : [],
        options: { variant: null, ...(raw.options ?? {}) } as ModelOptions,
        time: { released: Number.isFinite(released) ? released : 0 },
    }
}

function adaptProvider(raw: LegacyProvider): Provider {
    return {
        id: raw.id,
        name: raw.name ?? raw.id,
        enabled: true,
        env: raw.env ?? [],
        endpoint: { type: "unknown" },
    }
}

function baseUrl(url: string): string {
    return url.replace(/\/+$/, "")
}

// `GET /provider` is the same route on OpenCode v1 and v2 and is the most
// reliable source of connected providers and their models.
async function fetchProviderCatalog(url: string, token: string): Promise<{ models: Model[]; providers: Provider[] } | null> {
    try {
        const res = await fetch(`${baseUrl(url)}/provider`, {
            method: "GET",
            headers: { "Authorization": getAuthHeader(token) },
        })
        if (!res.ok) return null
        const data = await res.json() as ProviderListResult
        const all = toArray(data?.all)
        if (all.length === 0) return null

        const connected = Array.isArray(data?.connected) ? data.connected : undefined
        const providers = all.map(adaptProvider)
        const models: Model[] = []
        for (const provider of all) {
            if (connected && !connected.includes(provider.id)) continue
            const providerModels: Record<string, LegacyModel> = provider.models ?? {}
            for (const raw of Object.values(providerModels)) {
                models.push(adaptModel(raw, provider.id))
            }
        }
        return { models, providers }
    } catch (error) {
        console.error("[fetchProviderCatalog] Network error:", error)
        return null
    }
}

async function fetchModelsV2(url: string, token: string): Promise<Model[]> {
    try {
        const res = await fetch(`${baseUrl(url)}/api/model`, {
            method: "GET",
            headers: { "Authorization": getAuthHeader(token) },
        })
        if (!res.ok) {
            console.error(`[fetchModels] HTTP ${res.status} from ${url}/api/model`)
            return []
        }
        const data = await res.json()
        if (Array.isArray(data)) return data
        if (data && typeof data === "object") {
            if (Array.isArray(data.models)) return data.models
            if (Array.isArray(data.data)) return data.data
        }
        return []
    } catch (error) {
        console.error("[fetchModels] Network error:", error)
        return []
    }
}

async function fetchProvidersV2(url: string, token: string): Promise<Provider[]> {
    try {
        const res = await fetch(`${baseUrl(url)}/api/provider`, {
            method: "GET",
            headers: { "Authorization": getAuthHeader(token) },
        })
        if (!res.ok) return []
        const data = await res.json()
        if (Array.isArray(data)) return data
        if (data && typeof data === "object" && Array.isArray(data.data)) return data.data
        return []
    } catch (error) {
        console.error("[fetchProviders] Network error:", error)
        return []
    }
}

export async function fetchModels(url: string, token: string): Promise<Model[]> {
    const catalog = await fetchProviderCatalog(url, token)
    if (catalog) return catalog.models
    // Fall back to the v2 experimental routes (available/connected only).
    return fetchModelsV2(url, token)
}

export async function fetchProviders(url: string, token: string): Promise<Provider[]> {
    const catalog = await fetchProviderCatalog(url, token)
    if (catalog) return catalog.providers
    return fetchProvidersV2(url, token)
}

// Single round-trip used by the models store: prefer the shared /provider route
// and only fall back to the two v2 routes when it is unavailable.
export async function fetchModelsAndProviders(url: string, token: string): Promise<{ models: Model[]; providers: Provider[] }> {
    const catalog = await fetchProviderCatalog(url, token)
    if (catalog) return catalog
    const [models, providers] = await Promise.all([
        fetchModelsV2(url, token),
        fetchProvidersV2(url, token),
    ])
    return { models, providers }
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
        await fetch(`${baseUrl(url)}/session/${sessionId}`, {
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
