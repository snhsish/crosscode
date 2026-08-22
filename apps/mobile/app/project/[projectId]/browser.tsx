import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, TextInput as RNTextInput, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import {
    ArrowLeftIcon,
    ChevronRightIcon,
    FileIcon,
    FolderIcon,
    SearchIcon,
    XIcon,
} from "lucide-react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { useConnections } from "@/store/connection.store"
import {
    buildBreadcrumbs,
    fetchFileStatuses,
    FileEntry,
    FileStatusKind,
    listDirectory,
    searchFiles,
} from "@/lib/file-browser"
import { cachedEntries, cachedStatuses, invalidatePath, setCachedEntries, setCachedStatuses } from "@/store/browser.store"

const STATUS_COLORS: Record<FileStatusKind, string> = {
    added: "#22c55e",
    modified: "#eab308",
    deleted: "#ef4444",
}

const SEARCH_DEBOUNCE_MS = 350

export default function BrowserPage() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const theme = (colorScheme ?? "light") as "light" | "dark"
    const t = THEME[theme]
    const { projectId } = useLocalSearchParams<{ projectId: string }>()

    const connections = useConnections((s) => s.connections)
    const current = useConnections((s) => s.current)
    const connection = connections.find((c) => c.id === current) ?? null
    const connected = !!(connection?.url && connection?.token)

    const [path, setPath] = useState("")
    const [entries, setEntries] = useState<FileEntry[]>([])
    const [statuses, setStatuses] = useState<Record<string, FileStatusKind>>({})
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [searchMode, setSearchMode] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<string[]>([])
    const [searching, setSearching] = useState(false)
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const requestIdRef = useRef(0)

    const loadDirectory = useCallback(
        async (dir: string, opts?: { force?: boolean }) => {
            if (!connection?.url || !connection?.token) return
            if (!opts?.force) {
                const cached = cachedEntries(connection.url, projectId!, dir)
                if (cached) {
                    setEntries(cached)
                    setLoading(false)
                    return
                }
            }
            setLoading(true)
            setError(null)
            try {
                const listed = await listDirectory(connection.url, connection.token, dir || undefined)
                setCachedEntries(connection.url, projectId!, dir, listed)
                setEntries(listed)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load directory")
                setEntries([])
            } finally {
                setLoading(false)
            }
        },
        [connection?.url, connection?.token, projectId]
    )

    const loadStatuses = useCallback(async () => {
        if (!connection?.url || !connection?.token) return
        const cached = cachedStatuses(connection.url, projectId!)
        if (cached) {
            setStatuses(cached)
            return
        }
        const fetched = await fetchFileStatuses(connection.url, connection.token)
        setCachedStatuses(connection.url, projectId!, fetched)
        setStatuses(fetched)
    }, [connection?.url, connection?.token, projectId])

    useEffect(() => {
        loadDirectory(path)
        loadStatuses()
    }, [loadDirectory, loadStatuses])

    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        }
    }, [])

    const runSearch = useCallback(
        async (q: string) => {
            const id = ++requestIdRef.current
            if (!connection?.url || !connection?.token || q.trim().length < 2) {
                setResults([])
                setSearching(false)
                return
            }
            setSearching(true)
            const found = await searchFiles(connection.url, connection.token, q.trim())
            if (id === requestIdRef.current) {
                setResults(found)
                setSearching(false)
            }
        },
        [connection?.url, connection?.token]
    )

    const onQueryChange = useCallback(
        (text: string) => {
            setQuery(text)
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
            if (text.trim().length < 2) {
                setResults([])
                setSearching(false)
                return
            }
            setSearching(true)
            searchTimerRef.current = setTimeout(() => runSearch(text), SEARCH_DEBOUNCE_MS)
        },
        [runSearch]
    )

    const exitSearch = useCallback(() => {
        setSearchMode(false)
        setQuery("")
        setResults([])
        setSearching(false)
    }, [])

    const onRefresh = useCallback(async () => {
        if (!connection?.url || !projectId) return
        setRefreshing(true)
        invalidatePath(connection.url, projectId, path)
        await Promise.all([loadDirectory(path, { force: true }), loadStatuses()])
        setRefreshing(false)
    }, [connection?.url, projectId, path, loadDirectory, loadStatuses])

    const openPath = useCallback(
        (entry: FileEntry) => {
            if (entry.type === "directory") {
                setPath(entry.path)
            } else {
                router.push({ pathname: `/project/${projectId}/viewer`, params: { path: entry.path } })
            }
        },
        [router, projectId]
    )

    const statusFor = useCallback(
        (entry: FileEntry): FileStatusKind | null => statuses[entry.path] ?? null,
        [statuses]
    )

    const renderItem = useCallback(
        ({ item, index }: { item: FileEntry; index: number }) => {
            const isDir = item.type === "directory"
            const name = item.path.split("/").pop() ?? item.path
            const status = statusFor(item)
            return (
                <Pressable
                    className={`flex-row items-center gap-3 px-4 py-3 border-b border-border/50 active:bg-accent/30 ${
                        index === entries.length - 1 ? "border-b-0" : ""
                    }`}
                    onPress={() => openPath(item)}
                >
                    <View className="w-10 h-10 rounded-lg bg-accent/60 items-center justify-center">
                        {isDir ? (
                            <FolderIcon size={18} color={t.mutedForeground} />
                        ) : (
                            <FileIcon size={18} color={t.mutedForeground} />
                        )}
                    </View>
                    <View className="flex-1 gap-0.5">
                        <Text className="text-sm font-medium line-clamp-1">{name}</Text>
                    </View>
                    {status && (
                        <View className="px-2 py-0.5 rounded-full border border-border/50">
                            <Text className="text-[10px] font-medium" style={{ color: STATUS_COLORS[status] }}>
                                {status[0].toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <ChevronRightIcon size={16} color={t.mutedForeground} />
                </Pressable>
            )
        },
        [entries.length, theme, t.mutedForeground, openPath, statusFor]
    )

    const renderResultItem = useCallback(
        ({ item, index }: { item: string; index: number }) => (
            <Pressable
                className={`flex-row items-center gap-3 px-4 py-3 border-b border-border/50 active:bg-accent/30 ${
                    index === results.length - 1 ? "border-b-0" : ""
                }`}
                onPress={() =>
                    router.push({ pathname: `/project/${projectId}/viewer`, params: { path: item } })
                }
            >
                <View className="w-10 h-10 rounded-lg bg-accent/60 items-center justify-center">
                    <FileIcon size={18} color={t.mutedForeground} />
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-medium line-clamp-1">
                        {item.split("/").pop() ?? item}
                    </Text>
                    <Text className="text-xs text-muted-foreground line-clamp-1">{item}</Text>
                </View>
            </Pressable>
        ),
        [results.length, theme, t.mutedForeground, router, projectId]
    )

    const crumbs = useMemo(() => buildBreadcrumbs(path), [path])

    if (!connected) {
        return (
            <View className="flex-1 bg-background items-center justify-center px-8">
                <Text className="text-sm text-muted-foreground text-center">Not connected</Text>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-background">
            <View
                className="flex-row items-center gap-2 border-b border-accent px-4"
                style={{ paddingTop: insets.top + 10, paddingBottom: 10 }}
            >
                <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
                    <ArrowLeftIcon size={20} color={t.foreground} />
                </Button>
                {searchMode ? (
                    <View className="flex-1 flex-row items-center gap-2 rounded-md border border-border/60 bg-background px-3 h-10">
                        <RNTextInput
                            className="flex-1 text-base text-foreground"
                            placeholder="Find files..."
                            placeholderTextColor={t.mutedForeground}
                            value={query}
                            onChangeText={onQueryChange}
                            autoFocus
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                        <Pressable onPress={exitSearch} hitSlop={8}>
                            <XIcon size={16} color={t.mutedForeground} />
                        </Pressable>
                    </View>
                ) : (
                    <>
                        <Text className="text-base font-semibold flex-1">Files</Text>
                        <Button variant="ghost" className="w-10 h-10" onPress={() => setSearchMode(true)}>
                            <SearchIcon size={20} color={t.mutedForeground} />
                        </Button>
                    </>
                )}
            </View>

            {!searchMode && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="border-b border-accent/50"
                    contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
                >
                    {crumbs.map((crumb, i) => (
                        <View key={`${crumb.name}-${i}`} className="flex-row items-center">
                            {i > 0 && <ChevronRightIcon size={14} color={t.mutedForeground} />}
                            <Pressable
                                disabled={i === crumbs.length - 1}
                                className="px-2 py-1 active:bg-accent/50 rounded-md"
                                onPress={() => crumb.path !== null && setPath(crumb.path)}
                            >
                                <Text
                                    className={`text-sm ${
                                        i === crumbs.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"
                                    }`}
                                    numberOfLines={1}
                                >
                                    {crumb.name}
                                </Text>
                            </Pressable>
                        </View>
                    ))}
                </ScrollView>
            )}

            {searchMode ? (
                searching && results.length === 0 && query.trim().length >= 2 ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={t.mutedForeground} />
                        <Text className="text-xs text-muted-foreground mt-3">Searching files...</Text>
                    </View>
                ) : results.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8">
                        <Text className="text-lg font-semibold tracking-tight text-center mb-2">
                            {query.trim().length < 2 ? "Find a file" : "No matches"}
                        </Text>
                        <Text className="text-sm text-muted-foreground text-center leading-5">
                            {query.trim().length < 2
                                ? "Type at least 2 characters to search project files by name."
                                : "No files match your search."}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item}
                        renderItem={renderResultItem}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                        removeClippedSubviews
                        windowSize={7}
                    />
                )
            ) : loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={t.mutedForeground} />
                    <Text className="text-xs text-muted-foreground mt-3">Loading...</Text>
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-lg font-semibold tracking-tight text-center mb-2">Could not load directory</Text>
                    <Text className="text-sm text-muted-foreground text-center leading-5">{error}</Text>
                    <Button variant="secondary" size="sm" className="mt-4" onPress={() => loadDirectory(path, { force: true })}>
                        <Text className="text-sm">Retry</Text>
                    </Button>
                </View>
            ) : entries.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-16 h-16 rounded-full bg-accent items-center justify-center mb-6">
                        <FolderIcon size={28} color={t.mutedForeground} />
                    </View>
                    <Text className="text-lg font-semibold tracking-tight text-center mb-2">Empty folder</Text>
                    <Text className="text-sm text-muted-foreground text-center leading-5">This folder has no files.</Text>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(item) => item.path}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={7}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.mutedForeground} />
                    }
                />
            )}
        </View>
    )
}
