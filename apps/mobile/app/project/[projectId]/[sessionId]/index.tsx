import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, AppState, FlatList, Keyboard, Platform, View } from "react-native"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { useProjects } from "@/store/projects.store"
import { useSessions } from "@/store/sessions.store"
import { useConnections } from "@/store/connection.store"
import { Message, Part, useMessages } from "@/store/messages.store"
import { useAgents } from "@/store/agents.store"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ArrowDownIcon from "lucide-react-native/dist/esm/icons/arrow-down"
import MessageCircleIcon from "lucide-react-native/dist/esm/icons/message-circle"
import RefreshCwIcon from "lucide-react-native/dist/esm/icons/refresh-cw"
import TriangleAlertIcon from "lucide-react-native/dist/esm/icons/triangle-alert"
import XIcon from "lucide-react-native/dist/esm/icons/x"
import { useColorScheme } from "nativewind"
import { THEME } from "@/lib/theme"
import { Text } from "@/components/ui/text"
import { getMessages } from "@/lib/messages"
import { Pressable } from "react-native"
import { Button } from "@/components/ui/button"
import { MessageItem } from "@/components/message-item"
import { SessionHeader } from "@/components/session-header"
import { ChatInput, ImageAttachment } from "@/components/chat-input"
import { useEventStream } from "@/components/hooks/event-stream"
import { useVoiceInput } from "@/components/hooks/use-voice-input"
import { useChatStore, SelectedModel } from "@/store/chat.store"
import { useModels } from "@/store/models.store"
import { updateSessionModel } from "@/lib/models"
import { WorkingIndicator } from "@/components/typing-animation"
import { useQuestions } from "@/store/questions.store"
import { getPendingQuestions, replyToQuestion, rejectQuestion } from "@/lib/questions"
import { QuestionRequest } from "@/store/questions.store"
import { usePermissions } from "@/store/permissions.store"
import { getPendingPermissions, replyToPermission } from "@/lib/permissions"
import { PermissionRequest } from "@/store/permissions.store"
import { PermissionBlock } from "@/components/permission-block"
import { getAuthHeader } from "@/lib/utils"
import { notifyAgentStatus, setActiveChatScreen, clearActiveChatScreen } from "@/lib/notifications"

const EMPTY_QUESTIONS: QuestionRequest[] = []

const EMPTY_PERMISSIONS: PermissionRequest[] = []

const EMPTY_MESSAGES: Message[] = []

const MESSAGES_PER_PAGE = 20

export default function SessionScreen() {
    const insets = useSafeAreaInsets()
    const { colorScheme } = useColorScheme()
    const { projectId, sessionId } = useLocalSearchParams<{ projectId: string; sessionId: string }>()

    if (!projectId || !sessionId) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return <SessionScreenInner projectId={projectId} sessionId={sessionId} />
}

