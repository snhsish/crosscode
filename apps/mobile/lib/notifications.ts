import { useEffect } from "react"
import { Platform } from "react-native"
import Constants from "expo-constants"
import * as Notifications from "expo-notifications"
import { useRouter } from "expo-router"
import { useNotifications, NotificationType } from "@/store/notifications.store"
import { useSettings } from "@/store/settings.store"

export type AgentNotificationKind = "completion" | "question" | "permission" | "error"

type AgentNotificationInput = {
    key: string
    kind: AgentNotificationKind
    title: string
    message: string
    projectId?: string
    sessionId?: string
}

const CHANNEL_ID = "agent-status"

let configured = false
const deliveredKeys = new Set<string>()

const typeByKind: Record<AgentNotificationKind, NotificationType> = {
    completion: "success",
    question: "warning",
    permission: "warning",
    error: "error",
}

export function configureNotifications() {
    if (configured) return
    configured = true

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    })
}

export async function requestNotificationsPermission(): Promise<boolean> {
    configureNotifications()

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: "Agent status",
            importance: Notifications.AndroidImportance.DEFAULT,
        })
    }

    const current = await Notifications.getPermissionsAsync()
    if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
        return true
    }

    const requested = await Notifications.requestPermissionsAsync()
    return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
}

export async function notifyAgentStatus(input: AgentNotificationInput) {
    if (!useSettings.getState().notifications) return

    const existing = useNotifications
        .getState()
        .notifications.some((notification) => notification.data?.notificationKey === input.key)
    if (deliveredKeys.has(input.key) || existing) return
    deliveredKeys.add(input.key)

    useNotifications.getState().addNotification({
        title: input.title,
        message: input.message,
        type: typeByKind[input.kind],
        data: {
            notificationKey: input.key,
            kind: input.kind,
            projectId: input.projectId,
            sessionId: input.sessionId,
        },
    })

    const granted = await requestNotificationsPermission()
    if (!granted) return

    await Notifications.scheduleNotificationAsync({
        content: {
            title: input.title,
            body: input.message,
            data: {
                notificationKey: input.key,
                kind: input.kind,
                projectId: input.projectId,
                sessionId: input.sessionId,
            },
            sound: true,
        },
        trigger: null,
    })
}

export function useNotificationRouting() {
    const router = useRouter()

    useEffect(() => {
        configureNotifications()

        const routeFromData = (data: Record<string, unknown> | undefined) => {
            const projectId = typeof data?.projectId === "string" ? data.projectId : undefined
            const sessionId = typeof data?.sessionId === "string" ? data.sessionId : undefined
            if (!projectId || !sessionId) return
            router.push(`/project/${projectId}/${sessionId}` as any)
        }

        Notifications.getLastNotificationResponseAsync().then((response) => {
            routeFromData(response?.notification.request.content.data)
        })

        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            routeFromData(response.notification.request.content.data)
        })

        return () => sub.remove()
    }, [router])
}

export async function getExpoPushToken(): Promise<string | null> {
    try {
        const granted = await requestNotificationsPermission()
        if (!granted) return null

        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId

        const token = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
        )
        return token.data
    } catch {
        // Push notifications are optional and may be unavailable without native credentials.
        return null
    }
}
