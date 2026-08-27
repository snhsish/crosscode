import { useEffect, useRef } from "react"
import { useChatStore } from "@/store/chat.store"
import { useMessages, AssistantMessage, Message, Part } from "@/store/messages.store"
import { usePermissions, PermissionRequest } from "@/store/permissions.store"
import { useOpencodeStats } from "@/store/opencode-stats.store"
import { useProjects } from "@/store/projects.store"
import { getAuthHeader } from "@/lib/utils"
import { notifyAgentStatus } from "@/lib/notifications"

type SSEEvent = {
    type: string
    properties: Record<string, unknown>
}

type MessagePart = Part & {
    sessionID?: string
    messageID?: string
}

export function useGlobalSessionStatus(url?: string, token?: string) {
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        if (!url || !token) return

        const baseUrl = url.replace(/\/+$/, "")
        const authHeader = getAuthHeader(token)
        const eventUrl = `${baseUrl}/mobile-event`
        const setStreaming = useChatStore.getState().setStreaming

        const abort = new AbortController()
        abortRef.current = abort
        let buffer = ""
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null
        let reconnectAttempts = 0
        const maxReconnectAttempts = 10
        const reconnectDelays = [3000, 5000, 10000, 15000, 20000, 30000, 45000, 60000, 90000, 120000]

        function handleEvent(event: SSEEvent) {
            const props = event.properties
            switch (event.type) {
                case "session.status": {
                    const sid = props.sessionID as string | undefined
                    if (!sid) return
                    const status = props.status as { type: string } | undefined
                    if (!status) return
                    if (status.type === "busy") setStreaming(sid, true)
                    else if (status.type === "idle") setStreaming(sid, false)
                    break
                }
                case "session.idle": {
                    const sid = props.sessionID as string | undefined
                    if (sid) setStreaming(sid, false)
                    break
                }
            }
        }

        function scheduleReconnect() {
            if (abort.signal.aborted) return
            if (reconnectAttempts >= maxReconnectAttempts) return
            reconnectAttempts++
            const delay = reconnectDelays[Math.min(reconnectAttempts - 1, reconnectDelays.length - 1)]
            reconnectTimer = setTimeout(() => {
                if (!abort.signal.aborted) connect()
            }, delay)
        }

        async function connect() {
            try {
                const response = await fetch(eventUrl, {
                    method: "POST",
                    headers: {
                        Authorization: authHeader,
                        Accept: "text/event-stream",
                        "Content-Type": "application/json",
                    },
                    signal: abort.signal,
                    body: JSON.stringify({}),
                })
                if (!response.ok) {
                    scheduleReconnect()
                    return
                }
                const reader = response.body?.getReader()
                if (!reader) {
                    scheduleReconnect()
                    return
                }
                reconnectAttempts = 0
                const decoder = new TextDecoder()
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, { stream: true })
                    const events = buffer.split("\n\n")
                    buffer = events.pop() ?? ""
                    for (const eventBlock of events) {
                        if (!eventBlock.trim()) continue
                        let dataLines: string[] = []
                        for (const line of eventBlock.split("\n")) {
                            const trimmed = line.trim()
                            if (trimmed.startsWith("data:")) dataLines.push(trimmed.slice(5).trim())
                        }
                        if (dataLines.length > 0) {
                            const data = dataLines.join("\n")
                            try {
                                const parsed = JSON.parse(data)
                                let sseEvent: SSEEvent
                                if (parsed.payload && parsed.type === undefined) sseEvent = parsed.payload
                                else sseEvent = parsed
                                handleEvent(sseEvent)
                            } catch {}
                        }
                    }
                }
                scheduleReconnect()
            } catch (err) {
                if ((err as Error).name !== "AbortError") scheduleReconnect()
            }
        }

        connect()

        return () => {
            if (reconnectTimer) clearTimeout(reconnectTimer)
            abort.abort()
            abortRef.current = null
        }
    }, [url, token])
}

