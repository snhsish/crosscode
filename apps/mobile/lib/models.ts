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
    const res = await fetch(`${url}/api/model`, {
        method: "GET",
        headers: {
            "Authorization": `Basic ${btoa(`opencode:${token}`)}`
        }
    })
    if (!res.ok) return []
    return res.json()
}

export async function fetchProviders(url: string, token: string): Promise<Provider[]> {
    const res = await fetch(`${url}/api/provider`, {
        method: "GET",
        headers: {
            "Authorization": `Basic ${btoa(`opencode:${token}`)}`
        }
    })
    if (!res.ok) return []
    return res.json()
}

export async function updateSessionModel(url: string, token: string, sessionId: string, model: { id: string; providerID: string; variant?: string }) {
    await fetch(`${url}/session/${sessionId}`, {
        method: "PATCH",
        headers: {
            "Authorization": `Basic ${btoa(`opencode:${token}`)}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ model })
    })
}
