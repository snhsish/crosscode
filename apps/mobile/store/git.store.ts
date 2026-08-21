import { create } from "zustand"
import { GitCommit, GitCommitDetail, fetchGitCommit, fetchGitLog } from "@/lib/git"

const PAGE_SIZE = 100

type GitStatus = "idle" | "loading" | "loading-more" | "ready" | "unsupported" | "error"

type GitStore = {
    commits: GitCommit[]
    status: GitStatus
    errorMessage: string | null
    hasMore: boolean
    commitDetail: GitCommitDetail | null
    detailLoading: boolean
    reset: () => void
    loadFirstPage: (url: string, token: string) => Promise<void>
    loadMore: (url: string, token: string) => Promise<void>
    loadCommitDetail: (url: string, token: string, hash: string) => Promise<void>
    clearCommitDetail: () => void
}

export const useGitStore = create<GitStore>()((set, get) => ({
    commits: [],
    status: "idle",
    errorMessage: null,
    hasMore: true,
    commitDetail: null,
    detailLoading: false,

    reset: () =>
        set({
            commits: [],
            status: "idle",
            errorMessage: null,
            hasMore: true,
            commitDetail: null,
            detailLoading: false,
        }),

    loadFirstPage: async (url, token) => {
        set({ status: "loading", errorMessage: null })
        const result = await fetchGitLog(url, token, PAGE_SIZE, 0)
        if (!result.ok) {
            set({
                status: result.reason,
                errorMessage: result.message ?? null,
                commits: [],
                hasMore: false,
            })
            return
        }
        set({
            commits: result.commits,
            status: "ready",
            hasMore: result.commits.length === PAGE_SIZE,
        })
    },

    loadMore: async (url, token) => {
        const { status, commits, hasMore } = get()
        if (status !== "ready" || !hasMore) return
        set({ status: "loading-more" })
        const result = await fetchGitLog(url, token, PAGE_SIZE, commits.length)
        if (!result.ok) {
            set({ status: "ready" })
            return
        }
        const known = new Set(commits.map((c) => c.hash))
        const fresh = result.commits.filter((c) => !known.has(c.hash))
        set({
            commits: [...commits, ...fresh],
            status: "ready",
            hasMore: result.commits.length === PAGE_SIZE && fresh.length > 0,
        })
    },

    loadCommitDetail: async (url, token, hash) => {
        set({ commitDetail: null, detailLoading: true })
        const result = await fetchGitCommit(url, token, hash)
        if (result.ok) {
            set({ commitDetail: result.detail, detailLoading: false })
        } else {
            set({
                commitDetail: {
                    hash,
                    author: "",
                    date: "",
                    subject: "Could not load commit",
                    body: result.message ?? "Failed to fetch commit details",
                    files: [],
                    additions: 0,
                    deletions: 0,
                },
                detailLoading: false,
            })
        }
    },

    clearCommitDetail: () => set({ commitDetail: null, detailLoading: false }),
}))
