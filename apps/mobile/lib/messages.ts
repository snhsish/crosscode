import { Message } from "@/store/messages.store"
import { apiUrl, getAuthHeader, unwrapData } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"
import { updateSessionModel } from "@/lib/models"

export const getMessages = async (url: string, token: string, sessionId: string, limit?: number, offset?: number) => {
    try {
        const version = getServerVersion(url)
        const params = new URLSearchParams()
        if (version >= 2) {
            // v2 paginates with opaque cursors instead of offsets: over-fetch
            // newest-first and slice client-side to emulate limit/offset.
            const pageSize = limit ?? 50
            params.set("limit", String((offset ?? 0) + pageSize))
            params.set("order", "desc")
        } else {
            if (limit) params.set("limit", limit.toString())
            if (offset) params.set("offset", offset.toString())
        }

        const queryString = params.toString()
        const res = await fetch(`${apiUrl(url, version, "/session")}/${sessionId}/message${queryString ? `?${queryString}` : ""}`, {
            method: "GET",
            headers: {
                "Authorization": getAuthHeader(token)
            }
        })
        if (!res.ok) return
        const data = unwrapData<Message[]>(await res.json())
        if (!data || !Array.isArray(data)) return
        if (version >= 2 && offset) return data.slice(offset)
        return data
    } catch {
        return
    }
}

export type SendResult = {
    ok: boolean
    retryable: boolean
    errorText?: string
    errorName?: string
    status?: number
}

// v2 sends messages via POST /api/session/:id/prompt { text, files }.
// Model and agent are set on the session first (v1 accepted them inline).
export const sendPromptV2 = async (
    url: string,
    token: string,
    sessionId: string,
    opts: {
        text: string
        agent: string
        modelId?: string
        providerId?: string
        parts: Array<Record<string, unknown>>
    },
): Promise<SendResult> => {
    try {
        if (opts.modelId && opts.providerId) {
            await updateSessionModel(url, token, sessionId, { id: opts.modelId, providerID: opts.providerId })
        }
        try {
            await fetch(`${apiUrl(url, 2, "/session")}/${sessionId}/agent`, {
                method: "POST",
                headers: {
                    "Authorization": getAuthHeader(token),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ agent: opts.agent }),
            })
        } catch {}

        const texts = opts.parts
            .filter((p) => p.type === "text" && typeof p.text === "string")
            .map((p) => p.text as string)
        const files = opts.parts
            .filter((p) => p.type === "file" && typeof p.url === "string")
            .map((p) => ({
                uri: p.url as string,
                name: typeof p.filename === "string" ? (p.filename as string) : "file",
            }))

        const res = await fetch(`${apiUrl(url, 2, "/session")}/${sessionId}/prompt`, {
            method: "POST",
            headers: {
                "Authorization": getAuthHeader(token),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: texts.join("\n\n"), files }),
        })

        if (!res.ok) {
            let errorText = `${res.status} ${res.statusText}`
            let errorName = "UnknownError"
            try {
                const errorBody = await res.json()
                if (errorBody.error) {
                    errorText = errorBody.error
                    errorName = errorBody.name || errorBody._tag || "UnknownError"
                } else if (errorBody.message) {
                    errorText = errorBody.message
                    errorName = errorBody.name || errorBody._tag || "UnknownError"
                }
            } catch {}

            const retryable = res.status >= 500 || errorName === "APIError"
            return { ok: false, retryable, errorText, errorName, status: res.status }
        }

        return { ok: true, retryable: false }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to send message"
        return { ok: false, retryable: true, errorText: message, errorName: "NetworkError" }
    }
}
