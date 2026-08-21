import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type SettingsStore = {
    clearLastRemoteUrlOnClose: boolean
    notifications: boolean
    emailForUpdates: string
    hasCompletedOnboarding: boolean
    allowTerminal: boolean
    setClearLastRemoteUrlOnClose: (value: boolean) => void
    setNotifications: (value: boolean) => void
    setEmailForUpdates: (email: string) => void
    setAllowTerminal: (value: boolean) => void
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
            allowTerminal: false,
            setClearLastRemoteUrlOnClose: (value) => set({ clearLastRemoteUrlOnClose: value }),
            setNotifications: (value) => set({ notifications: value }),
            setEmailForUpdates: (email) => set({ emailForUpdates: email }),
            setAllowTerminal: (value) => set({ allowTerminal: value }),
            completeOnboarding: () => set({ hasCompletedOnboarding: true }),
            resetOnboarding: () => set({ hasCompletedOnboarding: false }),
        }),
        {
            name: "crosscode-settings",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)
