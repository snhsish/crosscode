import { create } from "zustand"

export type DiffData = {
    filePath: string
    oldString: string
    newString: string
}

type DiffStore = {
    currentDiff: DiffData | null
    setDiff: (diff: DiffData) => void
    clearDiff: () => void
}

export const useDiffStore = create<DiffStore>((set) => ({
    currentDiff: null,
    setDiff: (diff) => set({ currentDiff: diff }),
    clearDiff: () => set({ currentDiff: null }),
}))