function SessionScreenInner({ projectId, sessionId }: { projectId: string; sessionId: string }) {
    const insets = useSafeAreaInsets()
    const { colorScheme } = useColorScheme()
    const router = useRouter()

    const connections = useConnections((s) => s.connections)
    const current = useConnections((s) => s.current)
    const projects = useProjects((s) => s.projects)
    const sessions = useSessions((s) => s.sessions)
    const upsertSession = useSessions((s) => s.upsertSession)
    const rawMessages = useMessages((s) => s.messagesBySession[sessionId!] ?? EMPTY_MESSAGES)
    const messages = useMemo(() => [...rawMessages].reverse(), [rawMessages])
    const upsertMessages = useMessages((s) => s.upsertMessages)
    const setMessages = useMessages((s) => s.setMessages)
    const getMessagesBySession = useMessages((s) => s.getMessagesBySession)
    const agents = useAgents((s) => s.agents)
    const fetchAgents = useAgents((s) => s.fetchAgents)

    const [selectedAgent, setSelectedAgent] = useState("build")
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [isAtBottom, setIsAtBottom] = useState(true)
    const [sending, setSending] = useState(false)
    const [sendError, setSendError] = useState<{ title: string; hint?: string; retryable?: boolean } | null>(null)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMoreMessages, setHasMoreMessages] = useState(true)
    const [selectedImages, setSelectedImages] = useState<ImageAttachment[]>([])
    const [keyboardHeight, setKeyboardHeight] = useState(0)

    const voice = useVoiceInput()

    const scrollRef = useRef<FlatList<Message>>(null)

    useEffect(() => {
        const showListener = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (e) => {
            setKeyboardHeight(e.endCoordinates.height)
        })
        const hideListener = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => {
            setKeyboardHeight(0)
        })
        return () => {
            showListener.remove()
            hideListener.remove()
        }
    }, [])

    const theme = (colorScheme ?? "light") as "light" | "dark"

    const connection = useMemo(() => connections.find((c) => c.id === current) ?? null, [connections, current])
    const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId])
    const session = useMemo(() => sessions.find((s) => s.id === sessionId) ?? null, [sessions, sessionId])

    const isStreaming = useChatStore(
        useCallback((s) => s.streamingBySession[sessionId!] ?? false, [sessionId])
    )
    const connectionStatus = useChatStore((s) => s.connectionStatus)
    const draft = useChatStore(
        useCallback((s) => s.draftBySession[sessionId!] ?? "", [sessionId])
    )
    const setDraft = useChatStore((s) => s.setDraft)
    const clearDraft = useChatStore((s) => s.clearDraft)
    const currentAgentModel = useChatStore(
        useCallback((s) => s.modelByAgent[selectedAgent], [selectedAgent])
    )
    const setModelByAgent = useChatStore((s) => s.setModelByAgent)
    const setModel = useChatStore((s) => s.setModel)
    const storedModel = useChatStore(
        useCallback((s) => s.modelBySession[sessionId!], [sessionId])
    )

    const selectedModel = currentAgentModel ?? storedModel ?? session?.model ?? null

    const models = useModels((s) => s.models)
    const fetchAll = useModels((s) => s.fetchAll)

    const pendingQuestions = useQuestions(
        useCallback((s) => s.questionsBySession[sessionId!] ?? EMPTY_QUESTIONS, [sessionId])
    )
    const setQuestions = useQuestions((s) => s.setQuestions)
    const removeQuestion = useQuestions((s) => s.removeQuestion)

    const pendingPermissions = usePermissions(
        useCallback((s) => s.permissionsBySession[sessionId!] ?? EMPTY_PERMISSIONS, [sessionId])
    )
    const setPermissions = usePermissions((s) => s.setPermissions)
    const removePermission = usePermissions((s) => s.removePermission)

    const questionPollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const permissionPollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const appStateRef = useRef(AppState.currentState)

    const pollQuestions = useCallback(async () => {
        if (!connection?.url || !connection?.token) return
        if (appStateRef.current !== "active") {
            questionPollRef.current = setTimeout(pollQuestions, 5000)
            return
        }
        try {
            const qs = await getPendingQuestions(connection.url, connection.token)
            const sessionQs = qs.filter((q) => q.sessionID === sessionId)
            const current = useQuestions.getState().questionsBySession[sessionId!] ?? EMPTY_QUESTIONS
            if (
                sessionQs.length !== current.length ||
                sessionQs.some((q, i) => q.id !== current[i]?.id)
            ) {
                const currentIds = new Set(current.map((q) => q.id))
                for (const question of sessionQs) {
                    if (currentIds.has(question.id)) continue
                    const firstQuestion = question.questions[0]
                    notifyAgentStatus({
                        key: `${sessionId}:question:${question.id}`,
                        kind: "question",
                        title: "Agent has a question",
                        message: firstQuestion?.question ?? "The agent is waiting for your answer.",
                        projectId,
                        sessionId,
                    })
                }
                setQuestions(sessionId!, sessionQs)
            }
        } catch {}
        questionPollRef.current = setTimeout(pollQuestions, 5000)
    }, [connection?.url, connection?.token, projectId, sessionId, setQuestions])

    useEffect(() => {
        pollQuestions()
        const sub = AppState.addEventListener("change", (nextState) => {
            appStateRef.current = nextState
        })
        return () => {
            if (questionPollRef.current) clearTimeout(questionPollRef.current)
            sub.remove()
        }
    }, [pollQuestions])

    const pollPermissions = useCallback(async () => {
        if (!connection?.url || !connection?.token) return
        if (appStateRef.current !== "active") {
            permissionPollRef.current = setTimeout(pollPermissions, 5000)
            return
        }
        try {
            const perms = await getPendingPermissions(connection.url, connection.token, sessionId)
            console.log("[PERM-DEBUG] pollPermissions raw:", JSON.stringify(perms))
            const sessionPerms = perms.filter((p) => !p.sessionID || p.sessionID === sessionId)
            const current = usePermissions.getState().permissionsBySession[sessionId!] ?? EMPTY_PERMISSIONS
            if (
                sessionPerms.length !== current.length ||
                sessionPerms.some((p, i) => p.id !== current[i]?.id)
            ) {
                setPermissions(sessionId!, sessionPerms)
            }
        } catch {}
        permissionPollRef.current = setTimeout(pollPermissions, 5000)
    }, [connection?.url, connection?.token, sessionId, setPermissions])

    useEffect(() => {
        pollPermissions()
        return () => {
            if (permissionPollRef.current) clearTimeout(permissionPollRef.current)
        }
    }, [pollPermissions])

    const failedSendRef = useRef<{
        text: string
        targetSessionId: string
        localId: string
        modelId?: string
        providerId?: string
        images?: ImageAttachment[]
    } | null>(null)

    const handleQuestionReply = useCallback(async (requestId: string, answers: string[][]) => {
        if (!connection?.url || !connection?.token) return
        const success = await replyToQuestion(connection.url, connection.token, requestId, answers)
        if (success) {
            removeQuestion(sessionId!, requestId)
        }
    }, [connection?.url, connection?.token, sessionId, removeQuestion])

    const handleQuestionReject = useCallback(async (requestId: string) => {
        if (!connection?.url || !connection?.token) return
        const success = await rejectQuestion(connection.url, connection.token, requestId)
        if (success) {
            removeQuestion(sessionId!, requestId)
        }
    }, [connection?.url, connection?.token, sessionId, removeQuestion])

    const handlePermissionReply = useCallback(async (requestId: string, reply: "once" | "always" | "reject", message?: string) => {
        if (!connection?.url || !connection?.token) return
        const success = await replyToPermission(connection.url, connection.token, requestId, reply, message, sessionId)
        if (success) {
            removePermission(sessionId!, requestId)
        }
    }, [connection?.url, connection?.token, sessionId, removePermission])

    const currentModel = useMemo(
        () =>
            selectedModel
                ? models.find((m) => m.id === selectedModel.id && m.providerID === selectedModel.providerID)
                : session?.model
                    ? models.find((m) => m.id === session.model!.id && m.providerID === session.model!.providerID)
                    : null,
        [selectedModel, session?.model, models]
    )
    const variants = currentModel?.variants ?? []
    const currentVariant = selectedModel?.variant ?? session?.model?.variant ?? currentModel?.options?.variant ?? undefined

    const scrollToBottomOnLoad = useCallback(() => {
        if (scrollRef.current && !initialMessagesLoaded) {
            scrollRef.current.scrollToEnd({ animated: false })
            setInitialMessagesLoaded(true)
        }
    }, [initialMessagesLoaded])

    const scrollToBottom = useCallback(() => {
        scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    }, [])

    const onScrollToIndexFailed = useCallback(() => {}, [])

    useEventStream(connection?.url, sessionId, connection?.token, projectId)

    useFocusEffect(
        useCallback(() => {
            setActiveChatScreen(projectId!, sessionId!)
            return () => clearActiveChatScreen()
        }, [projectId, sessionId])
    )

    const attemptSendMessage = useCallback(async (
        connectionUrl: string,
        connectionToken: string,
        targetSessionId: string,
        text: string,
        agent: string,
        modelId?: string,
        providerId?: string,
        images?: ImageAttachment[],
    ): Promise<{ ok: boolean; retryable: boolean; errorText?: string; errorName?: string; status?: number }> => {
        try {
            const parts: Array<Record<string, unknown>> = [{ type: "text", text }]
            if (images && images.length > 0) {
                for (const img of images) {
                    if (img.base64) {
                        parts.push({
                            type: "file",
                            mime: img.mime,
                            url: `data:${img.mime};base64,${img.base64}`,
                            filename: img.fileName,
                        })
                    } else if (img.uri) {
                        try {
                            const res = await fetch(img.uri)
                            const blob = await res.blob()
                            const dataUrl = await new Promise<string>((resolve, reject) => {
                                const reader = new FileReader()
                                reader.onload = () => resolve(reader.result as string)
                                reader.onerror = () => reject(new Error("read failed"))
                                reader.readAsDataURL(blob)
                            })
                            parts.push({
                                type: "file",
                                mime: img.mime,
                                url: dataUrl,
                                filename: img.fileName,
                            })
                        } catch {}
                    }
                }
            }
            const body: Record<string, unknown> = { parts, agent }
            if (modelId && providerId) {
                body.model = { modelID: modelId, providerID: providerId }
            }
            const res = await fetch(`${connectionUrl}/session/${targetSessionId}/message`, {
                method: "POST",
                headers: {
                    "Authorization": getAuthHeader(connectionToken),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                let errorText = `${res.status} ${res.statusText}`
                let errorName = "UnknownError"
                try {
                    const errorBody = await res.json()
                    if (errorBody.error) {
                        errorText = errorBody.error
                        errorName = errorBody.name || "UnknownError"
                    } else if (errorBody.message) {
                        errorText = errorBody.message
                        errorName = errorBody.name || "UnknownError"
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
    }, [])

    const finalizeSendError = useCallback((
        targetSessionId: string,
        localId: string,
        text: string,
        errorName: string,
        errorText: string,
        status?: number,
        modelId?: string,
        providerId?: string,
    ) => {
        const now = Date.now()
        const existing = getMessagesBySession(targetSessionId)
        setMessages(targetSessionId, existing.filter((m) => m.id !== localId))
        setDraft(targetSessionId, text)

        const errorMsg: Message = {
            id: `error-${now}`,
            sessionID: targetSessionId,
            role: "assistant",
            time: { created: now, completed: now },
            parentID: localId,
            modelID: modelId ?? "...",
            providerID: providerId ?? "...",
            mode: selectedAgent,
            path: { cwd: "", root: "" },
            cost: 0,
            tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            error: { name: errorName as any, data: { message: errorText } } as any,
            parts: [{ type: "text", text: `Failed to send message: ${errorText}` }],
        }
        upsertMessages(targetSessionId, [errorMsg])

        let title = "Failed to send message"
        let hint: string | undefined
        if (errorName === "ProviderAuthError") {
            title = "Authentication Error"
            hint = "Check your API key or provider credentials"
        } else if (errorName === "APIError" || (status && status >= 500)) {
            title = "API Error"
            hint = "Try switching to a different model"
        } else if (errorName === "MessageOutputLengthError") {
            title = "Output Too Long"
            hint = "Try a shorter prompt or split your request"
        } else if (errorName === "MessageAbortedError") {
            title = "Request Aborted"
        } else if (status === 429) {
            title = "Rate Limited"
            hint = "Too many requests, please wait a moment"
        } else if (status === 404) {
            title = "Not Found"
            hint = "The endpoint or session may not exist"
        } else if (errorName === "NetworkError") {
            title = "Connection Failed"
            hint = "Check your internet connection and try again"
        }
        setSendError({ title, hint, retryable: true })
    }, [getMessagesBySession, setMessages, setDraft, upsertMessages, selectedAgent])

    const handleRetry = useCallback(async () => {
        const data = failedSendRef.current
        if (!data || !connection?.url || !connection?.token) return

        setSendError(null)
        setSending(true)

        const result = await attemptSendMessage(
            connection.url, connection.token, data.targetSessionId,
            data.text, selectedAgent, data.modelId, data.providerId, data.images,
        )

        if (result.ok) {
            setSending(false)
            failedSendRef.current = null
            return
        }

        if (result.retryable) {
            setSending(false)
            setSendError({
                title: "Failed to send message",
                hint: result.errorText,
                retryable: true,
            })
        } else {
            if (data.images && data.images.length > 0) setSelectedImages(data.images)
            finalizeSendError(
                data.targetSessionId, data.localId, data.text,
                result.errorName ?? "UnknownError", result.errorText ?? "Unknown error",
                result.status, data.modelId, data.providerId,
            )
            setSending(false)
        }
    }, [connection, selectedAgent, attemptSendMessage, finalizeSendError])

    const abortStreaming = useCallback(async () => {
        if (!connection?.url || !isStreaming) return
        try {
            await fetch(`${connection.url}/session/${sessionId}/abort`, {
                method: "POST",
                headers: { Authorization: getAuthHeader(connection.token) },
            })
        } catch {}
    }, [connection, sessionId, isStreaming])

    const sendMessage = useCallback(async () => {
        if (!connection?.url || sending) return

        const text = draft.trim()
        if (!text) return

        const now = Date.now()
        const modelId = selectedModel?.id ?? session?.model?.id
        const providerId = selectedModel?.providerID ?? session?.model?.providerID

        const targetSessionId = sessionId
        const targetSession = session

        if (voice.recognizing) {
            voice.stopRecognition()
        }
        voiceSuppressedRef.current = true
        voice.resetTranscript()
        voiceInitialDraftRef.current = null

        const imagesToSend = selectedImages
        clearDraft(targetSessionId)
        setSelectedImages([])
        setSending(true)
        setSendError(null)

        const localId = `local-${now}`

        const userParts: Part[] = [{ type: "text", text }]
        if (imagesToSend.length > 0) {
            for (const img of imagesToSend) {
                userParts.push({
                    type: "file",
                    mime: img.mime,
                    url: img.uri,
                    filename: img.fileName,
                })
            }
        }

        const userMsg: Message = {
            id: localId,
            sessionID: targetSessionId,
            role: "user",
            time: { created: now },
            agent: selectedAgent,
            model: { providerID: providerId ?? "...", modelID: modelId ?? "..." },
            parts: userParts,
        }

        upsertMessages(targetSessionId, [userMsg])

        const result = await attemptSendMessage(
            connection.url, connection.token, targetSessionId,
            text, selectedAgent, modelId, providerId, imagesToSend,
        )

        if (result.ok) {
            setSending(false)
            return
        }

        if (result.retryable) {
            failedSendRef.current = { text, targetSessionId, localId, modelId, providerId, images: imagesToSend }
            setSending(false)
            setSendError({
                title: "Failed to send message",
                hint: result.errorText,
                retryable: true,
            })
        } else {
            setSelectedImages(imagesToSend)
            finalizeSendError(
                targetSessionId, localId, text,
                result.errorName ?? "UnknownError", result.errorText ?? "Unknown error",
                result.status, modelId, providerId,
            )
            setSending(false)
        }
    }, [connection, sending, draft, selectedModel, session, selectedAgent, sessionId, clearDraft, upsertMessages, attemptSendMessage, finalizeSendError, selectedImages, voice.recognizing, voice.stopRecognition, voice.resetTranscript])

    const getAndSetMessages = useCallback(async () => {
        if (!connection?.url || !connection?.token) return
        setRefreshing(true)

        const raw = await getMessages(connection.url, connection.token, sessionId!, MESSAGES_PER_PAGE)
        if (raw) {
            const data =
                raw.length > 0 && "info" in raw[0]
                    ? (raw as unknown as Array<{ info: Message; parts: Part[] }>).map((m) => ({ ...m.info, parts: m.parts }))
                    : raw

            const existing = getMessagesBySession(sessionId!)
            const localMessages = existing.filter(m => m.id.startsWith("local-"))
            const map = new Map<string, Message>()
            for (const m of data) map.set(m.id, m)
            for (const m of localMessages) map.set(m.id, m)
            setMessages(sessionId!, Array.from(map.values()))

            if (data.length < MESSAGES_PER_PAGE) {
                setHasMoreMessages(false)
            }
        }
        setRefreshing(false)
        setInitialMessagesLoaded(true)
    }, [connection, sessionId, setMessages, getMessagesBySession])

    const loadMoreMessages = useCallback(async () => {
        if (!connection?.url || !connection?.token || isLoadingMore || !hasMoreMessages) return
        
        setIsLoadingMore(true)
        
        const existing = getMessagesBySession(sessionId!)
        const offset = existing.length
        
        const raw = await getMessages(connection.url, connection.token, sessionId!, MESSAGES_PER_PAGE, offset)
        if (raw) {
            const data =
                raw.length > 0 && "info" in raw[0]
                    ? (raw as unknown as Array<{ info: Message; parts: Part[] }>).map((m) => ({ ...m.info, parts: m.parts }))
                    : raw

            if (data.length > 0) {
                const map = new Map<string, Message>()
                for (const m of [...data, ...existing]) {
                    map.set(m.id, m)
                }
                setMessages(sessionId!, Array.from(map.values()))
                
                if (data.length < MESSAGES_PER_PAGE) {
                    setHasMoreMessages(false)
                }
            } else {
                setHasMoreMessages(false)
            }
        }
        
        setIsLoadingMore(false)
    }, [connection, sessionId, isLoadingMore, hasMoreMessages, getMessagesBySession, setMessages])

    useEffect(() => {
        if (session) getAndSetMessages()
    }, [session?.id, getAndSetMessages])

    useEffect(() => {
        if (connection) fetchAgents(connection.url, connection.token)
    }, [connection?.id, fetchAgents])

    useFocusEffect(
        useCallback(() => {
            const currentModelByAgent = useChatStore.getState().modelByAgent
            const existingAgentModel = currentModelByAgent[selectedAgent]
            if (existingAgentModel) return
            if (session?.model) {
                setModelByAgent(selectedAgent, { id: session.model.id, providerID: session.model.providerID, variant: session.model.variant })
            } else if (storedModel) {
                setModelByAgent(selectedAgent, storedModel)
            }
        }, [selectedAgent, session?.model?.id, session?.model?.providerID, session?.model?.variant, storedModel])
    )

    useEffect(() => {
        if (connection) fetchAll(connection.url, connection.token)
    }, [connection?.id, fetchAll])

    useEffect(() => {
        if (isAtBottom && messages.length > 0) {
            requestAnimationFrame(() => {
                scrollRef.current?.scrollToOffset({ offset: 0, animated: false })
            })
        }
    }, [messages.length, isAtBottom])

    useEffect(() => {
        if (keyboardHeight > 0) {
            requestAnimationFrame(() => {
                scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
            })
        }
    }, [keyboardHeight])

    const voiceInitialDraftRef = useRef<string | null>(null)
    const voiceSuppressedRef = useRef(false)
    useEffect(() => {
        if (voiceSuppressedRef.current) return
        if (voice.recognizing) {
            if (voiceInitialDraftRef.current === null) {
                voiceInitialDraftRef.current = draft
            }
            if (voice.transcript) {
                const prefix = voiceInitialDraftRef.current
                const newText = prefix ? `${prefix} ${voice.transcript}` : voice.transcript
                setDraft(sessionId!, newText)
            }
        } else {
            voiceInitialDraftRef.current = null
            voice.resetTranscript()
        }
    }, [voice.transcript, voice.recognizing])

    const handleStartVoice = useCallback(async () => {
        voiceSuppressedRef.current = false
        await voice.startRecognition()
    }, [voice.startRecognition])

    const handleStopVoice = useCallback(() => {
        voice.stopRecognition()
    }, [voice.stopRecognition])

    const handleScroll = useCallback(
        (e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
            // In inverted list, "bottom" is at offset 0
            const threshold = 200
            const atBottom = contentOffset.y <= threshold
            setIsAtBottom(atBottom)
        },
        []
    )

    const handleScrollBeginDrag = useCallback(() => Keyboard.dismiss(), [])

    const matchedPermissionIds = useMemo(() => {
        const ids = new Set<string>()
        for (const msg of rawMessages) {
            for (const part of msg.parts ?? []) {
                if (part.type === "tool-invocation") {
                    for (const p of pendingPermissions) {
                        if (
                            p.tool?.messageID === msg.id &&
                            p.tool?.callID === part.toolInvocation.toolCallId
                        ) {
                            ids.add(p.id)
                        }
                    }
                } else if (part.type === "tool") {
                    for (const p of pendingPermissions) {
                        if (p.tool?.messageID === msg.id && p.tool?.callID === part.callID) {
                            ids.add(p.id)
                        }
                    }
                }
            }
        }
        return ids
    }, [rawMessages, pendingPermissions])

    // Permissions that are not tied to a specific message tool part (e.g. external
    // directory access requests) cannot be rendered inline, so surface them as a
    // dedicated panel so the user can accept/deny and unblock the agent.
    const orphanPermissions = useMemo(
        () => pendingPermissions.filter((p) => !matchedPermissionIds.has(p.id)),
        [pendingPermissions, matchedPermissionIds]
    )

    const renderItem = useCallback(
        ({ item }: { item: Message }) => {
            const hasQuestionTool = item.parts?.some(
                (p) =>
                    (p.type === "tool-invocation" && p.toolInvocation.toolName === "question") ||
                    (p.type === "tool" && p.tool === "question")
            )
            const hasPermissionTool = item.parts?.some(
                (p) => {
                    if (p.type === "tool-invocation") {
                        return p.toolInvocation.state === "call"
                    }
                    if (p.type === "tool") {
                        return p.state?.status === "pending" || p.state?.status === "call"
                    }
                    return false
                }
            )
            const isStreamingMsg = isStreaming && item.role === "assistant" && !item.time?.completed
            return (
                <MessageItem
                    message={item}
                    theme={theme}
                    projectId={projectId}
                    sessionId={sessionId}
                    pendingQuestions={hasQuestionTool ? pendingQuestions : EMPTY_QUESTIONS}
                    onQuestionReply={handleQuestionReply}
                    onQuestionReject={handleQuestionReject}
                    pendingPermissions={hasPermissionTool ? pendingPermissions : EMPTY_PERMISSIONS}
                    onPermissionReply={handlePermissionReply}
                    streaming={isStreamingMsg}
                />
            )
        },
        [theme, projectId, sessionId, pendingQuestions, pendingPermissions, handleQuestionReply, handleQuestionReject, handlePermissionReply, isStreaming]
    )

    const keyExtractor = useCallback((item: Message) => item.id, [])

    // Compute the current response "turn": all messages after the last user message.
    // The group start is anchored to the first assistant message of the turn so the
    // timer reflects the entire response rather than resetting per message part.
    const turn = useMemo(() => {
        const sorted = [...rawMessages].sort(
            (a, b) => (a.time?.created ?? 0) - (b.time?.created ?? 0)
        )
        let lastUserIdx = -1
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i].role === "user") {
                lastUserIdx = i
                break
            }
        }
        if (lastUserIdx === -1) return null

        const after = sorted.slice(lastUserIdx + 1)
        const assistantMsgs = after.filter((m) => m.role === "assistant")

        if (assistantMsgs.length === 0) {
            const startAt = sorted[lastUserIdx].time?.created ?? null
            return startAt == null ? null : { startAt, endAt: null as number | null }
        }

        const startAt = assistantMsgs[0].time?.created ?? null
        if (startAt == null) return null

        let endAt: number | null = null
        if (!isStreaming) {
            let max = 0
            for (const m of after) {
                const t = m.time?.completed ?? m.time?.created ?? 0
                if (t > max) max = t
            }
            endAt = max || null
        }

        return { startAt, endAt }
    }, [rawMessages, isStreaming])

    // The list is inverted, so the header renders visually below the newest message
    const StreamingIndicator = useMemo(() => {
        if (!turn || turn.startAt == null) return null
        return (
            <View className="pt-1 pb-2">
                <WorkingIndicator startedAt={turn.startAt} endedAt={turn.endAt} />
            </View>
        )
    }, [turn])

    const ListFooterComponent = useMemo(() => {
        if (!isLoadingMore) return null
        return (
            <View className="flex flex-col gap-0 p-4">
                <ActivityIndicator size="small" color={THEME[theme].mutedForeground} />
            </View>
        )
    }, [isLoadingMore, theme])

    const ListEmptyComponent = useMemo(() => {
        if (refreshing) {
            return (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={THEME[theme].mutedForeground} />
                    <Text className="text-xs text-muted-foreground mt-3">Loading messages...</Text>
                </View>
            )
        }
        return (
            <View className="flex-1 items-center justify-center px-8">
                <View className="w-16 h-16 rounded-full bg-accent items-center justify-center mb-6">
                    <MessageCircleIcon size={28} color={THEME[theme].foreground} />
                </View>
                <Text className="text-2xl font-semibold tracking-tight text-center mb-2">
                    How can I help?
                </Text>
                <Text className="text-sm text-muted-foreground text-center leading-5">
                    Ask me anything about your codebase. I can help you fix bugs, add features, refactor code, and more.
                </Text>
            </View>
        )
    }, [refreshing, theme])

    const handleAgentChange = useCallback((agent: string) => {
        setSelectedAgent(agent)
    }, [])

    const handleModelSelect = useCallback((_model: { id: string; providerID: string; variant?: string }) => {}, [])

    const handleVariantSelect = useCallback((variant: string) => {
        if (sessionId && selectedModel) {
            setModel(sessionId, { ...selectedModel, variant })
        }
    }, [sessionId, selectedModel, setModel])

    const handleSessionModelUpdate = useCallback(
        (model: { id: string; providerID: string; variant: string }) => {
            if (!connection?.url || !connection?.token) return
            const modelId = selectedModel?.id ?? session?.model?.id
            const providerId = selectedModel?.providerID ?? session?.model?.providerID
            if (modelId && providerId) {
                setModel(sessionId!, { id: modelId, providerID: providerId, variant: model.variant })
                updateSessionModel(connection.url, connection.token, sessionId!, {
                    id: modelId,
                    providerID: providerId,
                    variant: model.variant,
                })
            }
        },
        [connection, selectedModel, session, sessionId, setModel]
    )

    return (
        <View className="flex-1 bg-background">
            <SessionHeader
                projectId={projectId!}
                sessionId={sessionId!}
                title={session?.title}
                projectName={project?.name}
                projectDirectory={project?.directory}
                sessionDirectory={session?.directory}
                theme={theme}
                paddingTop={insets.top}
            />

            {(connectionStatus === "connecting" || connectionStatus === "reconnecting" || connectionStatus === "connectivity-issues") && (
                <View className="flex-row items-center gap-2 px-4 py-1.5 bg-accent/50 border-b border-accent">
                    <ActivityIndicator size="small" color={THEME[theme].mutedForeground} />
                    <Text className="text-xs text-muted-foreground">
                        {connectionStatus === "connecting"
                            ? "Connecting..."
                            : connectionStatus === "reconnecting"
                                ? "Reconnecting..."
                                : "Connectivity issues, retrying..."}
                    </Text>
                </View>
            )}

            {messages.length > 0 ? (
                <FlatList
                    ref={scrollRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    onContentSizeChange={scrollToBottomOnLoad}
                    onScroll={handleScroll}
                    scrollEventThrottle={150}
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={handleScrollBeginDrag}
                    className="flex-1 px-4 pt-2"
                    contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: keyboardHeight + 16 }}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    ListFooterComponent={ListFooterComponent}
                    ListHeaderComponent={StreamingIndicator}
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    initialNumToRender={15}
                    inverted
                    onEndReached={loadMoreMessages}
                    onEndReachedThreshold={0.5}
                />
            ) : (
                ListEmptyComponent
            )}

            {!isAtBottom && messages.length > 0 && (
                <View className="absolute left-0 right-0" style={{ bottom: insets.bottom + 150 + keyboardHeight }}>
                    <View className="items-center">
                        <Button variant="secondary" size="xs" className="rounded-full shadow-md" onPress={scrollToBottom}>
                            <ArrowDownIcon size={12} color={THEME[theme].foreground} />
                            <Text className="text-xs">Scroll to bottom</Text>
                        </Button>
                    </View>
                </View>
            )}

            {turn && turn.startAt != null && messages.length === 0 && (
                <View className="px-4 py-2">
                    <WorkingIndicator startedAt={turn.startAt} endedAt={turn.endAt} />
                </View>
            )}

            {sendError && (
                <View className="px-4 pb-2">
                    <View className="flex-row items-start gap-2 p-3 rounded-xl bg-destructive/15 border border-destructive/30">
                        <TriangleAlertIcon size={14} color={THEME[theme].destructive ?? "#ef4444"} style={{ marginTop: 2 }} />
                        <View className="flex-1 gap-1">
                            <Text className="text-sm font-medium text-destructive">
                                {sendError.title}
                            </Text>
                            {sendError.hint && (
                                <Text className="text-xs text-destructive/70">
                                    {sendError.hint}
                                </Text>
                            )}
                        </View>
                        <View className="flex-row gap-2">
                            {sendError.retryable && (
                                <Button variant="secondary" size="xs" onPress={handleRetry}>
                                    <RefreshCwIcon size={12} color={THEME[theme].foreground} />
                                    <Text className="text-xs ml-1">Retry</Text>
                                </Button>
                            )}
                            <Pressable onPress={() => setSendError(null)} hitSlop={8}>
                                <XIcon size={12} color={THEME[theme].mutedForeground} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}

            {orphanPermissions.length > 0 && (
                <View className="px-4 pb-2 gap-2">
                    {orphanPermissions.map((perm) => (
                        <PermissionBlock
                            key={perm.id}
                            request={perm}
                            theme={theme}
                            onReply={handlePermissionReply}
                        />
                    ))}
                </View>
            )}

            <ChatInput
                draft={draft}
                setDraft={setDraft}
                sending={sending}
                onSend={sendMessage}
                selectedAgent={selectedAgent}
                onAgentChange={handleAgentChange}
                agents={agents}
                variants={variants}
                currentVariant={currentVariant}
                selectedModelId={selectedModel?.id}
                selectedProviderId={selectedModel?.providerID}
                sessionId={sessionId!}
                projectId={projectId!}
                connectionUrl={connection?.url}
                connectionToken={connection?.token}
                theme={theme}
                modelByAgent={currentAgentModel ? { [selectedAgent]: currentAgentModel } : {}}
                onModelSelect={handleModelSelect}
                onVariantSelect={handleVariantSelect}
                onSessionModelUpdate={handleSessionModelUpdate}
                images={selectedImages}
                onImagesChange={setSelectedImages}
                recognizing={voice.recognizing}
                voiceVolume={voice.volume}
                voiceAvailable={voice.isAvailable}
                onStartVoice={handleStartVoice}
                onStopVoice={handleStopVoice}
                streaming={isStreaming}
                onStop={abortStreaming}
            />
        </View>
    )
}
