import { useEffect, useState } from "react"
import { View } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from "react-native-reanimated"
import { Text } from "@/components/ui/text"

function TypingDot({ delay }: { delay: number }) {
    const progress = useSharedValue(0)

    useEffect(() => {
        progress.value = withDelay(
            delay,
            withRepeat(
                withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
                -1,
                true
            )
        )
    }, [])

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ translateY: progress.value * -4 }],
    }))

    return (
        <Animated.View
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
            style={animatedStyle}
        />
    )
}

export function TypingDots() {
    return (
        <View className="flex-row items-center gap-1">
            <TypingDot delay={0} />
            <TypingDot delay={150} />
            <TypingDot delay={300} />
        </View>
    )
}

function formatElapsedTime(totalSeconds: number): string {
    if (totalSeconds < 60) return `${totalSeconds}s`
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}m ${seconds}s`
}

export function WorkingIndicator({ startedAt }: { startedAt: number }) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        setNow(Date.now())
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [startedAt])

    const totalSeconds = Math.max(0, Math.floor((now - startedAt) / 1000))

    return (
        <View className="flex-row items-center gap-2 px-4 py-1.5">
            <TypingDots />
            <Text className="text-xs text-muted-foreground">
                Working for {formatElapsedTime(totalSeconds)}
            </Text>
        </View>
    )
}
