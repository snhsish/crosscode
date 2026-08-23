import { memo, useState, useRef, useCallback } from "react"
import { View, Pressable, Modal, Dimensions } from "react-native"
import { Image } from "expo-image"
import * as Clipboard from "expo-clipboard"
import TriangleAlertIcon from "lucide-react-native/dist/esm/icons/triangle-alert"
import RotateCcwIcon from "lucide-react-native/dist/esm/icons/rotate-ccw"
import CopyIcon from "lucide-react-native/dist/esm/icons/copy"
import PenLineIcon from "lucide-react-native/dist/esm/icons/pen-line"
import GitBranchIcon from "lucide-react-native/dist/esm/icons/git-branch"
import { useRouter } from "expo-router"
import { Message, Part } from "@/store/messages.store"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { Text } from "@/components/ui/text"
import MemoMarkdown from "@/components/memo-markdown"
import { ReasoningBlock } from "@/components/reasoning-block"
import { TodoBlock, TodoItem } from "@/components/todo-block"
import { ToolBlock } from "@/components/tool-block"
import { BashBlock } from "@/components/bash-block"
import { EditBlock } from "@/components/edit-block"
import { QuestionBlock } from "@/components/question-block"
import { PermissionBlock } from "@/components/permission-block"
import { QuestionRequest } from "@/store/questions.store"
import { PermissionRequest } from "@/store/permissions.store"
import { revertMessage, forkSession } from "@/lib/sessions"
import { useConnections } from "@/store/connection.store"
import { useSessions } from "@/store/sessions.store"
import { useModels } from "@/store/models.store"
import { useSelectiveCopy } from "@/store/selective-copy.store"

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

interface MessageItemProps {
    message: Message
    theme: "light" | "dark"
    projectId: string
    sessionId: string
    pendingQuestions?: QuestionRequest[]
    onQuestionReply?: (requestId: string, answers: string[][]) => void
    onQuestionReject?: (requestId: string) => void
    pendingPermissions?: PermissionRequest[]
    onPermissionReply?: (requestId: string, reply: "once" | "always" | "reject", message?: string) => void
}

function getErrorLabel(name?: string): string {
    switch (name) {
        case "ProviderAuthError": return "Authentication Error"
        case "MessageOutputLengthError": return "Output Too Long"
        case "MessageAbortedError": return "Request Aborted"
        case "APIError": return "API Error"
        case "NetworkError": return "Network Error"
        default: return "Error"
    }
}

function getErrorHint(name?: string): string | undefined {
    switch (name) {
        case "ProviderAuthError": return "Check your API key or credentials"
        case "MessageOutputLengthError": return "Try a shorter prompt"
        case "APIError": return "Try switching to a different model"
        case "NetworkError": return "Check your connection"
        default: return undefined
    }
}

