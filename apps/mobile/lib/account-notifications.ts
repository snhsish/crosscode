import { Platform } from "react-native"
import { getExpoPushToken } from "@/lib/notifications"

export type AccountNotificationSettings = {
    agentResponseCompleted: boolean
    agentQuestionInterruption: boolean
    agentPermissionInterruption: boolean
    agentErrorInterruption: boolean
}

export async function getAccountNotificationSettings(
    serverUrl: string,
    sessionToken: string
): Promise<AccountNotificationSettings | null> {
    try {
        const res = await fetch(`${serverUrl}/api/account/settings/notifications`, {
            headers: { Authorization: `Bearer ${sessionToken}` },
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

export async function updateAccountNotificationSettings(
    serverUrl: string,
    sessionToken: string,
    enabled: boolean
): Promise<boolean> {
    try {
        const res = await fetch(`${serverUrl}/api/account/settings/notifications`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${sessionToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                agentResponseCompleted: enabled,
                agentQuestionInterruption: enabled,
                agentPermissionInterruption: enabled,
                agentErrorInterruption: enabled,
            }),
        })
        return res.ok
    } catch {
        return false
    }
}

export async function registerPushDevice(serverUrl: string, sessionToken: string): Promise<boolean> {
    const expoPushToken = await getExpoPushToken()
    if (!expoPushToken) return false

    try {
        const res = await fetch(`${serverUrl}/api/account/push-devices`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${sessionToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                expoPushToken,
                platform: Platform.OS,
                deviceName: "Mobile Device",
            }),
        })
        return res.ok
    } catch {
        return false
    }
}
