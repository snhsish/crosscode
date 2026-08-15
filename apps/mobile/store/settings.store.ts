import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type SettingsStore = {
    clearLastRemoteUrlOnClose: boolean
    notifications: boolean
    emailForUpdates: string
    hasCompletedOnboarding: boolean
    setClearLastRemoteUrlOnClose: (value: boolean) => void
    setNotifications: (value: boolean) => void
    setEmailForUpdates: (email: string) => void
    completeOnboarding: () => void
    resetOnboarding: () => void
}

export const useSettings = create<SettingsStore>()(
    persist(
        (set) => ({
            clearLastRemoteUrlOnClose: false,
            notifications: true,
            emailForUpdates: "",
            hasCompletedOnboarding: false,
            setClearLastRemoteUrlOnClose: (value) => set({ clearLastRemoteUrlOnClose: value }),
            setNotifications: (value) => set({ notifications: value }),
            setEmailForUpdates: (email) => set({ emailForUpdates: email }),
            completeOnboarding: () => set({ hasCompletedOnboarding: true }),
            resetOnboarding: () => set({ hasCompletedOnboarding: false }),
        }),
        {
            name: "crosscode-settings",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)
