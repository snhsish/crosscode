import { memo, useState } from "react"
import { Pressable, View } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"
import { Text } from "./ui/text"

interface Detail {
  label: string
  content: unknown
}

interface ToolBlockProps {
  name: string
  status: string
  details?: Detail[]
  command?: string
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const ToolBlock = memo(function ToolBlock({ name, status, details, command }: ToolBlockProps) {
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
        <Text className="text-xs text-muted-foreground">
          Tool: <Text className="font-medium">{name}</Text>
          <Text> ({status})</Text>
        </Text>
      </Pressable>
      <Animated.View style={animatedStyle}>
        {expanded && (command || (details && details.length > 0)) && (
          <View className="px-2 pb-2 gap-2">
            {command && (
              <View className="bg-black/5 dark:bg-white/5 rounded-md px-2 py-1.5 border border-accent/20">
                <Text className="text-xs text-foreground font-mono leading-relaxed">
                  {command}
                </Text>
              </View>
            )}
            {details && details.length > 0 && details.map((detail, i) => (
              <View key={i}>
                <Text className="text-xs text-muted-foreground font-medium mb-0.5">
                  {detail.label}
                </Text>
                <View className="bg-muted/30 rounded-md px-2 py-1.5">
                  <Text className="text-xs text-muted-foreground font-mono leading-relaxed">
                    {formatValue(detail.content)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  )
})
