import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, RefreshControl, View } from "react-native"
import * as Clipboard from "expo-clipboard"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import { ArrowLeftIcon, GitBranchIcon } from "lucide-react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Dialog } from "@/components/ui/dialog"
import { THEME } from "@/lib/theme"
import { computeGitGraph } from "@/lib/git-graph"
import { GitGraphRow, GIT_ROW_HEIGHT } from "@/components/git-graph-row"
import { useGitStore } from "@/store/git.store"
import { useConnections } from "@/store/connection.store"
import { useSettings } from "@/store/settings.store"

const LANE_WIDTH = 13

export default function GitGraphPage() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const theme = colorScheme ?? "light"
    const isDark = theme === "dark"

    const connections = useConnections((s) => s.connections)
    const current = useConnections((s) => s.current)
    const connection = connections.find((c) => c.id === current) ?? null

    const commits = useGitStore((s) => s.commits)
    const status = useGitStore((s) => s.status)
    const errorMessage = useGitStore((s) => s.errorMessage)
    const hasMore = useGitStore((s) => s.hasMore)
    const commitDetail = useGitStore((s) => s.commitDetail)
    const detailLoading = useGitStore((s) => s.detailLoading)
    const reset = useGitStore((s) => s.reset)
    const loadFirstPage = useGitStore((s) => s.loadFirstPage)
    const loadMore = useGitStore((s) => s.loadMore)
    const loadCommitDetail = useGitStore((s) => s.loadCommitDetail)
    const clearCommitDetail = useGitStore((s) => s.clearCommitDetail)

    const [refreshing, setRefreshing] = useState(false)
    const allowTerminal = useSettings((s) => s.allowTerminal)

    useEffect(() => {
        if (!allowTerminal) return
        if (!connection?.url || !connection?.token) return
        if (status === "idle") {
            loadFirstPage(connection.url, connection.token)
        }
    }, [connection?.url, connection?.token, status, loadFirstPage])

    useEffect(() => () => reset(), [reset])

    const graphRows = useMemo(() => computeGitGraph(commits), [commits])

    const maxLanes = useMemo(
        () => graphRows.reduce((max, row) => Math.max(max, row.laneCount), 1),
        [graphRows]
    )
    const graphWidth = maxLanes * LANE_WIDTH

    const colors = useMemo(
        () => ({
            textColor: THEME[theme].foreground,
            hashColor: THEME[theme].mutedForeground,
            badgeBg: isDark ? "rgba(167,139,250,0.15)" : "rgba(124,58,237,0.10)",
            badgeText: isDark ? "#c4b5fd" : "#7c3aed",
        }),
        [theme, isDark]
    )

    const handleRefresh = useCallback(async () => {
        if (!connection?.url || !connection?.token) return
        setRefreshing(true)
        await loadFirstPage(connection.url, connection.token)
        setRefreshing(false)
    }, [connection?.url, connection?.token, loadFirstPage])

    const handleEndReached = useCallback(() => {
        if (!connection?.url || !connection?.token) return
        loadMore(connection.url, connection.token)
    }, [connection?.url, connection?.token, loadMore])

    const handleSelectCommit = useCallback(
        (hash: string) => {
            if (!connection?.url || !connection?.token) return
            loadCommitDetail(connection.url, connection.token, hash)
        },
        [connection?.url, connection?.token, loadCommitDetail]
    )

    const handleCopyHash = useCallback(
        (hash: string) => {
            Clipboard.setStringAsync(hash)
        },
        []
    )

    const closeDetail = useCallback(() => {
        clearCommitDetail()
    }, [clearCommitDetail])

    const renderItem = useCallback(
        ({ item, index }: { item: (typeof commits)[number]; index: number }) => (
            <GitGraphRow
                subject={item.subject}
                shortHash={item.shortHash}
                refs={item.refs}
                graph={graphRows[index]}
                graphWidth={graphWidth}
                textColor={colors.textColor}
                hashColor={colors.hashColor}
                badgeBg={colors.badgeBg}
                badgeText={colors.badgeText}
                onPress={() => handleSelectCommit(item.hash)}
                onLongPress={() => handleCopyHash(item.hash)}
            />
        ),
        [graphRows, graphWidth, colors, handleSelectCommit, handleCopyHash]
    )

    const keyExtractor = useCallback((item: (typeof commits)[number]) => item.hash, [])

    const listFooter = useMemo(() => {
        if (!hasMore) return <View style={{ height: 24 }} />
        return (
            <View className="items-center py-4">
                <Text className="text-xs text-muted-foreground">Loading more…</Text>
            </View>
        )
    }, [hasMore])

    return (
        <View className="flex-1 bg-background">
            <View
                className="flex-row items-center gap-2 border-b border-accent px-4"
                style={{ paddingTop: insets.top + 10, paddingBottom: 10 }}
            >
                <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
                    <ArrowLeftIcon size={20} color={THEME[theme].foreground} />
                </Button>
                <View className="flex-row items-center gap-2 flex-1">
                    <GitBranchIcon size={18} color={THEME[theme].foreground} />
                    <Text className="text-sm font-semibold">Git Graph</Text>
                </View>
            </View>

            {!allowTerminal && (
                <View className="flex-1 items-center justify-center px-8 gap-2">
                    <Text className="text-sm font-semibold text-center">Terminal access disabled</Text>
                    <Text className="text-xs text-muted-foreground text-center">
                        Enable "Allow terminal" in Account → Workspace to use the git graph.
                    </Text>
                </View>
            )}

            {allowTerminal && status === "loading" && (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-sm text-muted-foreground">Loading history…</Text>
                </View>
            )}

            {allowTerminal && status === "unsupported" && (
                <View className="flex-1 items-center justify-center px-8 gap-2">
                    <Text className="text-sm font-semibold text-center">Older crosscode client detected</Text>
                    <Text className="text-xs text-muted-foreground text-center">
                        This connection is running an older version of the crosscode CLI without git support.
                        Update the crosscode package on your machine and reconnect.
                    </Text>
                </View>
            )}

            {allowTerminal && status === "error" && (
                <View className="flex-1 items-center justify-center px-8 gap-2">
                    <Text className="text-sm font-semibold text-center text-destructive">Could not load git history</Text>
                    <Text className="text-xs text-muted-foreground text-center">{errorMessage ?? "Unknown error"}</Text>
                </View>
            )}

            {allowTerminal && status === "ready" && commits.length === 0 && (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-sm text-muted-foreground">No commits found</Text>
                </View>
            )}

            {allowTerminal && (status === "ready" || status === "loading-more") && commits.length > 0 && (
                <FlatList
                    data={commits}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    getItemLayout={(_, index) => ({
                        length: GIT_ROW_HEIGHT,
                        offset: GIT_ROW_HEIGHT * index,
                        index,
                    })}
                    onEndReachedThreshold={0.5}
                    onEndReached={handleEndReached}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={THEME[theme].mutedForeground} />
                    }
                    contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
                    removeClippedSubviews
                    windowSize={12}
                    initialNumToRender={30}
                    maxToRenderPerBatch={40}
                    ListFooterComponent={listFooter}
                />
            )}

            <Dialog open={commitDetail !== null || detailLoading} onClose={closeDetail} contentClassName="max-h-[80%]">
                {detailLoading ? (
                    <View className="py-8 items-center">
                        <Text className="text-sm text-muted-foreground">Loading commit…</Text>
                    </View>
                ) : commitDetail ? (
                    <View className="gap-3">
                        <View className="flex-row items-start gap-2">
                            <View className="flex-1 gap-1">
                                <Text className="text-base font-semibold" numberOfLines={3}>
                                    {commitDetail.subject}
                                </Text>
                                <Text className="text-xs text-muted-foreground">
                                    {commitDetail.author}
                                    {commitDetail.author && commitDetail.date ? " • " : ""}
                                    {commitDetail.date}
                                </Text>
                            </View>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onPress={() => handleCopyHash(commitDetail.hash)}
                            >
                                <Text className="text-[10px] font-mono">{commitDetail.hash.slice(0, 7)}</Text>
                            </Button>
                        </View>

                        {commitDetail.body ? (
                            <Text className="text-xs text-muted-foreground">{commitDetail.body}</Text>
                        ) : null}

                        {(commitDetail.additions > 0 || commitDetail.deletions > 0) && (
                            <View className="flex-row gap-2">
                                {commitDetail.additions > 0 && (
                                    <Text className="text-xs font-mono text-green-500">+{commitDetail.additions}</Text>
                                )}
                                {commitDetail.deletions > 0 && (
                                    <Text className="text-xs font-mono text-red-500">-{commitDetail.deletions}</Text>
                                )}
                            </View>
                        )}

                        {commitDetail.files.length > 0 && (
                            <View className="rounded-xl border border-border/50 overflow-hidden">
                                {commitDetail.files.map((file, i) => (
                                    <View
                                        key={`${file.file}-${i}`}
                                        className="flex-row items-center gap-2 px-3 py-2"
                                        style={{ borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: THEME[theme].border }}
                                    >
                                        <Text className="flex-1 text-xs" numberOfLines={1}>
                                            {file.file.split("/").pop() || file.file}
                                        </Text>
                                        <Text className="text-[10px] font-mono text-muted-foreground" numberOfLines={1}>
                                            {file.file.includes("/") ? file.file.slice(0, file.file.lastIndexOf("/")) + "/" : ""}
                                        </Text>
                                        <Text className="text-[10px] font-mono text-green-500 w-8 text-right">
                                            {file.additions > 0 ? `+${file.additions}` : ""}
                                        </Text>
                                        <Text className="text-[10px] font-mono text-red-500 w-8 text-right">
                                            {file.deletions > 0 ? `-${file.deletions}` : ""}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ) : null}
            </Dialog>
        </View>
    )
}
