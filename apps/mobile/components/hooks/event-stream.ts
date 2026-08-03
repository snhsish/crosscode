import "fast-text-encoding"
import { useEffect, useRef } from "react"
import { useChatStore } from "@/store/chat.store"
import { useMessages, Message, Part } from "@/store/messages.store"
import { getAuthHeader } from "@/lib/utils"

type SSEEvent = {
    type: string
    properties: Record<string, unknown>
}

type MessagePart = Part & {
    sessionID?: string
    messageID?: string
}

export function useEventStream(url?: string, sessionId?: string, token?: string) {
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

                    if (existingIdx >= 0) {
                        const existingMsg = existing[existingIdx]
                        existing[existingIdx] = { ...info, parts: existingMsg.parts } as Message
                    } else {
                        existing.push({ ...info, parts: [] } as Message)
                    }

                    const localIds = existing.filter(m => m.id.startsWith("local-")).map(m => m.id)
                    if (localIds.length > 0 && info.role === "user") {
                        const hasServerUserMsg = existing.some(m => m.role === "user" && !m.id.startsWith("local-"))
                        if (hasServerUserMsg) {
                            for (let i = existing.length - 1; i >= 0; i--) {
                                if (existing[i].id.startsWith("local-")) {
                                    existing.splice(i, 1)
                                }
                            }
                        }
                    }

                    scheduleFlush()

                    if (info.role === "assistant") {
                        setActiveMessageId(currentSessionId, info.id)
                        if (!info.time?.completed) {
                            setStreaming(currentSessionId, true)
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
                    }
                    break
                }

                case "session.idle": {
                    if (props.sessionID !== currentSessionId) return
                    setStreaming(currentSessionId, false)
                    setActiveMessageId(currentSessionId, null)
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
    }, [sessionId, url, token])
}
