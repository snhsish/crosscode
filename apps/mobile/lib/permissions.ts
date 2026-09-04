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

// OpenCode permission shapes (from /doc OpenAPI spec):
//   Permission = { id, type, pattern?: string|string[], sessionID,
//                  messageID, callID?, title, metadata, time }
//   Event permission.updated properties = Permission directly
//   Event permission.replied properties = { sessionID, permissionID, response }
// Legacy shapes (older servers) are also accepted:
//   - id vs requestID vs permissionID
//   - permission vs action vs type
//   - patterns vs resources vs pattern
//   - tool { messageID, callID } vs source { messageID, id } vs
//     top-level messageID/callID
export function normalizePermission(raw: RawPermission, fallbackSessionId?: string): PermissionRequest {
    const id = asString(raw.id) ?? asString(raw.requestID) ?? asString(raw.permissionID) ?? ""
    const sessionID = asString(raw.sessionID) ?? asString(raw.sessionId) ?? fallbackSessionId ?? ""

    const permission =
        asString(raw.type) ??
        asString(raw.permission) ??
        asString(raw.action) ??
        "access"

    const patterns = asStringArray(raw.patterns).length
        ? asStringArray(raw.patterns)
        : asStringArray(raw.resources).length
          ? asStringArray(raw.resources)
          : asStringArray(raw.pattern)

    const always = asStringArray(raw.always).length
        ? asStringArray(raw.always)
        : asStringArray(raw.save)

    const title = asString(raw.title)

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
    if (!tool) {
        const messageID = asString(raw.messageID)
        const callID = asString(raw.callID)
        if (messageID) {
            tool = { messageID, callID: callID ?? "" }
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
        title,
        tool: normalizedTool,
    }
}

export const getPendingPermissions = async (
    _url: string,
    _token: string,
    _sessionId?: string
): Promise<PermissionRequest[]> => {
    // OpenCode exposes no GET /permission list endpoint (see /doc spec) —
    // pending permissions arrive via the `permission.updated` SSE event.
    // Keep this stub so callers don't hit a 404 polling loop.
    return []
}

export const replyToPermission = async (
    url: string,
    token: string,
    requestId: string,
    reply: "once" | "always" | "reject",
    _message?: string,
    sessionId?: string
): Promise<boolean> => {
    // Per /doc spec: POST /session/:id/permissions/:permissionID
    // body: { response: "once" | "always" | "reject" }
    if (!sessionId) return false
    try {
        const res = await fetch(`${url}/session/${sessionId}/permissions/${requestId}`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(token),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ response: reply }),
        })
        return res.ok
    } catch {
        return false
    }
}
