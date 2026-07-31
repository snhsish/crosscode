import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, FlatList, Keyboard, View } from "react-native"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { useProjects } from "@/store/projects.store"
import { useSessions } from "@/store/sessions.store"
import { useConnections } from "@/store/connection.store"
import { Message, Part, useMessages } from "@/store/messages.store"
import { useAgents } from "@/store/agents.store"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ArrowDownIcon, MessageCircleIcon, TriangleAlertIcon, XIcon } from "lucide-react-native"
import { useColorScheme } from "nativewind"
import { THEME } from "@/lib/theme"
import { Text } from "@/components/ui/text"
import { getMessages } from "@/lib/messages"
import { Pressable } from "react-native"
import { Button } from "@/components/ui/button"
import { MessageItem } from "@/components/message-item"
import { SessionHeader } from "@/components/session-header"
import { ChatInput } from "@/components/chat-input"
import { useEventStream } from "@/components/hooks/event-stream"
import { useChatStore, SelectedModel } from "@/store/chat.store"
import { useModels } from "@/store/models.store"
import { updateSessionModel } from "@/lib/models"
import { TypingDots } from "@/components/typing-animation"
import { useQuestions } from "@/store/questions.store"
import { getPendingQuestions, replyToQuestion, rejectQuestion } from "@/lib/questions"
import { createSession } from "@/lib/sessions"
import { QuestionRequest } from "@/store/questions.store"

const EMPTY_QUESTIONS: QuestionRequest[] = []

