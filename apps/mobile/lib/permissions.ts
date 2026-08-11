import { PermissionRequest } from "@/store/permissions.store"
import { getAuthHeader } from "@/lib/utils"

export const getPendingPermissions = async (
    url: string,
    token: string
): Promise<PermissionRequest[]> => {
    try {
        const res = await fetch(`${url}/permission`, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(token),
            },
        })
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

export const replyToPermission = async (
    url: string,
    token: string,
    requestId: string,
    reply: "once" | "always" | "reject",
    message?: string
): Promise<boolean> => {
    try {
        const body: Record<string, unknown> = { reply }
        if (message) body.message = message
        const res = await fetch(`${url}/permission/${requestId}/reply`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(token),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
        return res.ok
    } catch {
        return false
    }
}
