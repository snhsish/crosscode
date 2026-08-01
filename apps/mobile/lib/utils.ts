import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