const EMPTY_MESSAGES: Message[] = []

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
    const messages = useMessages(
        useCallback((s) => s.messagesBySession[sessionId!] ?? EMPTY_MESSAGES, [sessionId])
    )
    const upsertMessages = useMessages((s) => s.upsertMessages)
    const setMessages = useMessages((s) => s.setMessages)
    const getMessagesBySession = useMessages((s) => s.getMessagesBySession)
    const agents = useAgents((s) => s.agents)
    const fetchAgents = useAgents((s) => s.fetchAgents)

    const [selectedAgent, setSelectedAgent] = useState("build")
    const [selectedModel, setSelectedModel] = useState<{ id: string; providerID: string; variant?: string } | null>(null)
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [isAtBottom, setIsAtBottom] = useState(true)
    const [sending, setSending] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMoreMessages, setHasMoreMessages] = useState(true)

    const scrollRef = useRef<FlatList<Message>>(null)
    const MESSAGES_PER_PAGE = 20

    const theme = (colorScheme ?? "light") as "light" | "dark"

    const connection = useMemo(() => connections.find((c) => c.id === current) ?? null, [connections, current])
    const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId])
    const session = useMemo(() => sessions.find((s) => s.id === sessionId) ?? null, [sessions, sessionId])
    const isNewSession = sessionId === "new"

    const isStreaming = useChatStore(
        useCallback((s) => s.streamingBySession[sessionId!] ?? false, [sessionId])
    )
    const connectionStatus = useChatStore((s) => s.connectionStatus)
    const draft = useChatStore(
        useCallback((s) => s.draftBySession[sessionId!] ?? "", [sessionId])
    )
    const setDraft = useChatStore((s) => s.setDraft)
    const clearDraft = useChatStore((s) => s.clearDraft)
    const modelByAgent = useChatStore((s) => s.modelByAgent)
    const setModelByAgent = useChatStore((s) => s.setModelByAgent)
    const setModel = useChatStore((s) => s.setModel)
    const storedModel = useChatStore(
        useCallback((s) => s.modelBySession[sessionId!], [sessionId])
    )

    const { models, fetchAll } = useModels()

    const pendingQuestions = useQuestions(
        useCallback((s) => s.questionsBySession[sessionId!] ?? EMPTY_QUESTIONS, [sessionId])
    )
    const setQuestions = useQuestions((s) => s.setQuestions)
    const removeQuestion = useQuestions((s) => s.removeQuestion)

    const questionPollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const pollQuestions = useCallback(async () => {
        if (!connection?.url || !connection?.token) return
        try {
            const qs = await getPendingQuestions(connection.url, connection.token)
            const sessionQs = qs.filter((q) => q.sessionID === sessionId)
            setQuestions(sessionId!, sessionQs)
        } catch {}
        questionPollRef.current = setTimeout(pollQuestions, 3000)
    }, [connection?.url, connection?.token, sessionId, setQuestions])

    useEffect(() => {
        pollQuestions()
        return () => {
            if (questionPollRef.current) clearTimeout(questionPollRef.current)
        }
    }, [pollQuestions])

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

    useEventStream(connection?.url, isNewSession ? undefined : sessionId, connection?.token)

    const sendMessage = useCallback(async () => {
        if (!connection?.url || sending) return

        const text = draft.trim()
        if (!text) return

        const now = Date.now()
        const modelId = selectedModel?.id ?? session?.model?.id
        const providerId = selectedModel?.providerID ?? session?.model?.providerID

        let targetSessionId = sessionId
        let targetSession = session

        if (isNewSession) {
            if (!project?.worktree) return
            const newSession = await createSession(connection.url, connection.token, project.worktree)
            if (!newSession) {
                setSendError("Failed to create session")
                return
            }
            upsertSession(newSession)
            targetSessionId = newSession.id
            targetSession = newSession
            router.replace(`/project/${projectId}/${newSession.id}`)
        }

        clearDraft(targetSessionId)
        setSending(true)
        setSendError(null)

        const localId = `local-${now}`

        const userMsg: Message = {
            id: localId,
            sessionID: targetSessionId,
            role: "user",
            time: { created: now },
            agent: selectedAgent,
            model: { providerID: providerId ?? "...", modelID: modelId ?? "..." },
            parts: [{ type: "text", text }],
        }

        upsertMessages(targetSessionId, [userMsg])

        try {
            const body: Record<string, unknown> = { parts: [{ type: "text", text }], agent: selectedAgent }
            if (modelId && providerId) {
                body.model = { modelID: modelId, providerID: providerId }
            }
            const res = await fetch(`${connection.url}/session/${targetSessionId}/message`, {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${btoa(`opencode:${connection.token}`)}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                let errorText = `${res.status} ${res.statusText}`
                try {
                    const errorBody = await res.json()
                    if (errorBody.error) errorText = errorBody.error
                    else if (errorBody.message) errorText = errorBody.message
                } catch {}

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
                    error: { name: "UnknownError", data: { message: errorText } },
                    parts: [{ type: "text", text: `Failed to send message: ${errorText}` }],
                }
                upsertMessages(targetSessionId, [errorMsg])
                setSendError(errorText)
                return
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to send message"

            const existing = getMessagesBySession(targetSessionId)
            setMessages(targetSessionId, existing.filter((m) => m.id !== localId))
            setDraft(targetSessionId, text)

            let errorText = "Network error. Please check your connection and try again."
            if (message.includes("Network request failed") || message.includes("timeout")) {
                errorText = "Connection failed. The server may be unreachable."
            } else if (message) {
                errorText = message
            }

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
                error: { name: "UnknownError", data: { message: errorText } },
                parts: [{ type: "text", text: `Failed to send message: ${errorText}` }],
            }
            upsertMessages(targetSessionId, [errorMsg])
            setSendError(errorText)
        } finally {
            setSending(false)
        }
    }, [connection, sending, draft, selectedModel, session, selectedAgent, sessionId, isNewSession, project, upsertSession, router, projectId, clearDraft, upsertMessages, getMessagesBySession, setMessages, setDraft])

    const getAndSetMessages = useCallback(async () => {
        if (!connection?.url || !connection?.token) return
        setRefreshing(true)

        // Load only the most recent messages initially
        const raw = await getMessages(connection.url, connection.token, sessionId!, MESSAGES_PER_PAGE)
        if (raw) {
            const data =
                raw.length > 0 && "info" in raw[0]
                    ? (raw as unknown as Array<{ info: Message; parts: Part[] }>).map((m) => ({ ...m.info, parts: m.parts }))
                    : raw

            setMessages(sessionId!, data)
            
            // If we got fewer messages than requested, there are no more to load
            if (data.length < MESSAGES_PER_PAGE) {
                setHasMoreMessages(false)
            }
        }
        setRefreshing(false)
        setInitialMessagesLoaded(true)
    }, [connection, sessionId, setMessages])

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
                
                // If we got fewer messages than requested, there are no more to load
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
        if (session && !isNewSession) getAndSetMessages()
    }, [session?.id])

    useEffect(() => {
        if (connection) fetchAgents(connection.url, connection.token)
    }, [connection?.id])

    useFocusEffect(
        useCallback(() => {
            const currentModelByAgent = useChatStore.getState().modelByAgent
            if (session?.model) {
                setSelectedModel({ id: session.model.id, providerID: session.model.providerID, variant: session.model.variant })
                setModelByAgent(selectedAgent, { id: session.model.id, providerID: session.model.providerID, variant: session.model.variant })
            } else if (storedModel) {
                setSelectedModel({ id: storedModel.id, providerID: storedModel.providerID, variant: storedModel.variant })
                setModelByAgent(selectedAgent, storedModel)
            } else {
                const agentModel = currentModelByAgent[selectedAgent]
                if (agentModel) {
                    setSelectedModel({ id: agentModel.id, providerID: agentModel.providerID, variant: agentModel.variant })
                }
            }
        }, [selectedAgent, session?.model?.id, session?.model?.providerID, session?.model?.variant, storedModel])
    )

    useEffect(() => {
        if (connection) fetchAll(connection.url, connection.token)
    }, [connection?.id])

    useEffect(() => {
        if (isAtBottom && messages.length > 0) {
            requestAnimationFrame(() => {
                scrollRef.current?.scrollToOffset({ offset: 0, animated: false })
            })
        }
    }, [messages, isAtBottom])

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

    const renderItem = useCallback(
        ({ item }: { item: Message }) => (
            <MessageItem
                message={item}
                theme={theme}
                projectId={projectId}
                sessionId={sessionId}
                pendingQuestions={pendingQuestions}
                onQuestionReply={handleQuestionReply}
                onQuestionReject={handleQuestionReject}
            />
        ),
        [theme, projectId, sessionId, pendingQuestions, handleQuestionReply, handleQuestionReject]
    )

    const keyExtractor = useCallback((item: Message) => item.id, [])

    const ListHeaderComponent = useMemo(() => {
        if (!isLoadingMore) return null
        return (
            <View className="flex flex-col gap-0 p-4">
                <ActivityIndicator size="small" color={THEME[theme].mutedForeground} />
            </View>
        )
    }, [isLoadingMore, theme])

    const ListFooterComponent = useMemo(() => {
        if (!isStreaming) return null
        return (
            <View className="flex flex-col gap-0 p-4">
                <TypingDots />
            </View>
        )
    }, [isStreaming])

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

    const handleModelSelect = useCallback((model: { id: string; providerID: string; variant?: string }) => {
        setSelectedModel(model)
    }, [])

    const handleVariantSelect = useCallback((variant: string) => {
        setSelectedModel((prev) =>
            prev ? { ...prev, variant } : prev
        )
    }, [])

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
                projectWorktree={project?.worktree}
                theme={theme}
                paddingTop={insets.top}
            />

            {connectionStatus === "connecting" && (
                <View className="flex-row items-center gap-2 px-4 py-1.5 bg-accent/50 border-b border-accent">
                    <ActivityIndicator size="small" color={THEME[theme].mutedForeground} />
                    <Text className="text-xs text-muted-foreground">Connecting...</Text>
                </View>
            )}

            {messages.length > 0 ? (
                <FlatList
                    ref={scrollRef}
                    data={[...messages].reverse()}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    onContentSizeChange={scrollToBottomOnLoad}
                    onScroll={handleScroll}
                    scrollEventThrottle={150}
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={() => Keyboard.dismiss()}
                    className="flex-1 px-4 pt-2"
                    contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    ListHeaderComponent={ListHeaderComponent}
                    ListFooterComponent={ListFooterComponent}
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
                <View className="absolute left-0 right-0" style={{ bottom: insets.bottom + 150 }}>
                    <View className="items-center">
                        <Button variant="secondary" size="xs" className="rounded-full shadow-md" onPress={scrollToBottom}>
                            <ArrowDownIcon size={12} color={THEME[theme].foreground} />
                            <Text className="text-xs">Scroll to bottom</Text>
                        </Button>
                    </View>
                </View>
            )}

            {sendError && (
                <View className="px-4">
                    <View className="flex-row items-center gap-2 p-3 rounded-xl bg-destructive/15 border border-destructive/30">
                        <TriangleAlertIcon size={14} color={THEME[theme].destructive ?? "#ef4444"} />
                        <Text className="text-sm text-destructive flex-1" numberOfLines={2}>
                            {sendError}
                        </Text>
                        <Pressable onPress={() => setSendError(null)} hitSlop={8}>
                            <XIcon size={12} color={THEME[theme].mutedForeground} />
                        </Pressable>
                    </View>
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
                modelByAgent={modelByAgent}
                onModelSelect={handleModelSelect}
                onVariantSelect={handleVariantSelect}
                onSessionModelUpdate={handleSessionModelUpdate}
            />
        </View>
    )
}
