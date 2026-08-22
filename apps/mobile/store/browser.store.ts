import { create } from "zustand"
import { FileEntry, FileStatusKind } from "@/lib/file-browser"

type CachedListing = {
    entries: FileEntry[]
    fetchedAt: number
}

type CachedStatuses = {
    statuses: Record<string, FileStatusKind>
    fetchedAt: number
}

const TTL_MS = 30_000

export function browserCacheKey(url: string, projectId: string): string {
    return `${url}::${projectId}`
}

type BrowserStore = {
    listingsByKey: Record<string, Record<string, CachedListing>>
    statusesByKey: Record<string, CachedStatuses>
}

export const useBrowserStore = create<BrowserStore>(() => ({
    listingsByKey: {},
    statusesByKey: {},
}))

function getListings(url: string, projectId: string): Record<string, CachedListing> {
    return useBrowserStore.getState().listingsByKey[browserCacheKey(url, projectId)] ?? {}
}

export function cachedEntries(url: string, projectId: string, path: string): FileEntry[] | null {
    const listing = getListings(url, projectId)[path]
    if (!listing || Date.now() - listing.fetchedAt > TTL_MS) return null
    return listing.entries
}

export function setCachedEntries(url: string, projectId: string, path: string, entries: FileEntry[]) {
    const key = browserCacheKey(url, projectId)
    useBrowserStore.setState((state) => ({
        listingsByKey: {
            ...state.listingsByKey,
            [key]: { ...(state.listingsByKey[key] ?? {}), [path]: { entries, fetchedAt: Date.now() } },
        },
    }))
}

export function invalidatePath(url: string, projectId: string, path: string) {
    const key = browserCacheKey(url, projectId)
    const projectListings = useBrowserStore.getState().listingsByKey[key]
    if (!projectListings?.[path]) return
    const next = { ...projectListings }
    delete next[path]
    useBrowserStore.setState((state) => ({
        listingsByKey: { ...state.listingsByKey, [key]: next },
    }))
}

export function clearProjectCache(url: string, projectId: string) {
    const key = browserCacheKey(url, projectId)
    useBrowserStore.setState((state) => {
        const nextListings = { ...state.listingsByKey }
        delete nextListings[key]
        const nextStatuses = { ...state.statusesByKey }
        delete nextStatuses[key]
        return { listingsByKey: nextListings, statusesByKey: nextStatuses }
    })
}

export function cachedStatuses(url: string, projectId: string): Record<string, FileStatusKind> | null {
    const entry = useBrowserStore.getState().statusesByKey[browserCacheKey(url, projectId)]
    if (!entry || Date.now() - entry.fetchedAt > TTL_MS) return null
    return entry.statuses
}

export function setCachedStatuses(url: string, projectId: string, statuses: Record<string, FileStatusKind>) {
    useBrowserStore.setState((state) => ({
        statusesByKey: {
            ...state.statusesByKey,
            [browserCacheKey(url, projectId)]: { statuses, fetchedAt: Date.now() },
        },
    }))
}
