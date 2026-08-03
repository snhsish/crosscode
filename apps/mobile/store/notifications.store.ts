import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type NotificationType = "info" | "success" | "warning" | "error"

export type Notification = {
    id: string
    title: string
    message: string
    type: NotificationType
    timestamp: number
    read: boolean
    data?: Record<string, unknown>
}

type NotificationStore = {
    notifications: Notification[]
    addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    removeNotification: (id: string) => void
    clearAll: () => void
    getUnreadCount: () => number
}

export const useNotifications = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: [],

            addNotification: (notification) =>
                set((state) => ({
                    notifications: [
                        {
                            ...notification,
                            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            timestamp: Date.now(),
                            read: false,
                        },
                        ...state.notifications,
                    ],
                })),

            markAsRead: (id) =>
                set((state) => {
                    const notification = state.notifications.find((n) => n.id === id)
                    if (!notification || notification.read) return state
                    return {
                        notifications: state.notifications.map((n) =>
                            n.id === id ? { ...n, read: true } : n
                        ),
                    }
                }),

            markAllAsRead: () =>
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                })),

            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                })),

            clearAll: () => set({ notifications: [] }),

            getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
        }),
        {
            name: "crosscode-notifications",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
