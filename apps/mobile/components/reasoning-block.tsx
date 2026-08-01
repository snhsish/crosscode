import { Pressable, View } from "react-native"
import { useState } from "react"
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"
import { Text } from "./ui/text"

interface ReasoningBlockProps {
  text: string
  duration?: number
}

export function ReasoningBlock({ text, duration }: ReasoningBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const progress = useSharedValue(0)

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

  return (
    <View className="overflow-hidden rounded-lg border border-accent/50">
      <Pressable
        onPress={toggle}
        className="flex-row items-center gap-1.5 px-2 py-1.5 active:opacity-70"
      >
        <Text className="text-xs text-muted-foreground font-mono">
          {expanded ? "─" : "+"}
        </Text>
        <Text className="text-xs text-muted-foreground font-medium">
          Thought
        </Text>
        {duration != null && (
          <Text className="text-xs text-muted-foreground">
            for {duration.toFixed(1)}s
          </Text>
        )}
      </Pressable>
      <Animated.View style={animatedStyle}>
        {expanded && (
          <View className="px-2 pb-2">
            <Text className="text-xs text-muted-foreground leading-relaxed">
              {text}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  )
}
