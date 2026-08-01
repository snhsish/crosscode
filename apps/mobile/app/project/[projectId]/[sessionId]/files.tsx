import { useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, View, RefreshControl } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import { ArrowLeftIcon, FileIcon, PlusIcon, MinusIcon } from "lucide-react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { useDiffStore } from "@/store/diff.store"
import { fetchSessionDiffs, FileDiff } from "@/lib/diff"
import { useConnections } from "@/store/connection.store"

export default function FilesPage() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const theme = (colorScheme ?? "light") as "light" | "dark"
    const { projectId, sessionId } = useLocalSearchParams<{ projectId: string; sessionId: string }>()
    const setDiff = useDiffStore((s) => s.setDiff)
    const { connections, current } = useConnections()
    const connection = connections.find((c) => c.id === current) ?? null

    const [files, setFiles] = useState<FileDiff[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const loadDiffs = useCallback(async () => {
        if (!connection?.url || !connection?.token || !sessionId) return
        const data = await fetchSessionDiffs(connection.url, connection.token, sessionId)
        setFiles(data)
        setLoading(false)
    }, [connection?.url, connection?.token, sessionId])

    useEffect(() => {
        loadDiffs()
    }, [loadDiffs])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await loadDiffs()
        setRefreshing(false)
    }, [loadDiffs])

    const stats = useMemo(() => {
        const totalFiles = files.length
        const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0)
        const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0)
        return { totalFiles, totalAdditions, totalDeletions }
    }, [files])

    const handleFilePress = useCallback(
        (file: string, before: string, after: string) => {
            setDiff({ filePath: file, oldString: before, newString: after })
            router.push(`/project/${projectId}/${sessionId}/diff`)
        },
        [setDiff, router, projectId, sessionId]
    )

    const renderItem = useCallback(
        ({ item, index }: { item: FileDiff; index: number }) => {
            const fileName = item.file.split("/").pop() ?? item.file
            const directory = item.file.split("/").slice(0, -1).join("/")

            return (
                <Pressable
                    className={`flex-row items-center gap-3 px-4 py-3 border-b border-border/50 active:bg-accent/30 ${
                        index === files.length - 1 ? "border-b-0" : ""
                    }`}
                    onPress={() => handleFilePress(item.file, item.before, item.after)}
                >
                    <View className="w-10 h-10 rounded-lg bg-accent/60 items-center justify-center">
                        <FileIcon size={18} color={THEME[theme].mutedForeground} />
                    </View>
                    <View className="flex-1 gap-0.5">
                        <Text className="text-sm font-medium line-clamp-1">{fileName}</Text>
                        {directory && (
                            <Text className="text-xs text-muted-foreground line-clamp-1">{directory}</Text>
                        )}
                    </View>
                    <View className="flex-row items-center gap-2">
                        {item.additions > 0 && (
                            <View className="flex-row items-center gap-0.5">
                                <PlusIcon size={12} color="#22c55e" />
                                <Text className="text-xs text-green-500 font-medium">{item.additions}</Text>
                            </View>
                        )}
                        {item.deletions > 0 && (
                            <View className="flex-row items-center gap-0.5">
                                <MinusIcon size={12} color="#ef4444" />
                                <Text className="text-xs text-red-500 font-medium">{item.deletions}</Text>
                            </View>
                        )}
                    </View>
                </Pressable>
            )
        },
        [files.length, theme, handleFilePress]
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
                <Text className="text-base font-semibold flex-1">Modified files</Text>
                {stats.totalFiles > 0 && (
                    <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/60 border border-border/50">
                        <Text className="text-xs text-muted-foreground">{stats.totalFiles}</Text>
                    </View>
                )}
            </View>

            {stats.totalFiles > 0 && (
                <View className="flex-row items-center gap-3 px-4 py-3 border-b border-accent/50">
                    <View className="flex-row items-center gap-1">
                        <FileIcon size={12} color={THEME[theme].mutedForeground} />
                        <Text className="text-xs text-muted-foreground">{stats.totalFiles} files</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <PlusIcon size={12} color="#22c55e" />
                        <Text className="text-xs text-muted-foreground">{stats.totalAdditions} additions</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <MinusIcon size={12} color="#ef4444" />
                        <Text className="text-xs text-muted-foreground">{stats.totalDeletions} deletions</Text>
                    </View>
                </View>
            )}

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={THEME[theme].mutedForeground} />
                    <Text className="text-xs text-muted-foreground mt-3">Loading files...</Text>
                </View>
            ) : files.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-16 h-16 rounded-full bg-accent items-center justify-center mb-6">
                        <FileIcon size={28} color={THEME[theme].mutedForeground} />
                    </View>
                    <Text className="text-lg font-semibold tracking-tight text-center mb-2">
                        No modified files
                    </Text>
                    <Text className="text-sm text-muted-foreground text-center leading-5">
                        Modified files will appear here when the agent makes changes during this session.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={files}
                    keyExtractor={(item) => item.file}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
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
