import { getAuthHeader } from "@/lib/utils"
import { normalizeLanguage } from "@/lib/prism"

export type FileEntryType = "file" | "directory"

export type FileEntry = {
    path: string
    type: FileEntryType
}

export type FileStatusKind = "added" | "modified" | "deleted"

export type FileStatuses = Record<string, FileStatusKind>

const MAX_CONTENT_BYTES = 200 * 1024

function normalizeFileEntry(value: unknown): FileEntry | null {
    if (!value || typeof value !== "object") return null
    const entry = value as Record<string, unknown>
    const path = typeof entry.path === "string" ? entry.path : typeof entry.name === "string" ? entry.name : undefined
    if (!path) return null
    const rawType = typeof entry.type === "string" ? entry.type : ""
    const type: FileEntryType = rawType === "directory" ? "directory" : rawType === "file" ? "file" : path.endsWith("/") ? "directory" : "file"
    return {
        path: type === "directory" ? path.replace(/\/+$/, "") : path,
        type,
    }
}

export function sortEntries(entries: FileEntry[]): FileEntry[] {
    return [...entries].sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1
        return a.path.localeCompare(b.path, undefined, { sensitivity: "base", numeric: true })
    })
}

export async function listDirectory(url: string, token: string, path?: string): Promise<FileEntry[]> {
    try {
        const query = `?path=${encodeURIComponent(path || ".")}`
        const res = await fetch(`${url}/file${query}`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token),
            },
        })
        if (!res.ok) throw new Error(`Failed to list directory (${res.status})`)
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error("Unexpected directory listing response")
        const entries = data.map(normalizeFileEntry).filter((entry): entry is FileEntry => entry !== null)
        return sortEntries(entries)
    } catch (err) {
        throw err instanceof Error ? err : new Error("Failed to list directory")
    }
}

export async function readFileContent(url: string, token: string, path: string): Promise<string> {
    const res = await fetch(`${url}/file/content?path=${encodeURIComponent(path)}`, {
        method: "GET",
        headers: {
            "Authorization": getAuthHeader(token),
        },
    })
    if (!res.ok) throw new Error(`Failed to read file (${res.status})`)
    const text = await res.text()
    return text.length > MAX_CONTENT_BYTES ? text.slice(0, MAX_CONTENT_BYTES) : text
}

export async function searchFiles(url: string, token: string, query: string): Promise<string[]> {
    try {
        const res = await fetch(`${url}/find/file?query=${encodeURIComponent(query)}`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token),
            },
        })
        if (!res.ok) return []
        const data = await res.json()
        if (!Array.isArray(data)) return []
        return data.filter((item): item is string => typeof item === "string")
    } catch {
        return []
    }
}

export async function fetchFileStatuses(url: string, token: string): Promise<FileStatuses> {
    try {
        const res = await fetch(`${url}/file/status`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token),
            },
        })
        if (!res.ok) return {}
        const data = await res.json()
        if (!data || typeof data !== "object") return {}

        const records: Array<[string, unknown]> = Array.isArray(data)
            ? data.filter((item) => item && typeof item === "object" && typeof (item as Record<string, unknown>).path === "string")
                  .map((item) => [(item as Record<string, unknown>).path as string, item])
            : Object.entries(data as Record<string, unknown>)

        const result: FileStatuses = {}
        for (const [key, value] of records) {
            let status: unknown = value
            if (value && typeof value === "object") {
                status = (value as Record<string, unknown>).status
            }
            if (status === "added" || status === "modified" || status === "deleted") {
                result[key] = status
            }
        }
        return result
    } catch {
        return {}
    }
}

const BINARY_EXTENSIONS = new Set([
    "png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "icns", "tiff",
    "pdf", "zip", "tar", "gz", "bz2", "xz", "7z", "rar",
    "exe", "dll", "so", "dylib", "a", "o", "obj",
    "woff", "woff2", "ttf", "otf", "eot",
    "mp3", "mp4", "avi", "mov", "mkv", "wav", "flac", "ogg", "webm",
    "db", "sqlite", "sqlite3", "class", "jar", "wasm", "bin", "dat", "lock-asset",
])

const EXTENSION_LANGUAGES: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx", mjs: "javascript", cjs: "javascript",
    json: "json", jsonc: "json", py: "python", rb: "ruby", go: "go", rs: "rust",
    java: "java", kt: "kotlin", swift: "swift", dart: "dart", php: "php", cs: "csharp", c: "c", h: "c",
    cpp: "cpp", cc: "cpp", hpp: "cpp", sh: "bash", bash: "bash", zsh: "bash",
    sql: "sql", css: "css", scss: "css", html: "markup", htm: "markup", xml: "markup", svg: "markup", vue: "markup",
    md: "markdown", mdx: "markdown", yml: "yaml", yaml: "yaml", toml: "ini", ini: "ini", env: "ini",
    diff: "diff", patch: "diff", graphql: "graphql", gql: "graphql", prisma: "graphql",
}

export function languageFromPath(path: string): string {
    const name = path.split("/").pop() ?? path
    if (name.toLowerCase() === "dockerfile") return normalizeLanguage("docker")
    if (name.toLowerCase().startsWith("makefile")) return normalizeLanguage("makefile")
    const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : ""
    if (!ext) return "text"
    return normalizeLanguage(EXTENSION_LANGUAGES[ext] ?? ext)
}

export function isBinaryPath(path: string): boolean {
    const name = path.split("/").pop() ?? path
    const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : ""
    return BINARY_EXTENSIONS.has(ext)
}

export type BreadcrumbSegment = {
    name: string
    path: string | null
}

export function buildBreadcrumbs(path: string, rootLabel = "root"): BreadcrumbSegment[] {
    const segments: BreadcrumbSegment[] = [{ name: rootLabel, path: "" }]
    const parts = path.split("/").filter(Boolean)
    let current = ""
    for (const part of parts) {
        current = current ? `${current}/${part}` : part
        segments.push({ name: part, path: current })
    }
    return segments
}
