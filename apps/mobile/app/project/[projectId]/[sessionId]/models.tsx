import { useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import { ArrowLeftIcon, CheckIcon, FilterIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Input } from "@/components/ui/input"
import { Icon } from "@/components/ui/icon"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { useModels } from "@/store/models.store"
import { useConnections } from "@/store/connection.store"
import { useChatStore } from "@/store/chat.store"
import { updateSessionModel } from "@/lib/models"

type SortMode = "name" | "provider" | "status"

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: "name", label: "Name" },
    { value: "provider", label: "Provider" },
    { value: "status", label: "Status" },
]

const STATUS_OPTIONS: { value: string; label: string; chipBg: string; chipText: string; borderColor: string }[] = [
    { value: "active", label: "Active", chipBg: "bg-green-500/15", chipText: "text-green-500", borderColor: "border-green-500/30" },
    { value: "beta", label: "Beta", chipBg: "bg-yellow-500/15", chipText: "text-yellow-500", borderColor: "border-yellow-500/30" },
    { value: "alpha", label: "Alpha", chipBg: "bg-orange-500/15", chipText: "text-orange-500", borderColor: "border-orange-500/30" },
    { value: "deprecated", label: "Deprecated", chipBg: "bg-red-500/15", chipText: "text-red-500", borderColor: "border-red-500/30" },
    { value: "all", label: "All", chipBg: "bg-muted", chipText: "text-foreground", borderColor: "border-border" },
]

