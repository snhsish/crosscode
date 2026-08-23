import { useCallback, useMemo } from "react"
import { FlatList, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import ArrowLeftIcon from "lucide-react-native/dist/esm/icons/arrow-left"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { computeLineDiff, computePatchDiff, countChanges, DiffLine } from "@/lib/diff"
import { useDiffStore } from "@/store/diff.store"

export default function DiffPage() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const theme = colorScheme ?? "light"
    const { projectId, sessionId } = useLocalSearchParams<{ projectId: string; sessionId: string }>()
    const currentDiff = useDiffStore((s) => s.currentDiff)

    const diffLines = useMemo(() => {
        if (!currentDiff) return []
        return currentDiff.patch
            ? computePatchDiff(currentDiff.patch)
            : computeLineDiff(currentDiff.oldString, currentDiff.newString)
    }, [currentDiff])

    const { additions, deletions } = useMemo(() => countChanges(diffLines), [diffLines])

    const isDark = theme === "dark"
    const colors = useMemo(() => ({
        addColor: isDark ? "#86efac" : "#166534",
        delColor: isDark ? "#fca5a5" : "#991b1b",
        addBg: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)",
        delBg: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
        ctxColor: isDark ? "#a1a1aa" : "#52525b",
        lineNumColor: isDark ? "#3f3f46" : "#e4e4e7",
    }), [isDark])

    const renderLine = useCallback(({ item: line, index }: { item: DiffLine; index: number }) => {
        let oldNum: string | undefined
        let newNum: string | undefined

        if (line.type === "context") {
            oldNum = String(line.oldLine ?? "")
            newNum = String(line.newLine ?? "")
        } else if (line.type === "remove") {
            oldNum = String(line.oldLine ?? "")
        } else {
            newNum = String(line.newLine ?? "")
        }

        const bg = line.type === "add" ? colors.addBg : line.type === "remove" ? colors.delBg : "transparent"
        const textColor = line.type === "add" ? colors.addColor : line.type === "remove" ? colors.delColor : colors.ctxColor
        const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " "

        return (
            <View style={{ backgroundColor: bg }} className="flex-row">
                <View style={{ minWidth: 36, paddingHorizontal: 4 }} className="items-end border-r border-accent/30">
                    <Text className="text-xs font-mono leading-5" style={{ color: colors.lineNumColor }}>
                        {oldNum ?? ""}
                    </Text>
                </View>
                <View style={{ minWidth: 36, paddingHorizontal: 4 }} className="items-end border-r border-accent/30">
                    <Text className="text-xs font-mono leading-5" style={{ color: colors.lineNumColor }}>
                        {newNum ?? ""}
                    </Text>
                </View>
                <View style={{ minWidth: 16, paddingHorizontal: 4 }}>
                    <Text className="text-xs font-mono leading-5" style={{ color: textColor }}>
                        {prefix}
                    </Text>
                </View>
                <View style={{ paddingHorizontal: 4, flexShrink: 0 }}>
                    <Text className="text-xs font-mono leading-5" style={{ color: textColor }}>
                        {line.content || " "}
                    </Text>
                </View>
            </View>
        )
    }, [colors])

    const keyExtractor = useCallback((line: DiffLine, index: number) => {
        const lineNum = line.type === "context" ? line.newLine : line.type === "add" ? line.newLine : line.oldLine
        return `${line.type}-${lineNum}-${index}`
    }, [])

    if (!currentDiff) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-sm text-muted-foreground">No diff data</Text>
            </View>
        )
    }

    const filePath = typeof currentDiff.filePath === "string" ? currentDiff.filePath : "Unknown file"
    const fileName = filePath.split("/").pop() ?? filePath

    return (
        <View className="flex-1 bg-background">
            <View
                className="flex-row items-center gap-2 border-b border-accent px-4"
                style={{ paddingTop: insets.top + 10, paddingBottom: 10 }}
            >
                <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
                    <ArrowLeftIcon size={20} color={THEME[theme].foreground} />
                </Button>
                <View className="flex-1">
                    <Text className="text-sm font-semibold" numberOfLines={1}>
                        {fileName}
                    </Text>
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        {filePath}
                    </Text>
                </View>
                {additions > 0 && (
                    <Text className="text-xs font-mono" style={{ color: "#22c55e" }}>
                        +{additions}
                    </Text>
                )}
                {deletions > 0 && (
                    <Text className="text-xs font-mono" style={{ color: "#ef4444" }}>
                        -{deletions}
                    </Text>
                )}
            </View>

            <FlatList
                data={diffLines}
                renderItem={renderLine}
                keyExtractor={keyExtractor}
                contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
                removeClippedSubviews
                maxToRenderPerBatch={20}
                windowSize={10}
                initialNumToRender={30}
            />
        </View>
    )
}
