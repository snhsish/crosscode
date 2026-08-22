import { useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, ScrollView, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import { ArrowLeftIcon, FileQuestionIcon } from "lucide-react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { useConnections } from "@/store/connection.store"
import { isBinaryPath, languageFromPath, readFileContent } from "@/lib/file-browser"
import { CodeBlock } from "@/components/code-block"

const MAX_LINES = 5000

export default function ViewerPage() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const theme = (colorScheme ?? "light") as "light" | "dark"
    const t = THEME[theme]
    const { projectId, path } = useLocalSearchParams<{ projectId: string; path?: string }>()
    const filePath = typeof path === "string" ? path : ""

    const connections = useConnections((s) => s.connections)
    const current = useConnections((s) => s.current)
    const connection = connections.find((c) => c.id === current) ?? null

    const [content, setContent] = useState<string | null>(null)
    const [truncated, setTruncated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const binary = useMemo(() => isBinaryPath(filePath), [filePath])
    const language = useMemo(() => languageFromPath(filePath), [filePath])
    const fileName = filePath.split("/").pop() ?? filePath
    const directory = filePath.split("/").slice(0, -1).join("/")

    useEffect(() => {
        let cancelled = false
        async function load() {
            if (!connection?.url || !connection?.token || !filePath) return
            if (binary) {
                setLoading(false)
                return
            }
            try {
                const text = await readFileContent(connection.url, connection.token, filePath)
                if (cancelled) return
                const lines = text.split("\n")
                if (lines.length > MAX_LINES) {
                    setTruncated(true)
                    setContent(lines.slice(0, MAX_LINES).join("\n"))
                } else {
                    setContent(text)
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Failed to read file")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [connection?.url, connection?.token, filePath, binary])

    const headerTitle = fileName || "File"

    return (
        <View className="flex-1 bg-background">
            <View
                className="flex-row items-center gap-2 border-b border-accent px-4"
                style={{ paddingTop: insets.top + 10, paddingBottom: 10 }}
            >
                <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
                    <ArrowLeftIcon size={20} color={t.foreground} />
                </Button>
                <View className="flex-1">
                    <Text className="text-base font-semibold line-clamp-1">{headerTitle}</Text>
                    <Text className="text-xs text-muted-foreground line-clamp-1">{directory || "/"}</Text>
                </View>
                {!loading && content !== null && (
                    <View className="px-2.5 py-1.5 rounded-full bg-accent/60 border border-border/50">
                        <Text className="text-xs text-muted-foreground uppercase">{language}</Text>
                    </View>
                )}
            </View>

            {!connection || !projectId ? null : loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={t.mutedForeground} />
                    <Text className="text-xs text-muted-foreground mt-3">Loading file...</Text>
                </View>
            ) : binary ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-16 h-16 rounded-full bg-accent items-center justify-center mb-6">
                        <FileQuestionIcon size={28} color={t.mutedForeground} />
                    </View>
                    <Text className="text-lg font-semibold tracking-tight text-center mb-2">Binary file</Text>
                    <Text className="text-sm text-muted-foreground text-center leading-5">
                        This file type can't be previewed on mobile.
                    </Text>
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-lg font-semibold tracking-tight text-center mb-2">Could not read file</Text>
                    <Text className="text-sm text-muted-foreground text-center leading-5">{error}</Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
                >
                    <CodeBlock text={content ?? ""} language={language} theme={theme} />
                    {truncated && (
                        <Text className="text-xs text-muted-foreground text-center mt-3">
                            Preview limited to the first {MAX_LINES.toLocaleString()} lines.
                        </Text>
                    )}
                </ScrollView>
            )}
        </View>
    )
}
