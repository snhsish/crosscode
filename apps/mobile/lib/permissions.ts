import { PermissionRequest } from "@/store/permissions.store"
import { getAuthHeader } from "@/lib/utils"

type RawPermission = Record<string, unknown>

function asString(value: unknown): string | undefined {
    if (typeof value === "string" && value.length > 0) return value
    return undefined
}

function asStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .map((v) => (typeof v === "string" ? v : typeof v === "object" && v !== null ? JSON.stringify(v) : undefined))
            .filter((v): v is string => typeof v === "string" && v.length > 0)
    }
    if (typeof value === "string" && value.length > 0) return [value]
    return []
}

// OpenCode returns permission requests with varying shapes across versions:
//   - id vs requestID
//   - permission vs action
//   - patterns vs resources
//   - always vs save
//   - tool { messageID, callID } vs source { type, messageID, id }
// Normalize everything into the mobile PermissionRequest shape so the UI can
// always render and reply to it.
export function normalizePermission(raw: RawPermission, fallbackSessionId?: string): PermissionRequest {
    const id = asString(raw.id) ?? asString(raw.requestID) ?? asString(raw.permissionID) ?? ""
    const sessionID = asString(raw.sessionID) ?? asString(raw.sessionId) ?? fallbackSessionId ?? ""

    const permission =
        asString(raw.permission) ??
        asString(raw.action) ??
        asString(raw.type) ??
        "access"

    const patterns = asStringArray(raw.patterns).length
        ? asStringArray(raw.patterns)
        : asStringArray(raw.resources)

    const always = asStringArray(raw.always).length
        ? asStringArray(raw.always)
        : asStringArray(raw.save)

    const metadata =
        raw.metadata && typeof raw.metadata === "object"
            ? (raw.metadata as Record<string, unknown>)
            : typeof raw.permission === "object" && raw.permission !== null
              ? (raw.permission as Record<string, unknown>)
              : {}

    let tool = raw.tool && typeof raw.tool === "object" ? (raw.tool as Record<string, unknown>) : undefined
    if (!tool && raw.source && typeof raw.source === "object") {
        const source = raw.source as Record<string, unknown>
        tool = {
            messageID: asString(source.messageID) ?? "",
            callID: asString(source.id) ?? asString(source.callID) ?? "",
        }
    }

    const normalizedTool =
        tool && typeof tool.messageID === "string" && typeof tool.callID === "string"
            ? { messageID: tool.messageID, callID: tool.callID }
            : undefined

    return {
        id,
        sessionID,
        permission,
        patterns,
        metadata,
        always,
        tool: normalizedTool,
    }
}

export const getPendingPermissions = async (
    url: string,
    token: string,
    sessionId?: string
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
        const list = Array.isArray(data) ? data : Array.isArray((data as { data?: unknown }).data) ? ((data as { data: unknown[] }).data) : []
        return list
            .filter((p): p is RawPermission => !!p && typeof p === "object")
            .map((p) => normalizePermission(p, sessionId))
    } catch {
        return []
    }
}

export const replyToPermission = async (
    url: string,
    token: string,
    requestId: string,
    reply: "once" | "always" | "reject",
    message?: string,
    sessionId?: string
): Promise<boolean> => {
    const tryReply = async (path: string): Promise<boolean> => {
        try {
            const body: Record<string, unknown> = { reply }
            if (message) body.message = message
            const res = await fetch(`${url}${path}`, {
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

    // OpenCode exposes the reply endpoint in a couple of shapes across versions.
    const candidates = [
        `/permission/${requestId}/reply`,
        sessionId ? `/session/${sessionId}/permission/${requestId}/reply` : null,
    ].filter((c): c is string => !!c)

    for (const path of candidates) {
        if (await tryReply(path)) return true
    }
    return false
}
