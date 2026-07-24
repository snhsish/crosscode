import { ActivityIndicator, BackHandler, Keyboard, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, View } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { useFocusEffect, useLocalSearchParams, useRouter, useNavigation } from "expo-router"
import { useProjects } from "@/store/projects.store"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSessions } from "@/store/sessions.store"
import { useConnections } from "@/store/connection.store"
import { Message, Part, useMessages } from "@/store/messages.store"
import { useAgents } from "@/store/agents.store"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Button } from "@/components/ui/button"
import { ArrowDownIcon, ArrowLeftIcon, CameraIcon, ChevronDownIcon, CpuIcon, FilesIcon, ImageIcon, MessageCircleIcon, PlusIcon, SendIcon, VideoIcon, XIcon } from "lucide-react-native"
import { useColorScheme } from "nativewind"
import { THEME } from "@/lib/theme"
import { Text } from "@/components/ui/text"
import { getMessages } from "@/lib/messages"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TriggerRef } from "@rn-primitives/select"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "@/components/markdown"
import { AgentSelectTrigger } from "@/components/agent-mode-select"
import { useEventStream } from "@/components/hooks/event-stream"
import { useChatStore } from "@/store/chat.store"
import { useModels } from "@/store/models.store"
import { TypingDots } from "@/components/typing-animation"
import { ReasoningBlock } from "@/components/reasoning-block"
import { TodoBlock, TodoItem } from "@/components/todo-block"
import { ToolBlock } from "@/components/tool-block"

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const ATTACHMENT_OPTIONS = [
    { icon: ImageIcon, label: "Image" },
    { icon: VideoIcon, label: "Video" },
    { icon: FilesIcon, label: "Files" },
    { icon: CameraIcon, label: "Camera" },
] as const

function extractTodos(result: unknown): TodoItem[] | null {
  if (!result || typeof result !== "object") return null

  const r = result as Record<string, unknown>

  const metadata = r.metadata
  if (metadata && typeof metadata === "object") {
    const todos = (metadata as Record<string, unknown>).todos
    if (Array.isArray(todos) && todos.length > 0) {
      return todos as TodoItem[]
    }
  }

  if (Array.isArray(r.todos)) {
    return r.todos as TodoItem[]
  }

  if (typeof r.output === "string") {
    try {
      const parsed = JSON.parse(r.output)
      if (Array.isArray(parsed)) {
        return parsed as TodoItem[]
      }
    } catch {}
  }

  return null
}

