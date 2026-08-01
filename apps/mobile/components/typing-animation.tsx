import { useEffect } from "react"
import { View } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from "react-native-reanimated"

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
        <View className="flex-row items-center gap-1 px-3 py-2">
            <TypingDot delay={0} />
            <TypingDot delay={150} />
            <TypingDot delay={300} />
        </View>
    )
}
