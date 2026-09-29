import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ServerVersion } from "@/lib/server-version"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const authCache = new Map<string, string>()

export function getAuthHeader(token: string): string {
    let cached = authCache.get(token)
    if (!cached) {
        cached = `Basic ${btoa(`opencode:${token}`)}`
        authCache.set(token, cached)
    }
    return cached
}

// v2 moved the API under /api/*; v1 serves routes from the root.
export function apiUrl(url: string, version: ServerVersion, path: string): string {
    const base = url.replace(/\/+$/, "")
    const clean = path.startsWith("/") ? path : `/${path}`
    return version >= 2 ? `${base}/api${clean}` : `${base}${clean}`
}

// v2 wraps most payloads in a { data } (sometimes { location, data })
// envelope; v1 returns bare values. Accepts both.
export function unwrapData<T>(json: unknown): T {
    if (json && typeof json === "object" && !Array.isArray(json) && "data" in (json as Record<string, unknown>)) {
        return (json as Record<string, unknown>).data as T
    }
    return json as T
}

export function unwrapList<T>(json: unknown): T[] {
    const data = unwrapData<unknown>(json)
    return Array.isArray(data) ? (data as T[]) : []
}

export function formatDirectory(path: string | undefined | null): string {
    if (!path) return ""
    const cleaned = path.replace(/\/+$/, '')
    const parts = cleaned.split('/').filter(Boolean)
    if (parts.length <= 1) return parts[0] ?? path

    const homeIdx = parts.indexOf('home')
    if (homeIdx === 0 && parts.length > homeIdx + 2) {
        return ['~', ...parts.slice(homeIdx + 2)].join('/')
    }

    if (parts.length > 3) {
        return '⋯/' + parts.slice(-2).join('/')
    }

    return parts.join('/')
}
