import { getAuthHeader } from "@/lib/utils"

export type MentionKind = "file" | "agent"

export type ResolvedMention = {
    kind: MentionKind
    token: string
    path?: string
    agent?: string
}

export type SendMention = {
    kind: MentionKind
    path?: string
    agent?: string
}

export type MentionFilePart = {
    mime: string
    url: string
    filename: string
}

export const MAX_MENTION_FILES = 5
export const MAX_MENTION_BYTES = 100_000

const TOKEN_CHAR = /[A-Za-z0-9_./+-]/

export const detectMentionTrigger = (
    text: string,
    cursor: number,
): { start: number; query: string } | null => {
    let i = Math.min(cursor, text.length) - 1
    while (i >= 0 && TOKEN_CHAR.test(text[i]!)) i--
    if (i < 0 || text[i] !== "@") return null
    if (i > 0 && !/\s/.test(text[i - 1]!)) return null
    return { start: i, query: text.slice(i + 1, Math.min(cursor, text.length)) }
}

export const applyMention = (
    text: string,
    start: number,
    cursor: number,
    insert: string,
): { text: string; cursor: number } => {
    const next = text.slice(0, start) + insert + " " + text.slice(cursor)
    return { text: next, cursor: start + insert.length + 1 }
}

export type SubagentInfo = { name: string; description?: string }

export const filterSubagents = (
    agents: Array<{ name: string; mode?: string; hidden?: boolean; description?: string }>,
    query: string,
): SubagentInfo[] => {
    const q = query.toLowerCase()
    return agents
        .filter((a) => a.mode === "subagent" && !a.hidden && a.name.toLowerCase().includes(q))
        .map((a) => ({ name: a.name, description: a.description }))
}

export const fetchFileSuggestions = async (
    url: string,
    token: string,
    query: string,
    opts?: { limit?: number; signal?: AbortSignal },
): Promise<string[]> => {
    try {
        const params = new URLSearchParams({
            query,
            limit: String(opts?.limit ?? 20),
        })
        const res = await fetch(`${url}/find/file?${params.toString()}`, {
            headers: { Authorization: getAuthHeader(token) },
            signal: opts?.signal,
        })
        if (!res.ok) return []
        const data = (await res.json()) as unknown
        return Array.isArray(data) ? data.filter((p): p is string => typeof p === "string") : []
    } catch {
        return []
    }
}

const toBase64Utf8 = (input: string): string => {
    const bytes = new Uint8Array(new TextEncoder().encode(input))
    let binary = ""
    const CHUNK = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
    }
    return btoa(binary)
}

export const fetchMentionFilePart = async (
    url: string,
    token: string,
    path: string,
): Promise<MentionFilePart | null> => {
    try {
        const params = new URLSearchParams({ path })
        const res = await fetch(`${url}/file/content?${params.toString()}`, {
            headers: { Authorization: getAuthHeader(token) },
        })
        if (!res.ok) return null
        const data = (await res.json()) as { content?: unknown; text?: unknown }
        const content = typeof data.content === "string" ? data.content : typeof data.text === "string" ? data.text : null
        if (content === null || content.length === 0 || content.length > MAX_MENTION_BYTES) return null
        if (content.includes("\0")) return null
        return {
            mime: "text/plain",
            url: `data:text/plain;base64,${toBase64Utf8(content)}`,
            filename: path,
        }
    } catch {
        return null
    }
}

export const resolveSendMentions = async (
    url: string,
    token: string,
    mentions: SendMention[],
    validSubagents: Set<string>,
): Promise<{ files: MentionFilePart[]; agent?: string }> => {
    const seen = new Set<string>()
    const paths: string[] = []
    for (const m of mentions) {
        if (m.kind === "file" && m.path && !seen.has(m.path)) {
            seen.add(m.path)
            paths.push(m.path)
        }
    }
    let agent: string | undefined
    for (const m of mentions) {
        if (m.kind === "agent" && m.agent && validSubagents.has(m.agent)) agent = m.agent
    }
    const files: MentionFilePart[] = []
    for (const path of paths.slice(0, MAX_MENTION_FILES)) {
        const part = await fetchMentionFilePart(url, token, path)
        if (part) files.push(part)
    }
    return { files, agent }
}
