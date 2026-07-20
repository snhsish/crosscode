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