export function useEventStream(url?: string, sessionId?: string, token?: string, projectId?: string) {
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        if (!url || !sessionId || !token) return

        const baseUrl = url.replace(/\/+$/, "")
        const sid = sessionId
        const tok = token
        const setConnectionStatus = useChatStore.getState().setConnectionStatus
        const setStreaming = useChatStore.getState().setStreaming
        const setActiveMessageId = useChatStore.getState().setActiveMessageId

        const authHeader = getAuthHeader(tok)
        const eventUrl = `${baseUrl}/mobile-event`

        setConnectionStatus("connecting")

        const abort = new AbortController()
        abortRef.current = abort

        let connected = false
        let buffer = ""
        let reconnectAttempts = 0
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null
        const maxReconnectAttempts = 10
        const reconnectDelays = [3000, 5000, 10000, 15000, 20000, 30000, 45000, 60000, 90000, 120000]

        let pendingMessages: Message[] | null = null
        let flushScheduled = false
        const countedMessageIds = new Set<string>()
        let lastCompleted: {
            messageId: string
            sessionId: string
            hasError: boolean
            errorMessage: string
        } | null = null

        function scheduleFlush() {
            if (flushScheduled) return
            flushScheduled = true
            requestAnimationFrame(() => {
                flushScheduled = false
                if (pendingMessages !== null) {
                    useMessages.getState().setMessages(sid, pendingMessages)
                    pendingMessages = null
                }
            })
        }

        function getOrCreatePending(): Message[] {
            if (pendingMessages !== null) return pendingMessages
            pendingMessages = [...useMessages.getState().getMessagesBySession(sid)]
            return pendingMessages
        }

        function handleEvent(event: SSEEvent, currentSessionId: string) {
            const props = event.properties

            switch (event.type) {
                case "server.connected":
                case "server.heartbeat":
                    break

                case "message.updated": {
                    const info = props.info as Message | undefined
                    if (!info || info.sessionID !== currentSessionId) return

                    const existing = getOrCreatePending()
                    const existingIdx = existing.findIndex(m => m.id === info.id)
                    const previous = existingIdx >= 0 ? existing[existingIdx] : undefined

                    if (existingIdx >= 0) {
                        const existingMsg = existing[existingIdx]
                        existing[existingIdx] = { ...info, parts: existingMsg.parts } as Message
                    } else {
                        existing.push({ ...info, parts: [] } as Message)
                    }

                    if (info.role === "user") {
                        for (let i = 0; i < existing.length; i++) {
                            if (existing[i].id.startsWith("local-") && existing[i].role === "user") {
                                existing.splice(i, 1)
                                break
                            }
                        }
                    }

                    scheduleFlush()

                    if (info.role === "assistant") {
                        setActiveMessageId(currentSessionId, info.id)
                        if (!info.time?.completed) {
                            setStreaming(currentSessionId, true)
                        } else {
                            const errorMessage = info.error
                                ? "data" in info.error && typeof info.error.data?.message === "string"
                                    ? info.error.data.message
                                    : "The agent stopped because it hit an error."
                                : ""
                            lastCompleted = {
                                messageId: info.id,
                                sessionId: currentSessionId,
                                hasError: !!info.error,
                                errorMessage,
                            }

                            if (!info.error && projectId && !countedMessageIds.has(info.id)) {
                                countedMessageIds.add(info.id)
                                const assistant = info as AssistantMessage
                                const projectName =
                                    useProjects.getState().projects.find((p) => p.id === projectId)?.name ??
                                    "Unknown project"
                                useOpencodeStats.getState().incrementProjectStats(
                                    projectId,
                                    projectName,
                                    assistant.tokens?.input ?? 0,
                                    assistant.tokens?.output ?? 0,
                                    assistant.cost ?? 0
                                )
                            }
                        }
                    }
                    break
                }

                case "message.part.updated":
                case "message.part.delta": {
                    const part = props.part as MessagePart | undefined
                    if (!part || !part.messageID || part.sessionID !== currentSessionId) return

                    const isDelta = event.type === "message.part.delta"
                    const delta = props.delta as string | undefined

                    const existing = getOrCreatePending()
                    const msgIdx = existing.findIndex(m => m.id === part.messageID)

                    if (msgIdx < 0) return

                    const msg = existing[msgIdx]
                    const parts = msg.parts ?? []
                    const partIdx = parts.findIndex(p => p.id === part.id)

                    let newParts: Part[]
                    if (partIdx >= 0) {
                        newParts = [...parts]
                        const existingPart = newParts[partIdx]

                        if (isDelta && delta) {
                            if (part.type === "text" && existingPart.type === "text") {
                                newParts[partIdx] = { ...existingPart, text: existingPart.text + delta }
                            } else if (part.type === "reasoning" && existingPart.type === "reasoning") {
                                newParts[partIdx] = { ...existingPart, text: existingPart.text + delta }
                            }
                        } else {
                            newParts[partIdx] = part as Part
                        }
                    } else {
                        newParts = [...parts, part as Part]
                    }

                    existing[msgIdx] = { ...msg, parts: newParts } as Message
                    scheduleFlush()
                    break
                }

                case "message.part.removed": {
                    const partId = props.partID as string | undefined
                    const messageId = props.messageID as string | undefined
                    if (!partId || !messageId || props.sessionID !== currentSessionId) return

                    const existing = getOrCreatePending()
                    const msgIdx = existing.findIndex(m => m.id === messageId)

                    if (msgIdx < 0) return

                    const msg = existing[msgIdx]
                    const parts = (msg.parts ?? []).filter(p => p.id !== partId)

                    existing[msgIdx] = { ...msg, parts } as Message
                    scheduleFlush()
                    break
                }

                case "message.removed": {
                    const messageId = props.messageID as string | undefined
                    if (!messageId || props.sessionID !== currentSessionId) return

                    const existing = getOrCreatePending()
                    for (let i = existing.length - 1; i >= 0; i--) {
                        if (existing[i].id === messageId) {
                            existing.splice(i, 1)
                            break
                        }
                    }
                    scheduleFlush()
                    break
                }

                case "session.status": {
                    if (props.sessionID !== currentSessionId) return
                    const status = props.status as { type: string } | undefined
                    if (!status) return

                    if (status.type === "busy") {
                        setStreaming(currentSessionId, true)
                    } else if (status.type === "idle") {
                        setStreaming(currentSessionId, false)
                        setActiveMessageId(currentSessionId, null)

                        if (lastCompleted && lastCompleted.sessionId === currentSessionId) {
                            const { messageId, sessionId: sid, hasError, errorMessage: errMsg } = lastCompleted
                            lastCompleted = null

                            if (hasError) {
                                notifyAgentStatus({
                                    key: `${sid}:error:${messageId}`,
                                    kind: "error",
                                    title: "Agent response failed",
                                    message: errMsg,
                                    projectId,
                                    sessionId: sid,
                                })
                            } else {
                                notifyAgentStatus({
                                    key: `${sid}:completion:${messageId}`,
                                    kind: "completion",
                                    title: "Agent response completed",
                                    message: "The agent finished responding.",
                                    projectId,
                                    sessionId: sid,
                                })
                            }
                        }
                    }
                    break
                }

                case "session.idle": {
                    if (props.sessionID !== currentSessionId) return
                    setStreaming(currentSessionId, false)
                    setActiveMessageId(currentSessionId, null)

                    if (lastCompleted && lastCompleted.sessionId === currentSessionId) {
                        const { messageId, sessionId: sid, hasError, errorMessage: errMsg } = lastCompleted
                        lastCompleted = null

                        if (hasError) {
                            notifyAgentStatus({
                                key: `${sid}:error:${messageId}`,
                                kind: "error",
                                title: "Agent response failed",
                                message: errMsg,
                                projectId,
                                sessionId: sid,
                            })
                        } else {
                            notifyAgentStatus({
                                key: `${sid}:completion:${messageId}`,
                                kind: "completion",
                                title: "Agent response completed",
                                message: "The agent finished responding.",
                                projectId,
                                sessionId: sid,
                            })
                        }
                    }
                    break
                }

                case "permission.asked": {
                    const perm = props as unknown as PermissionRequest
                    if (!perm || perm.sessionID !== currentSessionId) return
                    const current = usePermissions.getState().permissionsBySession[currentSessionId] ?? []
                    if (!current.some((p) => p.id === perm.id)) {
                        usePermissions.getState().setPermissions(currentSessionId, [...current, perm])
                        notifyAgentStatus({
                            key: `${currentSessionId}:permission:${perm.id}`,
                            kind: "permission",
                            title: "Agent needs permission",
                            message: perm.permission || "Review the pending permission request.",
                            projectId,
                            sessionId: currentSessionId,
                        })
                    }
                    break
                }

                case "permission.replied": {
                    const requestID = props.requestID as string | undefined
                    if (!requestID || props.sessionID !== currentSessionId) return
                    usePermissions.getState().removePermission(currentSessionId, requestID)
                    break
                }
            }
        }

        function scheduleReconnect() {
            if (abort.signal.aborted) return
            if (reconnectAttempts >= maxReconnectAttempts) {
                setConnectionStatus("error")
                return
            }

            reconnectAttempts++
            const delay = reconnectDelays[Math.min(reconnectAttempts - 1, reconnectDelays.length - 1)]

            if (reconnectAttempts <= 2) {
                setConnectionStatus("reconnecting")
            } else {
                setConnectionStatus("connectivity-issues")
            }

            reconnectTimer = setTimeout(() => {
                if (!abort.signal.aborted) {
                    connect()
                }
            }, delay)
        }

        async function connect() {
            try {
                const response = await fetch(eventUrl, {
                    method: "POST",
                    headers: {
                        Authorization: authHeader,
                        Accept: "text/event-stream",
                        "Content-Type": "application/json",
                    },
                    signal: abort.signal,
                    body: JSON.stringify({}),
                })

                if (!response.ok) {
                    setConnectionStatus("error")
                    scheduleReconnect()
                    return
                }

                const reader = response.body?.getReader()
                if (!reader) {
                    setConnectionStatus("error")
                    scheduleReconnect()
                    return
                }

                reconnectAttempts = 0
                const decoder = new TextDecoder()

                while (true) {
                    const { done, value } = await reader.read()

                    if (done) break

                    if (!connected) {
                        connected = true
                        setConnectionStatus("connected")
                    }

                    buffer += decoder.decode(value, { stream: true })

                    const events = buffer.split("\n\n")
                    buffer = events.pop() ?? ""

                    for (const eventBlock of events) {
                        if (!eventBlock.trim()) continue

                        let dataLines: string[] = []

                        const lines = eventBlock.split("\n")
                        for (const line of lines) {
                            const trimmed = line.trim()

                            if (trimmed.startsWith("data:")) {
                                dataLines.push(trimmed.slice(5).trim())
                            }
                        }

                        if (dataLines.length > 0) {
                            const data = dataLines.join("\n")

                            try {
                                const parsed = JSON.parse(data)
                                let sseEvent: SSEEvent

                                if (parsed.payload && parsed.type === undefined) {
                                    sseEvent = parsed.payload
                                } else {
                                    sseEvent = parsed
                                }

                                handleEvent(sseEvent, sid)
                            } catch {
                                // Parse error - skip malformed event
                            }
                        }
                    }
                }

                scheduleReconnect()
            } catch (err) {
                if ((err as Error).name === "AbortError") {
                    // Expected on cleanup
                } else {
                    setConnectionStatus("error")
                    scheduleReconnect()
                }
            }
        }

        connect()

        return () => {
            if (reconnectTimer) clearTimeout(reconnectTimer)
            if (pendingMessages !== null) {
                useMessages.getState().setMessages(sid, pendingMessages)
            }
            abort.abort()
            abortRef.current = null
            setConnectionStatus("disconnected")
            setStreaming(sid, false)
            setActiveMessageId(sid, null)
        }
    }, [sessionId, url, token, projectId])
}
