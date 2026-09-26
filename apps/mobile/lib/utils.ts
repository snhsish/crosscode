import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const authCache = new Map<string, string>()
const AUTH_CACHE_LIMIT = 10

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

function toBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let out = ""
  for (let i = 0; i < bytes.length; i += 3) {
    const b = ((bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)) >>> 0
    out += B64_CHARS[(b >>> 18) & 63] + B64_CHARS[(b >>> 12) & 63] + B64_CHARS[(b >>> 6) & 63] + B64_CHARS[b & 63]
  }
  const pad = bytes.length % 3
  if (pad === 1) return out.slice(0, -2) + "=="
  if (pad === 2) return out.slice(0, -1) + "="
  return out
}

export function getAuthHeader(token: string): string {
    let cached = authCache.get(token)
    if (!cached) {
        cached = `Basic ${toBase64Utf8(`opencode:${token}`)}`
        if (authCache.size >= AUTH_CACHE_LIMIT) {
            const oldest = authCache.keys().next().value
            if (oldest !== undefined) authCache.delete(oldest)
        }
        authCache.set(token, cached)
    }
    return cached
}

export function clearAuthCache(token?: string): void {
    if (token) {
        authCache.delete(token)
        return
    }
    authCache.clear()
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
