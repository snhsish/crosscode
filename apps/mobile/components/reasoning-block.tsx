import { memo, useEffect, useRef, useState } from "react"
import { Pressable, View } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from "react-native-reanimated"
import { BrainIcon, ChevronDownIcon } from "lucide-react-native"
import { THEME } from "@/lib/theme"
import { Text } from "@/components/ui/text"

interface ReasoningBlockProps {
    text: string
    streaming?: boolean
    startedAt?: number
    theme: "light" | "dark"
}

function formatThoughtDuration(totalSeconds: number): string {
    const rounded = Math.max(1, Math.round(totalSeconds))
    if (rounded < 60) return `${rounded} second${rounded === 1 ? "" : "s"}`
    const minutes = Math.floor(rounded / 60)
    const seconds = rounded % 60
    return `${minutes}m ${seconds}s`
}

export const ReasoningBlock = memo(function ReasoningBlock({ text, streaming, startedAt, theme }: ReasoningBlockProps) {
    const [expanded, setExpanded] = useState(false)
    const [elapsed, setElapsed] = useState<number | null>(null)
    const startRef = useRef<number | null>(null)

    useEffect(() => {
        if (streaming) {
            if (startRef.current === null) {
                startRef.current = startedAt ?? Date.now()
            }
        } else if (startRef.current !== null) {
            setElapsed((Date.now() - startRef.current) / 1000)
            startRef.current = null
        }
    }, [streaming, startedAt])

    const progress = useSharedValue(0)
    const shine = useSharedValue(streaming ? 1 : 0)
    const chevron = useSharedValue(0)

    useEffect(() => {
        if (streaming) {
            shine.value = withRepeat(
                withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.quad) }),
                -1,
                true
            )
        } else {
            shine.value = withTiming(1, { duration: 200 })
        }
    }, [streaming])

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        maxHeight: progress.value * 4000,
        overflow: "hidden" as const,
    }))

    const shineStyle = useAnimatedStyle(() => ({
        opacity: shine.value,
    }))

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${chevron.value * 180}deg` }],
    }))

    const toggle = () => {
        const next = !expanded
        setExpanded(next)
        chevron.value = withTiming(next ? 1 : 0, { duration: 200 })
        progress.value = withTiming(next ? 1 : 0, { duration: 200 })
    }

    return (
        <View>
            <Pressable onPress={toggle} className="flex-row items-center gap-1.5 py-0.5 active:opacity-70">
                <BrainIcon size={13} color={THEME[theme].mutedForeground} />
                {streaming ? (
                    <Animated.View style={shineStyle}>
                        <Text className="text-xs text-muted-foreground font-medium">Thinking...</Text>
                    </Animated.View>
                ) : (
                    <>
                        <Text className="text-xs text-muted-foreground font-medium">
                            Thought{elapsed != null ? ` for ${formatThoughtDuration(elapsed)}` : ""}
                        </Text>
                        <Animated.View style={chevronStyle}>
                            <ChevronDownIcon size={12} color={THEME[theme].mutedForeground} />
                        </Animated.View>
                    </>
                )}
            </Pressable>
            <Animated.View style={animatedStyle} pointerEvents={expanded ? "auto" : "none"}>
                <View className="ml-2 pl-3 border-l border-border/60 pb-1.5">
                    <Text className="text-xs text-muted-foreground leading-relaxed">
                        {text}
                    </Text>
                </View>
            </Animated.View>
        </View>
    )
})