export default function SessionScreen() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const { projectId, sessionId } = useLocalSearchParams<{ projectId: string, sessionId: string }>()
    const { connections, current } = useConnections()
    const { projects } = useProjects()
    const { sessions } = useSessions()
    const { getMessagesBySession, upsertMessages, setMessages } = useMessages()
    const { agents, fetchAgents } = useAgents()

    const [selectedAgent, setSelectedAgent] = useState("build")
    const [selectedModel, setSelectedModel] = useState<{ id: string; providerID: string } | null>(null)
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [isAtBottom, setIsAtBottom] = useState(true)
    const [sending, setSending] = useState(false)

    const ref = useRef<TriggerRef>(null)
    const scrollRef = useRef<ScrollView>(null)

    const keyboardHeight = useSharedValue(0)
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
    const attachmentMenuHeight = useSharedValue(0)
    const navigation = useNavigation()

    useEffect(() => {
        const showListener = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (e) => {
            keyboardHeight.value = withTiming(e.endCoordinates.height, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            })
            setIsKeyboardVisible(true)
        })
        const hideListener = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => {
            keyboardHeight.value = withTiming(0, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            })
            setIsKeyboardVisible(false)
        })
        return () => {
            showListener.remove()
            hideListener.remove()
        }
    }, [])

    const hideAttachmentMenu = useCallback(() => {
        attachmentMenuHeight.value = withTiming(0, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
        })
        setShowAttachmentMenu(false)
    }, [])

    const toggleAttachmentMenu = useCallback(() => {
        if (showAttachmentMenu) {
            hideAttachmentMenu()
        } else {
            Keyboard.dismiss()
            setShowAttachmentMenu(true)
            attachmentMenuHeight.value = withTiming(200, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            })
        }
    }, [showAttachmentMenu, hideAttachmentMenu])

    useEffect(() => {
        if (!showAttachmentMenu) return
        const onBackPress = () => {
            hideAttachmentMenu()
            return true
        }
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress)
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            e.preventDefault()
            hideAttachmentMenu()
        })
        return () => {
            backHandler.remove()
            unsubscribe()
        }
    }, [showAttachmentMenu, navigation, hideAttachmentMenu])

    const animatedInputStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -keyboardHeight.value }],
    }))

    const animatedScrollContentStyle = useAnimatedStyle(() => ({
        paddingBottom: keyboardHeight.value + attachmentMenuHeight.value + 140,
    }))

    const connection = connections.find((c) => c.id === current) ?? null
    const project = projects.find((p) => p.id === projectId) ?? null
    const session = sessions.find((s) => s.id === sessionId) ?? null

    const scrollToBottomOnLoad = useCallback(() => {
        if (scrollRef.current && !initialMessagesLoaded) {
            scrollRef.current.scrollToEnd({ animated: false })
            setInitialMessagesLoaded(true)
        }
    }, [initialMessagesLoaded])

    const scrollToBottom = useCallback(() => {
        scrollRef.current?.scrollToEnd({ animated: true })
    }, [])

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
        const threshold = 100
        const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - threshold
        setIsAtBottom(atBottom)
    }, [])

    const contentInsets = {
        top: insets.top,
        bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }),
        left: 12,
        right: 12,
    }
    const theme = colorScheme ?? "light"

    useEventStream(connection?.url, sessionId, connection?.token)
    const messages = getMessagesBySession(sessionId)
    const isStreaming = useChatStore((s) => s.streamingBySession[sessionId] ?? false)
    const draft = useChatStore((s) => s.draftBySession[sessionId] ?? "")
    const setDraft = useChatStore((s) => s.setDraft)
    const clearDraft = useChatStore((s) => s.clearDraft)
    const modelByAgent = useChatStore((s) => s.modelByAgent)
    const setModelByAgent = useChatStore((s) => s.setModelByAgent)
    const storedModel = useChatStore((s) => s.modelBySession[sessionId])

    async function sendMessage() {
        if (!connection?.url || sending) return

        const text = draft.trim()
        if (!text) return
        clearDraft(sessionId)
        setSending(true)

        const now = Date.now()
        const modelId = selectedModel?.id ?? session?.model?.id
        const providerId = selectedModel?.providerID ?? session?.model?.providerID

        const userMsg: Message = {
            id: `local-${now}`,
            sessionID: sessionId,
            role: "user",
            time: { created: now },
            agent: selectedAgent,
            model: { providerID: providerId ?? "...", modelID: modelId ?? "..." },
            parts: [{ type: "text", text }],
        }

        upsertMessages(sessionId, [userMsg])

        try {
            const body: Record<string, unknown> = { parts: [{ type: "text", text }], agent: selectedAgent }
            if (modelId && providerId) {
                body.model = { id: modelId, providerID: providerId }
            }
            await fetch(`${connection.url}/session/${sessionId}/message`, {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${btoa(`opencode:${connection.token}`)}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body),
            })
        } catch (err) {
            console.error("Failed to send message:", err)
        } finally {
            setSending(false)
        }
    }

    const getAndSetMessages = useCallback(async () => {
        if (!connection?.url || !connection?.token) return
        setRefreshing(true)

        const raw = await getMessages(connection.url, connection.token, sessionId)
        if (raw) {
            const data = raw.length > 0 && "info" in raw[0]
                ? (raw as unknown as Array<{ info: Message; parts: Part[] }>).map((m) => ({ ...m.info, parts: m.parts }))
                : raw

            const existing = getMessagesBySession(sessionId)
            const nonLocal = existing.filter(m => !m.id.startsWith("local-"))
            const existingIds = new Set(nonLocal.map(m => m.id))
            const deduped = data.filter(m => !existingIds.has(m.id))

            setMessages(sessionId, [...nonLocal, ...deduped])
        }
        setRefreshing(false)
        setInitialMessagesLoaded(true)
    }, [connection, sessionId, getMessagesBySession, upsertMessages])

    useEffect(() => {
        if (session) getAndSetMessages()
    }, [session?.id])

    useEffect(() => {
        if (connection) fetchAgents(connection.url, connection.token)
    }, [connection?.id])

    const { models, fetchAll } = useModels()

    useFocusEffect(
        useCallback(() => {
            const currentModelByAgent = useChatStore.getState().modelByAgent
            if (session?.model) {
                setSelectedModel({ id: session.model.id, providerID: session.model.providerID })
                setModelByAgent(selectedAgent, { id: session.model.id, providerID: session.model.providerID })
            } else if (storedModel) {
                setSelectedModel({ id: storedModel.id, providerID: storedModel.providerID })
                setModelByAgent(selectedAgent, storedModel)
            } else {
                const agentModel = currentModelByAgent[selectedAgent]
                if (agentModel) {
                    setSelectedModel({ id: agentModel.id, providerID: agentModel.providerID })
                }
            }
        }, [selectedAgent, session?.model?.id, session?.model?.providerID, storedModel])
    )

    useEffect(() => {
        if (connection) fetchAll(connection.url, connection.token)
    }, [connection?.id])

    useEffect(() => {
        if (isAtBottom && messages.length > 0) {
            scrollRef.current?.scrollToEnd({ animated: false })
        }
    }, [messages.length, isAtBottom])

    return (
        <View className="flex-1 bg-background">
                <View className="flex flex-row gap-2 items-center border-b border-accent pb-2 px-4" style={{ paddingTop: insets.top + 10 }}>
                    <Button variant="ghost" className="w-10 h-10 text-white" onPress={() => router.push("/sessions")}>
                        <ArrowLeftIcon size={20} color={THEME[theme].foreground} />
                    </Button>

                    <View className="flex flex-1 flex-col gap-0">
                        <Text className="text-base font-semibold tracking-tight line-clamp-1">
                            {(session?.title && session.title.length > 40) ? session?.title.slice(0, 37) + "..." : session?.title}
                        </Text>
                        <Text className="text-xs tracking-tight line-clamp-1 text-muted-foreground">
                            {project?.name ?? project?.worktree}
                        </Text>
                    </View>

                    <Pressable
                        className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/60 active:bg-accent border border-border/50"
                        onPress={() =>
                            router.push(
                                `/project/${projectId}/${sessionId}/models?currentModelId=${selectedModel?.id ?? ""}&currentProviderId=${selectedModel?.providerID ?? ""}`
                            )
                        }
                    >
                        <CpuIcon size={13} color={THEME[theme].mutedForeground} />
                        <Text className="text-xs text-muted-foreground max-w-[100px]" numberOfLines={1}>
                            {selectedModel?.id ?? "Model"}
                        </Text>
                        <ChevronDownIcon size={12} color={THEME[theme].mutedForeground} />
                    </Pressable>
                </View>

                {refreshing && messages.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={THEME[theme].mutedForeground} />
                        <Text className="text-xs text-muted-foreground mt-3">Loading messages...</Text>
                    </View>
                ) : messages.length === 0 ? (
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
                ) : (
                    <ScrollView
                        ref={scrollRef}
                        onContentSizeChange={scrollToBottomOnLoad}
                        onScroll={onScroll}
                        scrollEventThrottle={16}
                        keyboardShouldPersistTaps="handled"
                        onScrollBeginDrag={() => Keyboard.dismiss()}
                        className="flex-1 px-4 pt-2"
                    >
                        <Animated.View className="gap-2" style={animatedScrollContentStyle}>
                            {messages.map((message, i) => (
                                <View
                                    key={i}
                                    className={cn(
                                        "flex flex-col gap-1.5 p-4 rounded-xl",
                                        message.role === "user" ? "ml-auto max-w-[300px] bg-secondary/75 rounded-3xl" : null,
                                    )}
                                >
                                    {message.parts?.map((part, j) => {
                                        switch (part.type) {
                                            case "text":
                                                return (
                                                    <MarkdownRenderer key={part.id ?? j}>
                                                        {part.text}
                                                    </MarkdownRenderer>
                                                )
                                            case "reasoning":
                                                const duration = message.role === "assistant" && "completed" in message.time && message.time.completed
                                                    ? (message.time.completed - message.time.created) / 1000
                                                    : undefined
                                                return (
                                                    <ReasoningBlock
                                                        key={part.id ?? j}
                                                        text={part.text}
                                                        duration={duration}
                                                    />
                                                )
                                            case "tool-invocation":
                                                if (
                                                    part.toolInvocation.state === "result" &&
                                                    (part.toolInvocation.toolName === "todowrite" || part.toolInvocation.toolName === "todo")
                                                ) {
                                                    const items = extractTodos(part.toolInvocation.result)
                                                    if (items && items.length > 0) {
                                                        return <TodoBlock key={part.id ?? j} items={items} />
                                                    }
                                                }
                                                const tiDetails: { label: string; content: unknown }[] = []
                                                if (part.toolInvocation.args) {
                                                    tiDetails.push({ label: "Args", content: part.toolInvocation.args })
                                                }
                                                if (part.toolInvocation.result) {
                                                    tiDetails.push({ label: "Result", content: part.toolInvocation.result })
                                                }
                                                if (part.toolInvocation.error) {
                                                    tiDetails.push({ label: "Error", content: part.toolInvocation.error })
                                                }
                                                return (
                                                    <ToolBlock
                                                        key={part.id ?? j}
                                                        name={part.toolInvocation.toolName}
                                                        status={part.toolInvocation.state}
                                                        details={tiDetails.length > 0 ? tiDetails : undefined}
                                                    />
                                                )
                                            case "tool":
                                                return (
                                                    <ToolBlock
                                                        key={part.id ?? j}
                                                        name={part.tool}
                                                        status={part.state?.status ?? "unknown"}
                                                    />
                                                )
                                            case "source-url":
                                                return (
                                                    <Text key={part.id ?? j} className="text-xs underline decoration-dotted">
                                                        {part.title ?? part.url}
                                                    </Text>
                                                )
                                            case "file":
                                                return (
                                                    <Text key={part.id ?? j} className="text-xs text-muted-foreground">
                                                        File: <Text className="underline">{part.filename ?? part.url}</Text>
                                                    </Text>
                                                )
                                            case "step-start":
                                                return null
                                            case "step-finish":
                                                return null
                                        }
                                    })}
                                </View>
                            ))}

                            {isStreaming && (
                                <View className={cn("flex flex-col gap-0 p-4")}>
                                    <TypingDots />
                                </View>
                            )}
                        </Animated.View>
                    </ScrollView>
                )}

                {!isAtBottom && messages.length > 0 && (
                    <View className="absolute left-0 right-0" style={{ bottom: insets.bottom + 150 }}>
                        <View className="items-center">
                            <Button
                                variant="secondary"
                                size="xs"
                                className="rounded-full shadow-md"
                                onPress={scrollToBottom}
                            >
                                <ArrowDownIcon size={12} color={THEME[theme].foreground} />
                                <Text className="text-xs">Scroll to bottom</Text>
                            </Button>
                        </View>
                    </View>
                )}

                <Animated.View style={animatedInputStyle}>
                    <View className="p-4 !bg-transparent" style={{ paddingBottom: insets.bottom + 16 }}>
                        <View className="p-2 rounded-3xl bg-accent">
                            <Textarea
                                placeholder={`Ask anything... "Fix broken tests"`}
                                style={{ borderWidth: 0, backgroundColor: "transparent" }}
                                className="w-full"
                                value={draft}
                                onChangeText={(t) => setDraft(sessionId, t)}
                                blurOnSubmit={false}
                                returnKeyType="default"
                            />

                            <View className="flex flex-row justify-between items-center">
                                <View className="flex flex-row items-center gap-1">
                                    <Button variant="ghost" size="icon" className="w-9 h-9" onPress={toggleAttachmentMenu}>
                                        {showAttachmentMenu ? <XIcon size={20} color={THEME[theme].foreground} /> : <PlusIcon size={20} color={THEME[theme].foreground} />}
                                    </Button>
                                    <Select
                                    defaultValue={{ value: selectedAgent, label: capitalize(selectedAgent) }}
                                    onValueChange={(option) => {
                                        const agent = option?.value ?? "plan"
                                        setSelectedAgent(agent)
                                        const agentModel = modelByAgent[agent]
                                        if (agentModel) {
                                            setSelectedModel({ id: agentModel.id, providerID: agentModel.providerID })
                                        }
                                    }}
                                >
                                    <AgentSelectTrigger ref={ref} className="w-fit">
                                        <SelectValue placeholder="Select an agent" />
                                    </AgentSelectTrigger>
                                    <SelectContent insets={contentInsets} side={isKeyboardVisible ? "top" : "bottom"}>
                                        <SelectGroup>
                                            <SelectLabel>Agents</SelectLabel>
                                            {agents.map((agent) => (
                                                <SelectItem key={agent.name} label={capitalize(agent.name)} value={agent.name} className="capitalize!">
                                                    {capitalize(agent.name)}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                </View>

                                <Button
                                    className="rounded-full"
                                    size="icon"
                                    onPress={sendMessage}
                                    disabled={sending || !draft.trim()}
                                >
                                    <SendIcon size={20} color={THEME[theme].background} />
                                </Button>
                            </View>
                        </View>
                        {showAttachmentMenu && (
                            <View className="mt-2 rounded-2xl bg-card border border-border overflow-hidden">
                                <View className="flex-row flex-wrap">
                                    {ATTACHMENT_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option.label}
                                            disabled
                                            className="w-1/2 items-center justify-center py-4 opacity-40"
                                        >
                                            <View className="w-12 h-12 rounded-2xl bg-secondary/70 items-center justify-center mb-1.5">
                                                <option.icon size={22} color={THEME[theme].foreground} />
                                            </View>
                                            <Text className="text-xs text-muted-foreground">{option.label}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </View>
    );
}
