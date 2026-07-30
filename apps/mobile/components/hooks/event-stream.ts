import "fast-text-encoding"
import { useEffect, useRef } from "react"
import { useChatStore } from "@/store/chat.store"
import { useMessages, Message, Part } from "@/store/messages.store"

/**
 * SSE Event Stream Hook
 * 
 * Connects to the opencode server via POST /mobile-event endpoint.
 * Uses a CLI proxy to work around Cloudflare tunnel buffering issues.
 * 
 * Architecture:
 * Mobile App → POST /mobile-event → Cloudflare Tunnel → CLI Proxy → GET /event → opencode serve
 * 
 * The CLI proxy (running on localhost) opens a GET connection to opencode's /event endpoint
 * and pipes SSE chunks back through the POST response. POST requests flush in real-time
 * through Cloudflare tunnels, while GET requests get buffered.
 */

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

        const authHeader = `Basic ${btoa(`opencode:${tok}`)}`
        const eventUrl = `${baseUrl}/mobile-event`

        setConnectionStatus("connecting")

        const abort = new AbortController()
        abortRef.current = abort

        let connected = false
        let buffer = ""
        let reconnectAttempts = 0
        const maxReconnectAttempts = 10
        const reconnectDelay = 3000

        function handleEvent(event: SSEEvent, currentSessionId: string) {
            const props = event.properties

            switch (event.type) {
                case "server.connected":
                case "server.heartbeat":
                    break

                case "message.updated": {
                    const info = props.info as Message | undefined
                    if (!info || info.sessionID !== currentSessionId) return

                    const store = useMessages.getState()
                    const existing = store.getMessagesBySession(currentSessionId)
                    const existingIdx = existing.findIndex(m => m.id === info.id)

                    let updated: Message[]
                    if (existingIdx >= 0) {
                        updated = [...existing]
                        const existingMsg = updated[existingIdx]
                        updated[existingIdx] = { ...info, parts: existingMsg.parts } as Message
                    } else {
                        updated = [...existing, { ...info, parts: [] } as Message]
                    }

                    const localIds = updated.filter(m => m.id.startsWith("local-")).map(m => m.id)
                    if (localIds.length > 0 && info.role === "user") {
                        const hasServerUserMsg = updated.some(m => m.role === "user" && !m.id.startsWith("local-"))
                        if (hasServerUserMsg) {
                            updated = updated.filter(m => !m.id.startsWith("local-"))
                        }
                    }

                    store.setMessages(currentSessionId, updated)

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

                    const store = useMessages.getState()
                    const existing = store.getMessagesBySession(currentSessionId)
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

                    const updated = [...existing]
                    updated[msgIdx] = { ...msg, parts: newParts } as Message
                    store.setMessages(currentSessionId, updated)
                    break
                }

                case "message.part.removed": {
                    const partId = props.partID as string | undefined
                    const messageId = props.messageID as string | undefined
                    if (!partId || !messageId || props.sessionID !== currentSessionId) return

                    const store = useMessages.getState()
                    const existing = store.getMessagesBySession(currentSessionId)
                    const msgIdx = existing.findIndex(m => m.id === messageId)

                    if (msgIdx < 0) return

                    const msg = existing[msgIdx]
                    const parts = (msg.parts ?? []).filter(p => p.id !== partId)

                    const updated = [...existing]
                    updated[msgIdx] = { ...msg, parts } as Message
                    store.setMessages(currentSessionId, updated)
                    break
                }

                case "message.removed": {
                    const messageId = props.messageID as string | undefined
                    if (!messageId || props.sessionID !== currentSessionId) return

                    const store = useMessages.getState()
                    const existing = store.getMessagesBySession(currentSessionId)
                    const filtered = existing.filter(m => m.id !== messageId)
                    store.setMessages(currentSessionId, filtered)
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
            setConnectionStatus("connecting")

            setTimeout(() => {
                if (!abort.signal.aborted) {
                    connect()
                }
            }, reconnectDelay)
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
            abort.abort()
            abortRef.current = null
            setConnectionStatus("disconnected")
            setStreaming(sid, false)
            setActiveMessageId(sid, null)
        }
    }, [sessionId, url, token])
}
