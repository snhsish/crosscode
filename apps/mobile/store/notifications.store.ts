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
    unreadCount: number
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
            unreadCount: 0,

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
                    unreadCount: state.unreadCount + 1,
                })),

            markAsRead: (id) =>
                set((state) => {
                    const notification = state.notifications.find((n) => n.id === id)
                    if (!notification || notification.read) return state
                    return {
                        notifications: state.notifications.map((n) =>
                            n.id === id ? { ...n, read: true } : n
                        ),
                        unreadCount: state.unreadCount - 1,
                    }
                }),

            markAllAsRead: () =>
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                    unreadCount: 0,
                })),

            removeNotification: (id) =>
                set((state) => {
                    const notification = state.notifications.find((n) => n.id === id)
                    return {
                        notifications: state.notifications.filter((n) => n.id !== id),
                        unreadCount: notification && !notification.read ? state.unreadCount - 1 : state.unreadCount,
                    }
                }),

            clearAll: () => set({ notifications: [], unreadCount: 0 }),

            getUnreadCount: () => get().unreadCount,
        }),
        {
            name: "crosscode-notifications",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
