import { memo } from "react"
import { View } from "react-native"
import { TriangleAlertIcon } from "lucide-react-native"
import { Message, Part } from "@/store/messages.store"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { Text } from "@/components/ui/text"
import MemoMarkdown from "@/components/memo-markdown"
import { ReasoningBlock } from "@/components/reasoning-block"
import { TodoBlock, TodoItem } from "@/components/todo-block"
import { ToolBlock } from "@/components/tool-block"
import { QuestionBlock } from "@/components/question-block"
import { QuestionRequest } from "@/store/questions.store"

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
    pendingQuestions?: QuestionRequest[]
    onQuestionReply?: (requestId: string, answers: string[][]) => void
    onQuestionReject?: (requestId: string) => void
}

function getErrorLabel(name?: string): string {
    switch (name) {
        case "ProviderAuthError": return "Authentication Error"
        case "MessageOutputLengthError": return "Output Length Error"
        case "MessageAbortedError": return "Aborted"
        case "APIError": return "API Error"
        default: return "Error"
    }
}

function PartRenderer({ part, index, message, theme, pendingQuestions, onQuestionReply, onQuestionReject }: { part: Part; index: number; message: Message; theme: "light" | "dark"; pendingQuestions?: QuestionRequest[]; onQuestionReply?: (requestId: string, answers: string[][]) => void; onQuestionReject?: (requestId: string) => void }) {
    switch (part.type) {
        case "text":
            return <MemoMarkdown key={part.id ?? index}>{part.text}</MemoMarkdown>
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
                    key={part.id ?? index}
                    name={part.toolInvocation.toolName}
                    status={part.toolInvocation.state}
                    details={tiDetails.length > 0 ? tiDetails : undefined}
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
            return (
                <ToolBlock
                    key={part.id ?? index}
                    name={part.tool}
                    status={part.state?.status ?? "unknown"}
                />
            )
        case "source-url":
            return (
                <Text key={part.id ?? index} className="text-xs underline decoration-dotted">
                    {part.title ?? part.url}
                </Text>
            )
        case "file":
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

const MemoPartRenderer = memo(PartRenderer, (prev, next) => prev.part === next.part && prev.index === next.index && prev.message === next.message && prev.theme === next.theme && prev.pendingQuestions === next.pendingQuestions)

function MessageItemInner({ message, theme, pendingQuestions, onQuestionReply, onQuestionReject }: MessageItemProps) {
    const hasError = message.role === "assistant" && "error" in message && message.error

    const duration =
        message.role === "assistant" && "completed" in message.time && message.time.completed
            ? (message.time.completed - message.time.created) / 1000
            : undefined

    return (
        <View
            className={cn(
                "flex flex-col gap-1.5 p-4 rounded-xl",
                message.role === "user" ? "ml-auto max-w-[300px] bg-secondary/75 rounded-3xl" : null,
                hasError ? "bg-destructive/10 border border-destructive/30" : null,
            )}
        >
            {hasError ? (
                <View className="flex-row items-center gap-1.5 mb-1">
                    <TriangleAlertIcon size={12} color={THEME[theme].destructive ?? "#ef4444"} />
                    <Text className="text-xs font-medium text-destructive">
                        {getErrorLabel(message.error?.name)}
                    </Text>
                </View>
            ) : null}
            {message.parts?.map((part, j) => {
                if (part.type === "reasoning") {
                    return (
                        <ReasoningBlock
                            key={part.id ?? j}
                            text={part.text}
                            duration={duration}
                        />
                    )
                }
                return <MemoPartRenderer key={part.id ?? j} part={part} index={j} message={message} theme={theme} pendingQuestions={pendingQuestions} onQuestionReply={onQuestionReply} onQuestionReject={onQuestionReject} />
            })}
        </View>
    )
}

export const MessageItem = memo(MessageItemInner, (prev, next) => {
    return prev.message === next.message && prev.theme === next.theme && prev.pendingQuestions === next.pendingQuestions
})
