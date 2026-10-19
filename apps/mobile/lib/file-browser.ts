import { apiUrl, getAuthHeader, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"
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
    const path =
        typeof entry.path === "string"
            ? entry.path
            : typeof entry.name === "string"
              ? entry.name
              : undefined
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
    const version = getServerVersion(url)
    const dir = path || "."
    // v2 canonical: GET /api/fs/list?path= ; v1: GET /file?path=
    const endpoints =
        version >= 2
            ? [`${apiUrl(url, 2, "/fs/list")}?path=${encodeURIComponent(dir)}`, `${apiUrl(url, 1, "/file")}?path=${encodeURIComponent(dir)}`]
            : [`${apiUrl(url, 1, "/file")}?path=${encodeURIComponent(dir)}`, `${apiUrl(url, 2, "/fs/list")}?path=${encodeURIComponent(dir)}`]
    let lastError: unknown = null
    for (const endpoint of endpoints) {
        try {
            const res = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Authorization": getAuthHeader(token),
                },
            })
            if (!res.ok) {
                lastError = new Error(`Failed to list directory (${res.status})`)
                continue
            }
            const data = await res.json()
            const list = unwrapList<unknown>(data)
            if (!Array.isArray(list)) throw new Error("Unexpected directory listing response")
            const entries = list.map(normalizeFileEntry).filter((entry): entry is FileEntry => entry !== null)
            return sortEntries(entries)
        } catch (err) {
            lastError = err
        }
    }
    throw lastError instanceof Error ? lastError : new Error("Failed to list directory")
}

export async function readFileContent(url: string, token: string, path: string): Promise<string> {
    const version = getServerVersion(url)
    // v2 serves raw bytes at /api/fs/read/*; legacy JSON at /file/content.
    if (version >= 2) {
        try {
            const res = await fetch(`${apiUrl(url, 2, "/fs/read")}/${path.split("/").map(encodeURIComponent).join("/")}`, {
                method: "GET",
                headers: { "Authorization": getAuthHeader(token) },
            })
            if (res.ok) {
                const text = await res.text()
                // The raw endpoint may still return JSON { content } on some builds.
                try {
                    const data = JSON.parse(text) as { content?: unknown; text?: unknown; data?: unknown }
                    if (typeof data.content === "string") return data.content.slice(0, MAX_CONTENT_BYTES)
                    if (typeof data.text === "string") return data.text.slice(0, MAX_CONTENT_BYTES)
                    if (typeof data.data === "string") return data.data.slice(0, MAX_CONTENT_BYTES)
                } catch {
                    // Not JSON, treat as raw text.
                }
                return text.length > MAX_CONTENT_BYTES ? text.slice(0, MAX_CONTENT_BYTES) : text
            }
        } catch {
            // Fall through to the legacy endpoint.
        }
    }
    const res = await fetch(`${apiUrl(url, 1, "/file/content")}?path=${encodeURIComponent(path)}`, {
        method: "GET",
        headers: {
            "Authorization": getAuthHeader(token),
        },
    })
    if (!res.ok) throw new Error(`Failed to read file (${res.status})`)
    const raw = await res.text()
    let text = raw
    try {
        const data = JSON.parse(raw) as { content?: unknown; text?: unknown; data?: unknown }
        if (typeof data.content === "string") text = data.content
        else if (typeof data.text === "string") text = data.text
        else if (typeof data.data === "string") text = data.data
    } catch {
        text = raw
    }
    return text.length > MAX_CONTENT_BYTES ? text.slice(0, MAX_CONTENT_BYTES) : text
}

export async function searchFiles(url: string, token: string, query: string): Promise<string[]> {
    const version = getServerVersion(url)
    const endpoints =
        version >= 2
            ? [`${apiUrl(url, 2, "/fs/find")}?query=${encodeURIComponent(query)}`, `${apiUrl(url, 1, "/find/file")}?query=${encodeURIComponent(query)}`]
            : [`${apiUrl(url, 1, "/find/file")}?query=${encodeURIComponent(query)}`, `${apiUrl(url, 2, "/fs/find")}?query=${encodeURIComponent(query)}`]
    for (const endpoint of endpoints) {
        try {
            const res = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Authorization": getAuthHeader(token),
                },
            })
            if (!res.ok) continue
            const data = await res.json()
            const list = unwrapList<unknown>(data)
            if (!Array.isArray(list)) continue
            // v2 returns Entry objects; v1 returns plain path strings.
            const paths = list
                .map((item) =>
                    typeof item === "string"
                        ? item
                        : item && typeof item === "object" && typeof (item as Record<string, unknown>).path === "string"
                          ? ((item as Record<string, unknown>).path as string)
                          : null
                )
                .filter((item): item is string => typeof item === "string")
            if (paths.length > 0 || version >= 2) return paths
            return paths
        } catch {
            continue
        }
    }
    return []
}

export async function fetchFileStatuses(url: string, token: string): Promise<FileStatuses> {
    try {
        // v2 has no direct file-status route on some builds; try legacy first,
        // then the v2 fs status alias when present.
        const version = getServerVersion(url)
        const endpoints =
            version >= 2
                ? [apiUrl(url, 1, "/file/status"), apiUrl(url, 2, "/fs/status")]
                : [apiUrl(url, 1, "/file/status")]
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    method: "GET",
                    headers: {
                        "Authorization": getAuthHeader(token),
                    },
                })
                if (!res.ok) continue
                const data = await res.json()
                const unwrapped = unwrapList<unknown>(data).length > 0 ? unwrapList<unknown>(data) : data
                if (!unwrapped || typeof unwrapped !== "object") continue

                const records: Array<[string, unknown]> = Array.isArray(unwrapped)
                    ? (unwrapped as unknown[])
                          .filter((item) => item && typeof item === "object" && typeof (item as Record<string, unknown>).path === "string")
                          .map((item) => [(item as Record<string, unknown>).path as string, item])
                    : Object.entries(unwrapped as Record<string, unknown>)

                const result: FileStatuses = {}
                for (const [key, value] of records) {
                    let status: unknown = value
                    if (value && typeof value === "object") {
                        const v = value as Record<string, unknown>
                        status = v.status ?? v.state ?? v.kind
                    }
                    if (status === "added" || status === "modified" || status === "deleted") {
                        result[key] = status
                    }
                }
                return result
            } catch {
                continue
            }
        }
        return {}
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
