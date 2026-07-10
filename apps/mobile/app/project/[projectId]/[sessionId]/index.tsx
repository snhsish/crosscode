import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Project, useProjects } from "@/store/projects.store"
import { useEffect, useRef, useState } from "react"
import { Session, useSessions } from "@/store/sessions.store"
import { getSessionsByProjectDir } from "@/lib/sessions"
import { Connection, useConnections } from "@/store/connection.store"
import { Message, Part, useMessages } from "@/store/messages.store"
import { useAgents } from "@/store/agents.store"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, SendIcon } from "lucide-react-native"
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
    const { sessions, upsertSessions } = useSessions()
    const { getMessagesBySession, upsertMessages } = useMessages()
    const { agents, fetchAgents } = useAgents()

    const [project, setProject] = useState<Project | null>(null)
    const [projectSessions, setProjectSessions] = useState<Session[]>([])
    const [session, setSession] = useState<Session | null>(null)
    const [connection, setConnection] = useState<Connection | null>(null)
    const [refreshing, setRefreshing] = useState<boolean>(false)

    const [selectedAgent, setSelectedAgent] = useState<string>("build")
    const [message, setMessage] = useState<string>("")

    const ref = useRef<TriggerRef>(null)
    const contentInsets = {
        top: insets.top,
        bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }),
        left: 12,
        right: 12,
    }
    const theme = colorScheme ?? "light"

    // chat stream
    useEventStream(connection?.url, sessionId, connection?.token)
    const messages = getMessagesBySession(sessionId)
    const isStreaming = useChatStore((s) => s.streamingBySession[sessionId] ?? false)
    const connectionStatus = useChatStore((s) => s.connectionStatus)
    const draft = useChatStore((s) => s.draftBySession[sessionId] ?? "")
    const setDraft = useChatStore((s) => s.setDraft)
    const clearDraft = useChatStore((s) => s.clearDraft)

    function sendMessage() {
        if (!connection || !connection.url) return

        const text = draft.trim()
        if (!text) return
        clearDraft(sessionId)

        const now = Date.now()
        const userMsg: Message = {
            id: `local-${now}`,
            sessionID: sessionId,
            role: "user",
            time: { created: now },
            agent: selectedAgent,
            model: {
                providerID: "...",
                modelID: "..."
            },
            parts: [{ type: "text", text }],
        }

        upsertMessages(sessionId, [userMsg])

        const baseUrl = connection.url.replace(/\/+$/, "")
        fetch(`${baseUrl}/session/${sessionId}/message`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(`opencode:${connection.token}`)}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                parts: [{ type: "text", text }],
            }),
        }).catch((err) => {
            console.error("Failed to send message:", err)
        })
    }


    const getAndSetSessions = async () => {
        if (!connection || !connection.url || !connection.token || !project) return
        setRefreshing(true)

        const data = await getSessionsByProjectDir(connection.url, connection.token, project.worktree)
        if (data)
            upsertSessions(data)
        setRefreshing(false)
    }

    const getAndSetMessages = async () => {
        if (!connection || !connection.url || !connection.token || !project || !session) return
        setRefreshing(true)

        const baseUrl = connection.url.replace(/\/+$/, "")
        const raw = await getMessages(baseUrl, connection.token, sessionId)

        if (raw) {
            const data = raw.length > 0 && "info" in raw[0]
                ? (raw as unknown as Array<{ info: Message; parts: Part[] }>).map((m) => ({ ...m.info, parts: m.parts }))
                : raw

            const existing = getMessagesBySession(sessionId)
            const nonLocal = existing.filter(m => !m.id.startsWith("local-"))
            const existingIds = new Set(nonLocal.map(m => m.id))
            const deduped = data.filter(m => !existingIds.has(m.id))

            upsertMessages(sessionId, [...nonLocal, ...deduped])
        }
        setRefreshing(false)
    }

    useEffect(() => {
        const c = connections.find((c) => c.id === current)
        if (c) {
            setConnection(c)
        }
    }, [connections, current])

    useEffect(() => {
        if (!connection || !connection.url || !connection.token) return

        const currentProject = projects.find((p) => p.id === projectId)

        if (!currentProject) return

        setProject(currentProject)
    }, [connection, projects, projectId])

    useEffect(() => {
        const currentSessions = sessions.filter(s => s.projectID === projectId)
        setProjectSessions(currentSessions)
    }, [sessions])

    useEffect(() => {
        if (project) {
            getAndSetSessions()
        }
    }, [project])

    useEffect(() => {
        const currentSession = projectSessions.find((s) => s.id === sessionId)

        if (currentSession) {
            setSession(currentSession)
        }
    }, [projectSessions])

    useEffect(() => {
        if (session) {
            getAndSetMessages()
        }
    }, [session, connection, project])

    useEffect(() => {
        if (!connection) return
        fetchAgents(connection.url, connection.token)
    }, [connection])

    // if (!project) return <View></View>

    return (
        <KeyboardAvoidingView behavior="padding" className="flex-1">
            <View className="flex-1 bg-background">
                <View className="flex flex-row gap-2 items-center border-b border-accent pb-2 px-4" style={{ paddingTop: insets.top + 10 }}>
                    <Button variant="ghost" className="w-10 h-10 text-white" onPress={() => router.push(`/project/${projectId}`)}>
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

                <ScrollView keyboardShouldPersistTaps="handled" className="flex-1 px-4 pt-2">
                    <View className="gap-2 pb-56">
                        {
                            messages.map((message, i) => (
                                <View
                                    key={i}
                                    className={
                                        cn(
                                            "flex flex-col gap-0 p-4 rounded-xl",
                                            message.role === "user" ? "ml-auto max-w-[300px] bg-secondary/75 rounded-3xl" : null,
                                        )
                                    }
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
                            ))
                        }

                        {
                            isStreaming && (
                                <View className={cn("flex flex-col gap-0 p-4")}>
                                    <TypingDots />
                                </View>
                            )
                        }
                    </View>
                </ScrollView>

                <View className="absolute bottom-0 left-0 right-0 p-4">
                    <View className="p-2 rounded-3xl bg-accent">
                        <Textarea
                            placeholder={`Ask anything... "Fix broken tests"`}
                            style={{ borderWidth: 0, backgroundColor: "transparent" }}
                            className="w-full"
                            onChangeText={(t) => setDraft(sessionId, t)}
                        />

                        <View className="flex flex-row justify-between items-center">
                            <Select
                                defaultValue={{ value: selectedAgent, label: capitalize(selectedAgent) }}
                                onValueChange={(option) => setSelectedAgent(option?.value ?? "plan")}

                            >
                                <AgentSelectTrigger ref={ref} className="w-fit">
                                    <SelectValue placeholder="Select an agent" />
                                </AgentSelectTrigger>
                                <SelectContent insets={contentInsets}>
                                    <SelectGroup>
                                        <SelectLabel>Agents</SelectLabel>
                                        {agents.map((agent) => (
                                            <SelectItem key={agent.name} label={capitalize(agent.name)} value={agent.name} className="capitalize!" >
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
                            >
                                <SendIcon
                                    size={20} color={THEME[theme].background}
                                />
                            </Button>
                        </View>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}