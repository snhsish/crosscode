export function capitalizeAgent(name: string): string {
    if (!name) return name
    return name.charAt(0).toUpperCase() + name.slice(1)
}

const FIXED_AGENT_COLORS: Record<string, string> = {
    build: "#3b82f6",
    plan: "#f59e0b",
}

function hashHue(name: string): number {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0
    }
    return hash % 360
}

export function agentDotColor(name: string): string {
    const fixed = FIXED_AGENT_COLORS[name.toLowerCase()]
    if (fixed) return fixed
    return `hsl(${hashHue(name.toLowerCase())} 70% 50%)`
}
