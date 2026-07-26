import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type SettingsStore = {
    clearLastRemoteUrlOnClose: boolean
    notifications: boolean
    emailForUpdates: string
    setClearLastRemoteUrlOnClose: (value: boolean) => void
    setNotifications: (value: boolean) => void
    setEmailForUpdates: (email: string) => void
}

export const useSettings = create<SettingsStore>()(
    persist(
        (set) => ({
            clearLastRemoteUrlOnClose: false,
            notifications: true,
            emailForUpdates: "",
            setClearLastRemoteUrlOnClose: (value) => set({ clearLastRemoteUrlOnClose: value }),
            setNotifications: (value) => set({ notifications: value }),
            setEmailForUpdates: (email) => set({ emailForUpdates: email }),
        }),
        {
            name: "crosscode-settings",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)
