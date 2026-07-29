import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type User = {
    id: string
    email: string
    name: string
    tier: string
    image?: string
}

type AuthStore = {
    user: User | null
    sessionToken: string | null
    isLoggedIn: boolean
    login: (user: User, sessionToken: string) => void
    logout: () => void
    setUser: (user: User) => void
}

export const useAuth = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            sessionToken: null,
            isLoggedIn: false,
            login: (user, sessionToken) => set({ user, sessionToken, isLoggedIn: true }),
            logout: () => set({ user: null, sessionToken: null, isLoggedIn: false }),
            setUser: (user) => set({ user }),
        }),
        {
            name: "crosscode-auth",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
