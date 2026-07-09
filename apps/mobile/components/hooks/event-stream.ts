import EventSource from "react-native-sse"
import { useEffect } from "react"
import { useChatStore } from "@/store/chat.store"
import { useMessages, Message, AssistantMessage, Part } from "@/store/messages.store"

export function useEventStream(url?: string, sessionId?: string) {
    useEffect(() => {
        if (!url || !sessionId) return

        const es = new EventSource(`${url}/event`)

        const setConnectionStatus = useChatStore.getState().setConnectionStatus
        const setStreaming = useChatStore.getState().setStreaming
        const setActiveMessageId = useChatStore.getState().setActiveMessageId

        es.addEventListener("open", () => {
            setConnectionStatus("connected")
        })

        es.addEventListener("error", () => {
            setConnectionStatus("error")
        })

        es.addEventListener("message", (e) => {
            const evt = JSON.parse(e.data!)
            const props = evt.properties

            switch (evt.type) {
                case "message.updated": {
                    const info = props.info as AssistantMessage
                    if (info.sessionID !== sessionId) return

                    if (info.role === "assistant") {
                        setStreaming(sessionId, !info.time.completed)
                        setActiveMessageId(sessionId, info.time.completed ? null : info.id)
                    }

                    mergeMessage(sessionId, info)
                    break
                }

                case "message.part.updated": {
                    const part = props.part as Part & { sessionID: string; messageID: string }
                    if (part.sessionID !== sessionId) return

                    mergePart(sessionId, part.messageID, part)
                    break
                }

                case "session.idle": {
                    if (props.sessionID !== sessionId) return
                    setStreaming(sessionId, false)
                    setActiveMessageId(sessionId, null)
                    break
                }

                case "session.error": {
                    if (props.sessionID !== sessionId) return
                    setStreaming(sessionId, false)
                    setActiveMessageId(sessionId, null)
                    break
                }
            }
        })

        return () => {
            es.close()
            setConnectionStatus("disconnected")
        }
    }, [sessionId])
}

function mergeMessage(sessionId: string, info: Message) {
    useMessages.getState().upsertMessages(sessionId, [info])
}

function mergePart(
    sessionId: string,
    messageId: string,
    part: Part
) {
    const existing = useMessages.getState().getMessagesBySession(sessionId)
    const target = existing.find((m) => m.id === messageId)
    if (!target) return

    const parts = target.parts ?? []
    const updatedParts: Part[] = [...parts, part]

    useMessages.getState().upsertMessages(sessionId, [
        { ...target, parts: updatedParts } as Message,
    ])
}