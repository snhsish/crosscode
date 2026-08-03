import { useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, View, RefreshControl } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import { ArrowLeftIcon, CheckCircle2Icon, CircleIcon, ClockIcon, XCircleIcon } from "lucide-react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { useConnections } from "@/store/connection.store"
import { fetchSessionTodos, TodoTask } from "@/lib/todo"

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2Icon; color: string; bg: string; label: string }> = {
    completed: { icon: CheckCircle2Icon, color: "text-green-500", bg: "bg-green-500/15", label: "Completed" },
    in_progress: { icon: ClockIcon, color: "text-blue-500", bg: "bg-blue-500/15", label: "In Progress" },
    pending: { icon: CircleIcon, color: "text-muted-foreground", bg: "bg-muted", label: "Pending" },
    cancelled: { icon: XCircleIcon, color: "text-red-500", bg: "bg-red-500/15", label: "Cancelled" },
}

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    high: { color: "text-red-500", bg: "bg-red-500/15", border: "border-red-500/30" },
    medium: { color: "text-yellow-500", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
    low: { color: "text-green-500", bg: "bg-green-500/15", border: "border-green-500/30" },
}

export default function TasksPage() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const theme = (colorScheme ?? "light") as "light" | "dark"
    const { projectId, sessionId } = useLocalSearchParams<{ projectId: string; sessionId: string }>()
    const connections = useConnections((s) => s.connections)
    const current = useConnections((s) => s.current)
    const connection = connections.find((c) => c.id === current) ?? null

    const [todos, setTodos] = useState<TodoTask[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const loadTodos = useCallback(async () => {
        if (!connection?.url || !connection?.token || !sessionId) return
        const data = await fetchSessionTodos(connection.url, connection.token, sessionId)
        setTodos(data)
        setLoading(false)
    }, [connection?.url, connection?.token, sessionId])

    useEffect(() => {
        loadTodos()
    }, [loadTodos])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await loadTodos()
        setRefreshing(false)
    }, [loadTodos])

    const stats = useMemo(() => {
        const total = todos.length
        const completed = todos.filter((t) => t.status === "completed").length
        const inProgress = todos.filter((t) => t.status === "in_progress").length
        const pending = todos.filter((t) => t.status === "pending").length
        const cancelled = todos.filter((t) => t.status === "cancelled").length
        return { total, completed, inProgress, pending, cancelled }
    }, [todos])

    const renderItem = useCallback(
        ({ item, index }: { item: TodoTask; index: number }) => {
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending
            const priorityCfg = item.priority ? PRIORITY_CONFIG[item.priority] : null
            const StatusIcon = statusCfg.icon
            const isCompleted = item.status === "completed"

            return (
                <View
                    className={cn(
                        "flex-row items-start gap-3 px-4 py-3 border-b border-border/50",
                        index === todos.length - 1 && "border-b-0"
                    )}
                >
                    <View className={cn("mt-0.5", statusCfg.color)}>
                        <StatusIcon size={18} />
                    </View>
                    <View className="flex-1 gap-1">
                        <Text
                            className={cn(
                                "text-sm leading-relaxed",
                                isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                            )}
                        >
                            {item.content}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                            <View className={cn("px-1.5 py-0.5 rounded-full", statusCfg.bg)}>
                                <Text className={cn("text-[10px] font-medium", statusCfg.color)}>
                                    {statusCfg.label}
                                </Text>
                            </View>
                            {priorityCfg && (
                                <View className={cn("px-1.5 py-0.5 rounded-full border", priorityCfg.bg, priorityCfg.border)}>
                                    <Text className={cn("text-[10px] font-medium capitalize", priorityCfg.color)}>
                                        {item.priority}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            )
        },
        [todos.length]
    )

    return (
        <View className="flex-1 bg-background">
            <View
                className="flex-row items-center gap-2 border-b border-accent px-4"
                style={{ paddingTop: insets.top + 10, paddingBottom: 10 }}
            >
                <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
                    <ArrowLeftIcon size={20} color={THEME[theme].foreground} />
                </Button>
                <Text className="text-base font-semibold flex-1">Tasks</Text>
                {stats.total > 0 && (
                    <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/60 border border-border/50">
                        <Text className="text-xs text-muted-foreground">
                            {stats.completed}/{stats.total}
                        </Text>
                    </View>
                )}
            </View>

            {stats.total > 0 && (
                <View className="flex-row items-center gap-2 px-4 py-3 border-b border-accent/50">
                    <View className="flex-row items-center gap-1">
                        <CircleIcon size={12} color={THEME[theme].mutedForeground} />
                        <Text className="text-xs text-muted-foreground">{stats.pending} pending</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <ClockIcon size={12} color="#3b82f6" />
                        <Text className="text-xs text-muted-foreground">{stats.inProgress} in progress</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <CheckCircle2Icon size={12} color="#22c55e" />
                        <Text className="text-xs text-muted-foreground">{stats.completed} done</Text>
                    </View>
                    {stats.cancelled > 0 && (
                        <View className="flex-row items-center gap-1">
                            <XCircleIcon size={12} color="#ef4444" />
                            <Text className="text-xs text-muted-foreground">{stats.cancelled} cancelled</Text>
                        </View>
                    )}
                </View>
            )}

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={THEME[theme].mutedForeground} />
                    <Text className="text-xs text-muted-foreground mt-3">Loading tasks...</Text>
                </View>
            ) : todos.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-16 h-16 rounded-full bg-accent items-center justify-center mb-6">
                        <CheckCircle2Icon size={28} color={THEME[theme].mutedForeground} />
                    </View>
                    <Text className="text-lg font-semibold tracking-tight text-center mb-2">
                        No tasks yet
                    </Text>
                    <Text className="text-sm text-muted-foreground text-center leading-5">
                        Tasks will appear here when the agent creates a task list for this session.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={todos}
                    keyExtractor={(item, index) => `${item.content}-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={7}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={THEME[theme].mutedForeground}
                        />
                    }
                />
            )}
        </View>
    )
}
