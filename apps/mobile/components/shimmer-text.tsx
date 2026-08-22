import { useEffect, useId, useState } from "react"
import { Text as RNText, type TextStyle } from "react-native"
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated"
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg"

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

interface ShimmerTextProps {
    text: string
    active?: boolean
    baseColor: string
    shineColor: string
    fontSize?: number
    fontFamily?: string
    fontWeight?: TextStyle["fontWeight"]
}

export function ShimmerText({
    text,
    active = true,
    baseColor,
    shineColor,
    fontSize = 12,
    fontFamily = "Manrope_500Medium",
    fontWeight = "500",
}: ShimmerTextProps) {
    const [size, setSize] = useState<{ width: number; height: number } | null>(null)
    const gradientId = useId().replace(/:/g, "")
    const progress = useSharedValue(0)

    const width = size?.width ?? 0
    const band = Math.max(30, Math.min(width * 0.6, 140))

    useEffect(() => {
        if (!active) return
        progress.value = withRepeat(
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
            -1,
            false
        )
    }, [active])

    const gradientProps = useAnimatedProps(() => {
        const start = interpolate(progress.value, [0, 1], [-band, width])
        return { x1: start, x2: start + band }
    })

    if (!active) {
        return (
            <RNText style={{ fontSize, fontFamily, fontWeight, color: baseColor }}>
                {text}
            </RNText>
        )
    }

    if (!size) {
        return (
            <RNText
                style={{ fontSize, fontFamily, fontWeight, color: "transparent", opacity: 0 }}
                onLayout={(e) =>
                    setSize({
                        width: e.nativeEvent.layout.width,
                        height: e.nativeEvent.layout.height,
                    })
                }
            >
                {text}
            </RNText>
        )
    }

    return (
        <Svg width={width} height={size.height}>
            <Defs>
                <AnimatedLinearGradient
                    id={gradientId}
                    gradientUnits="userSpaceOnUse"
                    x1={-band}
                    y1={0}
                    x2={band}
                    y2={0}
                    animatedProps={gradientProps}
                >
                    <Stop offset="0" stopColor={baseColor} />
                    <Stop offset="0.5" stopColor={shineColor} />
                    <Stop offset="1" stopColor={baseColor} />
                </AnimatedLinearGradient>
            </Defs>
            <SvgText
                fill={`url(#${gradientId})`}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily={fontFamily}
                y={size.height - Math.round(fontSize * 0.22)}
            >
                {text}
            </SvgText>
        </Svg>
    )
}
