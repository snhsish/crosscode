import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"

const availability: Promise<boolean> = SecureStore.isAvailableAsync().catch(() => false)

export const secureStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            if (await availability) {
                const value = await SecureStore.getItemAsync(name)
                if (value !== null) return value
                const legacy = await AsyncStorage.getItem(name)
                if (legacy !== null) {
                    await SecureStore.setItemAsync(name, legacy).catch(() => undefined)
                    await AsyncStorage.removeItem(name).catch(() => undefined)
                }
                return legacy
            }
        } catch {
            // Fall through to AsyncStorage so a corrupt/locked keystore
            // never bricks the app. Secrets may be less protected here.
        }
        return await AsyncStorage.getItem(name).catch(() => null)
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            if (await availability) {
                await SecureStore.setItemAsync(name, value)
                await AsyncStorage.removeItem(name).catch(() => undefined)
                return
            }
        } catch {
            // SecureStore throws (e.g. value > ~2KB on some devices).
            // Fall back to AsyncStorage instead of silently losing data.
        }
        await AsyncStorage.setItem(name, value).catch(() => undefined)
    },
    removeItem: async (name: string): Promise<void> => {
        try {
            if (await availability) {
                await SecureStore.deleteItemAsync(name).catch(() => undefined)
            }
        } catch {
            // ignore keystore errors, still clear the fallback below
        }
        await AsyncStorage.removeItem(name).catch(() => undefined)
    },
}
