import { ActivityIndicator, Keyboard, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, View } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useProjects } from "@/store/projects.store"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSessions } from "@/store/sessions.store"
import { useConnections } from "@/store/connection.store"
import { Message, Part, useMessages } from "@/store/messages.store"
import { useAgents } from "@/store/agents.store"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Button } from "@/components/ui/button"
import { ArrowDownIcon, ArrowLeftIcon, SendIcon } from "lucide-react-native"
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
import { TypingDots } from "@/components/typing-animation"

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

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
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [isAtBottom, setIsAtBottom] = useState(true)
    const [sending, setSending] = useState(false)

    const ref = useRef<TriggerRef>(null)
    const scrollRef = useRef<ScrollView>(null)

    const keyboardHeight = useSharedValue(0)
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" as const : "keyboardDidShow" as const
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" as const : "keyboardDidHide" as const

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setIsKeyboardVisible(true)
            keyboardHeight.value = withTiming(e.endCoordinates.height, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            })
        })
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setIsKeyboardVisible(false)
            keyboardHeight.value = withTiming(0, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            })
        })
        return () => { showSub.remove(); hideSub.remove() }
    }, [])

    const animatedInputStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -keyboardHeight.value }],
    }))

    const animatedScrollContentStyle = useAnimatedStyle(() => ({
        paddingBottom: keyboardHeight.value + 140,
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

    async function sendMessage() {
        if (!connection?.url || sending) return

        const text = draft.trim()
        if (!text) return
        clearDraft(sessionId)
        setSending(true)

        const now = Date.now()
        const userMsg: Message = {
            id: `local-${now}`,
            sessionID: sessionId,
            role: "user",
            time: { created: now },
            agent: selectedAgent,
            model: { providerID: "...", modelID: "..." },
            parts: [{ type: "text", text }],
        }

        upsertMessages(sessionId, [userMsg])

        try {
            await fetch(`${connection.url}/session/${sessionId}/message`, {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${btoa(`opencode:${connection.token}`)}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ parts: [{ type: "text", text }], agent: selectedAgent }),
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

                    <View className="flex flex-col gap-0">
                        <Text className="text-base font-semibold tracking-tight line-clamp-1">
                            {(session?.title && session.title.length > 40) ? session?.title.slice(0, 37) + "..." : session?.title}
                        </Text>
                        <Text className="text-xs tracking-tight line-clamp-1 text-muted-foreground">
                            {project?.name ?? project?.worktree}
                        </Text>
                    </View>
                </View>

                {refreshing && messages.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={THEME[theme].mutedForeground} />
                        <Text className="text-xs text-muted-foreground mt-3">Loading messages...</Text>
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
                                        "flex flex-col gap-0 p-4 rounded-xl",
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
                                                return (
                                                    <Text key={part.id ?? j} className="text-xs text-muted-foreground italic">
                                                        {part.text}
                                                    </Text>
                                                )
                                            case "tool-invocation":
                                                return (
                                                    <View key={part.id ?? j} className="flex-row items-center gap-1">
                                                        <Text className="text-xs text-muted-foreground">
                                                            Tool: <Text className="underline">{part.toolInvocation.toolName}</Text>
                                                        </Text>
                                                    </View>
                                                )
                                            case "tool":
                                                return (
                                                    <View key={part.id ?? j} className="flex-row items-center gap-1">
                                                        <Text className="text-xs text-muted-foreground">
                                                            Tool: <Text className="underline">{part.tool}</Text>
                                                            {part.state ? <Text> ({part.state.status})</Text> : null}
                                                        </Text>
                                                    </View>
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
                                <Select
                                    defaultValue={{ value: selectedAgent, label: capitalize(selectedAgent) }}
                                    onValueChange={(option) => setSelectedAgent(option?.value ?? "plan")}
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
                    </View>
                </Animated.View>
            </View>
    );
}
