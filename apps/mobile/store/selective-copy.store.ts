import { create } from "zustand"

type SelectiveCopyStore = {
    text: string
    setText: (text: string) => void
    clear: () => void
}

export const useSelectiveCopy = create<SelectiveCopyStore>()((set) => ({
    text: "",
    setText: (text) => set({ text }),
    clear: () => set({ text: "" }),
}))
