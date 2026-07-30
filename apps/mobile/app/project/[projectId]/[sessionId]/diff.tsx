import { useEffect, useMemo, useRef } from "react"
import { ScrollView, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import { ArrowLeftIcon } from "lucide-react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { computeLineDiff, countChanges, DiffLine } from "@/lib/diff"
import { useDiffStore } from "@/store/diff.store"

export default function DiffPage() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const theme = colorScheme ?? "light"
    const { projectId, sessionId } = useLocalSearchParams<{ projectId: string; sessionId: string }>()
    const currentDiff = useDiffStore((s) => s.currentDiff)
    const clearDiff = useDiffStore((s) => s.clearDiff)
    const scrollRef = useRef<ScrollView>(null)

    useEffect(() => {
        return () => clearDiff()
    }, [])

    const diffLines = useMemo(() => {
        if (!currentDiff) return []
        return computeLineDiff(currentDiff.oldString, currentDiff.newString)
    }, [currentDiff])

    const { additions, deletions } = useMemo(() => countChanges(diffLines), [diffLines])

    if (!currentDiff) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-sm text-muted-foreground">No diff data</Text>
            </View>
        )
    }

    const isDark = theme === "dark"
    const fileName = currentDiff.filePath.split("/").pop() ?? currentDiff.filePath
    const addColor = isDark ? "#86efac" : "#166534"
    const delColor = isDark ? "#fca5a5" : "#991b1b"
    const addBg = isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)"
    const delBg = isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)"
    const ctxColor = isDark ? "#a1a1aa" : "#52525b"
    const lineNumColor = isDark ? "#3f3f46" : "#e4e4e7"

    let oldLineNum = 0
    let newLineNum = 0

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
                        {currentDiff.filePath}
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

            <ScrollView
                ref={scrollRef}
                horizontal
                style={{ paddingBottom: insets.bottom + 10 }}
                contentContainerStyle={{ minWidth: "100%" }}
            >
                <View style={{ minWidth: "100%" }}>
                    {diffLines.map((line, i) => {
                        let oldNum: string | undefined
                        let newNum: string | undefined

                        if (line.type === "context") {
                            oldLineNum++
                            newLineNum++
                            oldNum = String(line.oldLine ?? oldLineNum)
                            newNum = String(line.newLine ?? newLineNum)
                        } else if (line.type === "remove") {
                            oldLineNum++
                            oldNum = String(line.oldLine ?? oldLineNum)
                        } else {
                            newLineNum++
                            newNum = String(line.newLine ?? newLineNum)
                        }

                        const bg =
                            line.type === "add" ? addBg : line.type === "remove" ? delBg : "transparent"
                        const textColor =
                            line.type === "add" ? addColor : line.type === "remove" ? delColor : ctxColor
                        const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " "

                        return (
                            <View key={i} style={{ backgroundColor: bg }} className="flex-row">
                                <View style={{ minWidth: 36, paddingHorizontal: 4 }} className="items-end border-r border-accent/30">
                                    <Text
                                        className="text-xs font-mono leading-5"
                                        style={{ color: lineNumColor }}
                                    >
                                        {oldNum ?? ""}
                                    </Text>
                                </View>
                                <View style={{ minWidth: 36, paddingHorizontal: 4 }} className="items-end border-r border-accent/30">
                                    <Text
                                        className="text-xs font-mono leading-5"
                                        style={{ color: lineNumColor }}
                                    >
                                        {newNum ?? ""}
                                    </Text>
                                </View>
                                <View style={{ minWidth: 16, paddingHorizontal: 4 }}>
                                    <Text
                                        className="text-xs font-mono leading-5"
                                        style={{ color: textColor }}
                                    >
                                        {prefix}
                                    </Text>
                                </View>
                                <View style={{ paddingHorizontal: 4, flexShrink: 0 }}>
                                    <Text
                                        className="text-xs font-mono leading-5"
                                        style={{ color: textColor }}
                                    >
                                        {line.content || " "}
                                    </Text>
                                </View>
                            </View>
                        )
                    })}
                </View>
            </ScrollView>
        </View>
    )
}
