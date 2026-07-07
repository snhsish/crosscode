export type AgentPermission = "allow" | "ask" | "deny"
export type AgentMode = "primary" | "subagent"

export type Permission = {
    permission: string
    pattern: string
    action: AgentPermission
}

export type Agent = {
    name: string
    mode: AgentMode
    native: boolean
    description?: string
    hidden?: boolean
    temperature?: number
    prompt?: string
    permission: Permission[]
    options: Record<string, unknown>
}

export const getAgents = async (url: string, token: string): Promise<Agent[]> => {
    const res = await fetch(`${url}/agent`, {
        method: "GET",
        headers: {
            "Authorization": `Basic ${btoa(`opencode:${token}`)}`
        }
    })
    const agents: Agent[] = await res.json()
    return agents.filter(a => a.mode === "primary" && !a.hidden)
}