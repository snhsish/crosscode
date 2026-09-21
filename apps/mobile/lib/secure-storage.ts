import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"

const availability: Promise<boolean> = SecureStore.isAvailableAsync().catch(() => false)

export const secureStorage = {
    getItem: async (name: string): Promise<string | null> => {
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
        return await AsyncStorage.getItem(name)
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (await availability) {
            await SecureStore.setItemAsync(name, value)
            await AsyncStorage.removeItem(name).catch(() => undefined)
            return
        }
        await AsyncStorage.setItem(name, value)
    },
    removeItem: async (name: string): Promise<void> => {
        if (await availability) {
            await SecureStore.deleteItemAsync(name).catch(() => undefined)
        }
        await AsyncStorage.removeItem(name).catch(() => undefined)
    },
}
