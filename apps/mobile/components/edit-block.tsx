import { memo, useMemo, useState } from "react"
import { Pressable, View } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"
import FileEditIcon from "lucide-react-native/dist/esm/icons/file-pen"
import ExpandIcon from "lucide-react-native/dist/esm/icons/expand"
import { useRouter } from "expo-router"
import { Text } from "./ui/text"
import { THEME } from "@/lib/theme"
import { computeLineDiff, countChanges, DiffLine } from "@/lib/diff"
import { useDiffStore } from "@/store/diff.store"

interface EditBlockProps {
    filePath: string
    oldString: string
    newString: string
    status: string
    theme: "light" | "dark"
    projectId: string
    sessionId: string
}

export const EditBlock = memo(function EditBlock({ filePath, oldString, newString, status, theme, projectId, sessionId }: EditBlockProps) {
    const [expanded, setExpanded] = useState(false)
    const router = useRouter()
    const setDiff = useDiffStore((s) => s.setDiff)
    const progress = useSharedValue(0)

    const diffLines = useMemo(() => computeLineDiff(oldString, newString), [oldString, newString])
    const { additions, deletions } = useMemo(() => countChanges(diffLines), [diffLines])
    const statusColor = status === "error" ? "#ef4444" : status === "result" ? "#22c55e" : "#f59e0b"

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        maxHeight: progress.value * 2000,
        overflow: "hidden" as const,
    }))

    const toggle = () => {
        const next = !expanded
        setExpanded(next)
        progress.value = withTiming(next ? 1 : 0, { duration: 200 })
    }

    const openDiff = () => {
        setDiff({ filePath, oldString, newString })
        router.push(`/project/${projectId}/${sessionId}/diff`)
    }

    const fileName = filePath.split("/").pop() ?? filePath

    return (
        <View className="overflow-hidden rounded-lg border border-accent/50">
            <Pressable
                onPress={toggle}
                className="flex-row items-center gap-1.5 px-2 py-1.5 active:opacity-70"
            >
                <FileEditIcon size={14} color={THEME[theme].mutedForeground ?? "#737373"} />
                <Text className="text-xs text-muted-foreground font-medium flex-1" numberOfLines={1}>
                    {fileName}
                </Text>
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
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                <Text className="text-xs text-muted-foreground font-mono ml-1">
                    {expanded ? "─" : "+"}
                </Text>
            </Pressable>
            <Animated.View style={animatedStyle}>
                {expanded && (
                    <View className="rounded-b-lg border-t border-accent/50">
                        <View className="px-2 py-1.5 max-h-[200px]">
                            {diffLines.slice(0, 50).map((line, i) => (
                                <DiffLineView key={i} line={line} theme={theme} />
                            ))}
                            {diffLines.length > 50 && (
                                <Text className="text-xs text-muted-foreground text-center py-1">
                                    +{diffLines.length - 50} more lines
                                </Text>
                            )}
                        </View>
                        <Pressable
                            onPress={openDiff}
                            className="flex-row items-center justify-center gap-1.5 py-2 border-t border-accent/30 active:opacity-70"
                        >
                            <ExpandIcon size={12} color={THEME[theme].mutedForeground ?? "#737373"} />
                            <Text className="text-xs text-muted-foreground font-medium">
                                Open diff view
                            </Text>
                        </Pressable>
                    </View>
                )}
            </Animated.View>
        </View>
    )
})

function DiffLineView({ line, theme }: { line: DiffLine; theme: "light" | "dark" }) {
    const isDark = theme === "dark"
    if (line.type === "add") {
        return (
            <View style={{ backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)" }} className="flex-row px-1.5 py-0.5 rounded-sm mb-px">
                <Text className="text-xs font-mono w-4" style={{ color: "#22c55e" }}>+</Text>
                <Text className="text-xs font-mono flex-1" style={{ color: isDark ? "#86efac" : "#166534" }}>
                    {line.content || " "}
                </Text>
            </View>
        )
    }
    if (line.type === "remove") {
        return (
            <View style={{ backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)" }} className="flex-row px-1.5 py-0.5 rounded-sm mb-px">
                <Text className="text-xs font-mono w-4" style={{ color: "#ef4444" }}>-</Text>
                <Text className="text-xs font-mono flex-1" style={{ color: isDark ? "#fca5a5" : "#991b1b" }}>
                    {line.content || " "}
                </Text>
            </View>
        )
    }
    return (
        <View className="flex-row px-1.5 py-0.5 mb-px">
            <Text className="text-xs font-mono w-4 text-muted-foreground/40"> </Text>
            <Text className="text-xs font-mono flex-1 text-muted-foreground">
                {line.content || " "}
            </Text>
        </View>
    )
}