export default function ModelsPage() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const theme = colorScheme ?? "light"
    const { projectId, sessionId, currentModelId, currentProviderId } = useLocalSearchParams<{
        projectId: string
        sessionId: string
        currentModelId?: string
        currentProviderId?: string
    }>()
    const { connections, current } = useConnections()
    const connection = connections.find((c) => c.id === current) ?? null
    const { models, providers, fetchAll } = useModels()

    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("active")
    const [sort, setSort] = useState<SortMode>("name")
    const [selectedId, setSelectedId] = useState(currentModelId ?? "")
    const [selectedProviderId, setSelectedProviderId] = useState(currentProviderId ?? "")
    const [updating, setUpdating] = useState<string | null>(null)

    const providerMap = useMemo(() => {
        const map: Record<string, string> = {}
        for (const p of providers) {
            map[p.id] = p.name
        }
        return map
    }, [providers])

    useEffect(() => {
        if (connection) fetchAll(connection.url, connection.token)
    }, [connection?.id])

    const filtered = useMemo(() => {
        let list = models

        if (statusFilter !== "all") {
            list = list.filter((m) => m.status === statusFilter)
        }

        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(
                (m) =>
                    m.name.toLowerCase().includes(q) ||
                    m.providerID.toLowerCase().includes(q) ||
                    m.family.toLowerCase().includes(q) ||
                    m.id.toLowerCase().includes(q)
            )
        }

        list.sort((a, b) => {
            switch (sort) {
                case "name":
                    return a.name.localeCompare(b.name)
                case "provider":
                    return a.providerID.localeCompare(b.providerID) || a.name.localeCompare(b.name)
                case "status": {
                    const order = { active: 0, beta: 1, alpha: 2, deprecated: 3 }
                    return (order[a.status] ?? 99) - (order[b.status] ?? 99)
                }
                default:
                    return 0
            }
        })

        return list
    }, [models, search, sort, statusFilter])

    const setModel = useChatStore((s) => s.setModel)

    const handleSelect = useCallback(
        async (modelId: string, providerId: string) => {
            if (!connection || updating) return
            setUpdating(modelId)
            try {
                await updateSessionModel(connection.url, connection.token, sessionId, {
                    id: modelId,
                    providerID: providerId,
                })
                setSelectedId(modelId)
                setSelectedProviderId(providerId)
                setModel(sessionId, { id: modelId, providerID: providerId })
                router.back()
            } catch {
            } finally {
                setUpdating(null)
            }
        },
        [connection, sessionId, updating, setModel, router]
    )

    const isSelected = (modelId: string, providerId: string) =>
        selectedId === modelId && selectedProviderId === providerId

    const renderItem = useCallback(
        ({ item }: { item: (typeof models)[0] }) => {
            const selected = isSelected(item.id, item.providerID)
            const providerName = providerMap[item.providerID] ?? item.providerID
            const isDeprecated = item.status === "deprecated"
            return (
                <Pressable
                    disabled={isDeprecated}
                    className={cn(
                        "flex-row items-center px-4 py-3 border-b border-border/50",
                        !isDeprecated && "active:bg-accent/50",
                        selected && "bg-accent/30",
                        isDeprecated && "opacity-40"
                    )}
                    onPress={() => handleSelect(item.id, item.providerID)}
                >
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                            <Text className={cn("text-sm font-medium", isDeprecated && "line-through")} numberOfLines={1}>
                                {item.name}
                            </Text>
                            {selected && (
                                <Icon as={CheckIcon} size={14} className="text-primary" />
                            )}
                        </View>
                        <Text className="text-xs text-muted-foreground mt-0.5">
                            {providerName}
                            {item.family ? ` · ${item.family}` : ""}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <View
                            className={cn(
                                "px-1.5 py-0.5 rounded-full",
                                item.status === "active" && "bg-green-500/15",
                                item.status === "beta" && "bg-yellow-500/15",
                                item.status === "alpha" && "bg-orange-500/15",
                                item.status === "deprecated" && "bg-red-500/15"
                            )}
                        >
                            <Text
                                className={cn(
                                    "text-[10px] font-medium capitalize",
                                    item.status === "active" && "text-green-500",
                                    item.status === "beta" && "text-yellow-500",
                                    item.status === "alpha" && "text-orange-500",
                                    item.status === "deprecated" && "text-red-500"
                                )}
                            >
                                {item.status}
                            </Text>
                        </View>
                        {updating === item.id && (
                            <ActivityIndicator size="small" color={THEME[theme].mutedForeground} />
                        )}
                    </View>
                </Pressable>
            )
        },
        [selectedId, selectedProviderId, updating, providerMap, theme]
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
                <Text className="text-base font-semibold flex-1">Models</Text>

                {selectedId ? (
                    <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/60 border border-border/50">
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                            {providerMap[selectedProviderId] ?? selectedProviderId}
                            {selectedId ? ` / ${selectedId}` : ""}
                        </Text>
                    </View>
                ) : null}
            </View>

            <View className="flex-row items-center gap-2 px-4 py-2">
                <View className="flex-1 relative">
                    <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
                        <Icon as={SearchIcon} size={16} className="text-muted-foreground" />
                    </View>
                    <Input
                        placeholder="Search models..."
                        className="pl-9 h-9 text-sm"
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            <View className="flex-row items-center gap-1.5 px-4 pb-1.5">
                <Icon as={FilterIcon} size={12} className="text-muted-foreground" />
                <Text className="text-xs text-muted-foreground mr-1">Filter:</Text>
                {STATUS_OPTIONS.map((opt) => (
                    <Pressable
                        key={opt.value}
                        className={cn(
                            "px-2.5 py-1 rounded-full border",
                            statusFilter === opt.value
                                ? cn(opt.chipBg, opt.borderColor)
                                : "border-border"
                        )}
                        onPress={() => setStatusFilter(opt.value)}
                    >
                        <Text
                            className={cn(
                                "text-xs",
                                statusFilter === opt.value
                                    ? cn(opt.chipText, "font-medium")
                                    : "text-muted-foreground"
                            )}
                        >
                            {opt.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <View className="flex-row items-center gap-1.5 px-4 pb-2">
                <Icon as={SlidersHorizontalIcon} size={12} className="text-muted-foreground" />
                <Text className="text-xs text-muted-foreground mr-1">Sort:</Text>
                {SORT_OPTIONS.map((opt) => (
                    <Pressable
                        key={opt.value}
                        className={cn(
                            "px-2.5 py-1 rounded-full border",
                            sort === opt.value
                                ? "border-primary bg-primary/10"
                                : "border-border"
                        )}
                        onPress={() => setSort(opt.value)}
                    >
                        <Text
                            className={cn(
                                "text-xs",
                                sort === opt.value ? "text-primary font-medium" : "text-muted-foreground"
                            )}
                        >
                            {opt.label}
                        </Text>
                    </Pressable>
                ))}
                <Text className="text-xs text-muted-foreground ml-auto">
                    {filtered.length} models
                </Text>
            </View>

            {models.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={THEME[theme].mutedForeground} />
                    <Text className="text-xs text-muted-foreground mt-3">Loading models...</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => `${item.providerID}-${item.id}`}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View className="items-center pt-10">
                            <Text className="text-sm text-muted-foreground">
                                No models match "{search}"
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    )
}