function PartRenderer({ part, index, message, theme, projectId, sessionId, pendingQuestions, onQuestionReply, onQuestionReject, pendingPermissions, onPermissionReply, streaming }: { part: Part; index: number; message: Message; theme: "light" | "dark"; projectId: string; sessionId: string; pendingQuestions?: QuestionRequest[]; onQuestionReply?: (requestId: string, answers: string[][]) => void; onQuestionReject?: (requestId: string) => void; pendingPermissions?: PermissionRequest[]; onPermissionReply?: (requestId: string, reply: "once" | "always" | "reject", message?: string) => void; streaming?: boolean }) {
    switch (part.type) {
        case "text":
            return <MemoMarkdown key={part.id ?? index} theme={theme} streaming={streaming}>{part.text}</MemoMarkdown>
        case "reasoning":
            return null
        case "tool-invocation":
            if (
                part.toolInvocation.state === "result" &&
                (part.toolInvocation.toolName === "todowrite" || part.toolInvocation.toolName === "todo")
            ) {
                const items = extractTodos(part.toolInvocation.result)
                if (items && items.length > 0) {
                    return <TodoBlock key={part.id ?? index} items={items} />
                }
            }
            if (part.toolInvocation.toolName === "question") {
                if (pendingQuestions && pendingQuestions.length > 0) {
                    const matchingQuestion = pendingQuestions.find(
                        (q) => q.tool?.messageID === message.id && q.tool?.callID === part.toolInvocation.toolCallId
                    )
                    if (matchingQuestion && onQuestionReply && onQuestionReject) {
                        return (
                            <QuestionBlock
                                key={part.id ?? index}
                                request={matchingQuestion}
                                theme={theme}
                                onReply={onQuestionReply}
                                onReject={onQuestionReject}
                            />
                        )
                    }
                }
            }
            if (pendingPermissions && pendingPermissions.length > 0) {
                const matchingPermission = pendingPermissions.find(
                    (p) => p.tool?.messageID === message.id && p.tool?.callID === part.toolInvocation.toolCallId
                )
                if (matchingPermission && onPermissionReply) {
                    return (
                        <PermissionBlock
                            key={part.id ?? index}
                            request={matchingPermission}
                            theme={theme}
                            onReply={onPermissionReply}
                        />
                    )
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
            let bashCommand: string | undefined
            let bashOutput: string | undefined
            let bashWorkdir: string | undefined
            let bashDescription: string | undefined
            if (part.toolInvocation.toolName === "bash" && part.toolInvocation.args && typeof part.toolInvocation.args === "object") {
                const args = part.toolInvocation.args as Record<string, unknown>
                if (typeof args.command === "string") {
                    bashCommand = args.command
                }
                if (typeof args.description === "string") {
                    bashDescription = args.description
                }
                if (typeof args.workdir === "string") {
                    bashWorkdir = args.workdir
                }
            }
            if (part.toolInvocation.result) {
                if (typeof part.toolInvocation.result === "string") {
                    bashOutput = part.toolInvocation.result
                } else if (typeof part.toolInvocation.result === "object") {
                    const r = part.toolInvocation.result as Record<string, unknown>
                    if (typeof r.output === "string") {
                        bashOutput = r.output
                    } else if (typeof r.stdout === "string") {
                        bashOutput = r.stdout
                    }
                }
            }
            if (bashCommand) {
                return (
                    <BashBlock
                        key={part.id ?? index}
                        command={bashCommand}
                        status={part.toolInvocation.state}
                        output={bashOutput}
                        workdir={bashWorkdir}
                        description={bashDescription}
                        theme={theme}
                    />
                )
            }
            if (part.toolInvocation.toolName === "edit" && part.toolInvocation.args && typeof part.toolInvocation.args === "object") {
                const args = part.toolInvocation.args as Record<string, unknown>
                const filePath = typeof args.filePath === "string" ? args.filePath : undefined
                const oldString = typeof args.oldString === "string" ? args.oldString : undefined
                const newString = typeof args.newString === "string" ? args.newString : undefined
                if (filePath && oldString !== undefined && newString !== undefined) {
                    return (
                        <EditBlock
                            key={part.id ?? index}
                            filePath={filePath}
                            oldString={oldString}
                            newString={newString}
                            status={part.toolInvocation.state}
                            theme={theme}
                            projectId={projectId}
                            sessionId={sessionId}
                        />
                    )
                }
            }
            return (
                <ToolBlock
                    key={part.id ?? index}
                    name={part.toolInvocation.toolName}
                    status={part.toolInvocation.state}
                    details={tiDetails.length > 0 ? tiDetails : undefined}
                    theme={theme}
                />
            )
        case "tool":
            if (part.tool === "question") {
                if (pendingQuestions && pendingQuestions.length > 0) {
                    const matchingQuestion = pendingQuestions.find(
                        (q) => q.tool?.messageID === message.id && q.tool?.callID === part.callID
                    )
                    if (matchingQuestion && onQuestionReply && onQuestionReject) {
                        return (
                            <QuestionBlock
                                key={part.id ?? index}
                                request={matchingQuestion}
                                theme={theme}
                                onReply={onQuestionReply}
                                onReject={onQuestionReject}
                            />
                        )
                    }
                }
            }
            if (pendingPermissions && pendingPermissions.length > 0) {
                const matchingPermission = pendingPermissions.find(
                    (p) => p.tool?.messageID === message.id && p.tool?.callID === part.callID
                )
                if (matchingPermission && onPermissionReply) {
                    return (
                        <PermissionBlock
                            key={part.id ?? index}
                            request={matchingPermission}
                            theme={theme}
                            onReply={onPermissionReply}
                        />
                    )
                }
            }
            if (part.tool === "bash" && part.state?.input) {
                const command = part.state.input.command as string | undefined
                const description = (part.state.input.description as string | undefined) ?? part.state.title
                const output = part.state.output
                if (command) {
                    return (
                        <BashBlock
                            key={part.id ?? index}
                            command={command}
                            status={part.state.status}
                            output={output}
                            description={description}
                            theme={theme}
                        />
                    )
                }
            }
            if (part.tool === "edit" && part.state?.input) {
                const filePath = part.state.input.filePath as string | undefined
                const oldString = part.state.input.oldString as string | undefined
                const newString = part.state.input.newString as string | undefined
                if (filePath && oldString !== undefined && newString !== undefined) {
                    return (
                        <EditBlock
                            key={part.id ?? index}
                            filePath={filePath}
                            oldString={oldString}
                            newString={newString}
                            status={part.state.status}
                            theme={theme}
                            projectId={projectId}
                            sessionId={sessionId}
                        />
                    )
                }
            }
            return (
                <ToolBlock
                    key={part.id ?? index}
                    name={part.tool}
                    status={part.state?.status ?? "unknown"}
                    theme={theme}
                />
            )
        case "source-url":
            return (
                <Text key={part.id ?? index} className="text-xs underline decoration-dotted">
                    {part.title ?? part.url}
                </Text>
            )
        case "file":
            if (part.mime.startsWith("image/")) {
                return (
                    <Image
                        key={part.id ?? index}
                        source={{ uri: part.url }}
                        className="w-full h-40 rounded-xl"
                        resizeMode="cover"
                    />
                )
            }
            return (
                <Text key={part.id ?? index} className="text-xs text-muted-foreground">
                    File: <Text className="underline">{part.filename ?? part.url}</Text>
                </Text>
            )
        case "step-start":
        case "step-finish":
            return null
        default:
            return null
    }
}

const MemoPartRenderer = memo(PartRenderer, (prev, next) => prev.part === next.part && prev.index === next.index && prev.message === next.message && prev.theme === next.theme && prev.projectId === next.projectId && prev.sessionId === next.sessionId && prev.pendingQuestions === next.pendingQuestions && prev.pendingPermissions === next.pendingPermissions && prev.streaming === next.streaming)

function getPlainText(message: Message): string {
    if (!message.parts) return ""
    return message.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("\n")
}

function formatTokens(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
}

function MessageMetadata({ message, theme }: { message: Message; theme: "light" | "dark" }) {
    const models = useModels((s) => s.models)
    const providers = useModels((s) => s.providers)

    if (message.role !== "assistant") return null
    if (!message.time.completed) return null

    const model = models.find((m) => m.id === message.modelID && m.providerID === message.providerID)
    const provider = providers.find((p) => p.id === message.providerID)
    const modelName = model?.name ?? message.modelID
    const providerName = provider?.name ?? message.providerID

    const totalTokens = message.tokens.input + message.tokens.output + message.tokens.reasoning + message.tokens.cache.read + message.tokens.cache.write
    const costStr = message.cost.toFixed(4)

    return (
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 pt-1.5 border-t border-border/30">
            <Text className="text-[10px] text-muted-foreground/70">
                {providerName} / {modelName}
            </Text>
            <Text className="text-[10px] text-muted-foreground/70">
                {formatTokens(totalTokens)} tokens
            </Text>
            <Text className="text-[10px] text-muted-foreground/70">
                ${costStr}
            </Text>
        </View>
    )
}

function MessageItemInner({ message, theme, projectId, sessionId, pendingQuestions, onQuestionReply, onQuestionReject, pendingPermissions, onPermissionReply, streaming }: MessageItemProps & { streaming?: boolean }) {
    const router = useRouter()
    const [showMenu, setShowMenu] = useState(false)
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
    const containerRef = useRef<View>(null)
    const touchPosRef = useRef({ x: 0, y: 0 })

    const connections = useConnections((s) => s.connections)
    const current = useConnections((s) => s.current)
    const connection = connections.find((c) => c.id === current) ?? null
    const upsertSession = useSessions((s) => s.upsertSession)

    const hasError = message.role === "assistant" && "error" in message && message.error

    const closeMenu = useCallback(() => setShowMenu(false), [])

    const handleLongPress = useCallback(() => {
        const { width: screenW, height: screenH } = Dimensions.get("window")
        const menuW = 224
        const menuH = 180
        const { x, y } = touchPosRef.current
        const left = Math.min(Math.max(8, x - menuW / 2), screenW - menuW - 8)
        const top = Math.min(Math.max(8, y + 8), screenH - menuH - 8)
        setMenuPos({ top, left })
        setShowMenu(true)
    }, [])

    const handleTouchStart = useCallback((e: { nativeEvent: { pageX: number; pageY: number } }) => {
        touchPosRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
    }, [])

    const handleCopyFull = useCallback(async () => {
        closeMenu()
        const text = getPlainText(message)
        if (text) {
            await Clipboard.setStringAsync(text)
        }
    }, [message, closeMenu])

    const handleSelectiveCopy = useCallback(() => {
        closeMenu()
        const text = getPlainText(message)
        if (text) {
            useSelectiveCopy.getState().setText(text)
            router.push(`/project/${projectId}/${sessionId}/selective-copy`)
        }
    }, [message, closeMenu, router, projectId, sessionId])

    const handleRevert = useCallback(async () => {
        closeMenu()
        if (!connection?.url || !connection?.token) return
        await revertMessage(connection.url, connection.token, sessionId, message.id)
    }, [connection, sessionId, message.id, closeMenu])

    const handleFork = useCallback(async () => {
        closeMenu()
        if (!connection?.url || !connection?.token) return
        const forked = await forkSession(connection.url, connection.token, sessionId, message.id)
        if (forked) {
            upsertSession(forked)
            router.push(`/project/${projectId}/${forked.id}`)
        }
    }, [connection, sessionId, message.id, projectId, router, upsertSession, closeMenu])

    return (
        <Pressable
            ref={containerRef}
            className={cn(
                "flex flex-col gap-1.5 p-4 rounded-xl",
                message.role === "user" ? "ml-auto max-w-[300px] bg-secondary/75 rounded-3xl" : null,
                hasError ? "bg-destructive/10 border border-destructive/30" : null,
            )}
            onLongPress={handleLongPress}
            onTouchStart={handleTouchStart}
        >
            {hasError ? (
                <View className="flex-row items-center gap-1.5 mb-1">
                    <TriangleAlertIcon size={12} color={THEME[theme].destructive ?? "#ef4444"} />
                    <View className="flex-1">
                        <Text className="text-xs font-medium text-destructive">
                            {getErrorLabel(message.error?.name)}
                        </Text>
                        {getErrorHint(message.error?.name) && (
                            <Text className="text-xs text-destructive/70 mt-0.5">
                                {getErrorHint(message.error?.name)}
                            </Text>
                        )}
                    </View>
                </View>
            ) : null}
            {message.parts?.map((part, j) => {
                if (part.type === "reasoning") {
                    const isPartStreaming = !!streaming && j === message.parts!.length - 1
                    return (
                        <ReasoningBlock
                            key={part.id ?? j}
                            text={part.text}
                            streaming={isPartStreaming}
                            startedAt={message.time.created}
                            theme={theme}
                        />
                    )
                }
                return <MemoPartRenderer key={part.id ?? j} part={part} index={j} message={message} theme={theme} projectId={projectId} sessionId={sessionId} pendingQuestions={pendingQuestions} onQuestionReply={onQuestionReply} onQuestionReject={onQuestionReject} pendingPermissions={pendingPermissions} onPermissionReply={onPermissionReply} streaming={streaming} />
            })}
            <MessageMetadata message={message} theme={theme} />

            <Modal visible={showMenu} transparent animationType="none" onRequestClose={closeMenu}>
                <Pressable className="flex-1" onPress={closeMenu}>
                    <View
                        className="w-56 rounded-xl bg-card border border-border shadow-lg"
                        style={{ position: "absolute", top: menuPos.top, left: menuPos.left }}
                    >
                        <View className="py-2">
                            <Pressable
                                className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                onPress={handleRevert}
                            >
                                <RotateCcwIcon size={16} color={THEME[theme].mutedForeground} />
                                <Text className="text-sm text-foreground">Revert</Text>
                            </Pressable>

                            <Pressable
                                className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                onPress={handleCopyFull}
                            >
                                <CopyIcon size={16} color={THEME[theme].mutedForeground} />
                                <Text className="text-sm text-foreground">Copy full message</Text>
                            </Pressable>

                            <Pressable
                                className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                onPress={handleSelectiveCopy}
                            >
                                <PenLineIcon size={16} color={THEME[theme].mutedForeground} />
                                <Text className="text-sm text-foreground">Selective Copy</Text>
                            </Pressable>

                            <Pressable
                                className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                onPress={handleFork}
                            >
                                <GitBranchIcon size={16} color={THEME[theme].mutedForeground} />
                                <Text className="text-sm text-foreground">Fork</Text>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </Pressable>
    )
}

export const MessageItem = memo(MessageItemInner, (prev, next) => {
    return prev.message === next.message && prev.theme === next.theme && prev.projectId === next.projectId && prev.sessionId === next.sessionId && prev.pendingQuestions === next.pendingQuestions && prev.pendingPermissions === next.pendingPermissions && prev.streaming === next.streaming
})
