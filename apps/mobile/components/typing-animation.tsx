import { useEffect, useRef } from "react"
import { View, Animated } from "react-native"

export function TypingDots() {
    const dot1 = useRef(new Animated.Value(0)).current
    const dot2 = useRef(new Animated.Value(0)).current
    const dot3 = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            )

        const anims = [
            animate(dot1, 0),
            animate(dot2, 150),
            animate(dot3, 300),
        ]

        anims.forEach((a) => a.start())
        return () => anims.forEach((a) => a.stop())
    }, [])

    const dotStyle = (dot: Animated.Value) => ({
        opacity: dot,
        transform: [
            {
                translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                }),
            },
        ],
    })

    return (
        <View className="flex-row items-center gap-1 px-3 py-2">
            <Animated.View
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                style={dotStyle(dot1)}
            />
            <Animated.View
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                style={dotStyle(dot2)}
            />
            <Animated.View
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                style={dotStyle(dot3)}
            />
        </View>
    )
}