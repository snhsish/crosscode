import { useEffect, useRef } from "react"
import { useChatStore } from "@/store/chat.store"
import { useMessages, Message, Part } from "@/store/messages.store"
import { getMessages } from "@/lib/messages"

export function useEventStream(url?: string, sessionId?: string, token?: string) {
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (!url || !sessionId || !token) return

        const baseUrl = url.replace(/\/+$/, "")
        const sid = sessionId
        const tok = token
        const setConnectionStatus = useChatStore.getState().setConnectionStatus
        const setStreaming = useChatStore.getState().setStreaming
        const setActiveMessageId = useChatStore.getState().setActiveMessageId

        async function poll() {
            try {
                const raw = await getMessages(baseUrl, tok, sid)
                if (!raw) return

                const data = raw.length > 0 && "info" in raw[0]
                    ? (raw as unknown as Array<{ info: Message; parts: Part[] }>).map((m) => ({ ...m.info, parts: m.parts }))
                    : raw

                const store = useMessages.getState()
                const setMessages = useMessages.getState().setMessages
                const existing = store.getMessagesBySession(sid)
                const existingMap = new Map(existing.map(m => [m.id, m]))
                let changed = false

                for (const msg of data) {
                    const existingMsg = existingMap.get(msg.id)
                    if (existingMsg) {
                        const partsChanged =
                            JSON.stringify(existingMsg.parts) !== JSON.stringify(msg.parts)
                        const completedChanged =
                            existingMsg.role === "assistant" &&
                            msg.role === "assistant" &&
                            existingMsg.time?.completed !== msg.time?.completed
                        if (partsChanged || completedChanged) {
                            existingMap.set(msg.id, msg)
                            changed = true
                        }
                    } else {
                        existingMap.set(msg.id, msg)
                        changed = true
                    }
                }

                const localIds: string[] = []
                for (const [id] of existingMap) {
                    if (id.startsWith("local-")) localIds.push(id)
                }
                if (localIds.length > 0) {
                    const hasServerUserMsg = data.some((m) => m.role === "user")
                    if (hasServerUserMsg) {
                        for (const lid of localIds) {
                            existingMap.delete(lid)
                            changed = true
                        }
                    }
                }

                if (changed) {
                    setMessages(sid, Array.from(existingMap.values()))
                }

                for (const msg of data) {
                    if (msg.role === "assistant") {
                        setActiveMessageId(sid, msg.id)
                        if (msg.time?.completed) {
                            setStreaming(sid, false)
                            setActiveMessageId(sid, null)
                        } else {
                            setStreaming(sid, true)
                        }
                    }
                }
            } catch {
                // poll error, will retry
            }
        }

        setConnectionStatus("connected")
        poll()
        pollRef.current = setInterval(poll, 2000)

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current)
                pollRef.current = null
            }
            setConnectionStatus("disconnected")
            setStreaming(sid, false)
            setActiveMessageId(sid, null)
        }
    }, [sessionId, url, token])
}
