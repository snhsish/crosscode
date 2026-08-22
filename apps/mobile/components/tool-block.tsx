import { memo, useState } from "react"
import { Pressable, View } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"
import { WrenchIcon, ChevronDownIcon } from "lucide-react-native"
import { THEME } from "@/lib/theme"
import { Text } from "./ui/text"
import { ShimmerText } from "./shimmer-text"

interface Detail {
  label: string
  content: unknown
}

interface ToolBlockProps {
  name: string
  status: string
  details?: Detail[]
  command?: string
  theme?: "light" | "dark"
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatToolName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export const ToolBlock = memo(function ToolBlock({ name, status, details, command, theme = "dark" }: ToolBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const progress = useSharedValue(0)
  const chevron = useSharedValue(0)

  const isFailed = status === "error"
  const isDone = status === "result" || status === "completed"
  const inProgress = !isFailed && !isDone

  const dotColor = isFailed ? "#ef4444" : isDone ? "#22c55e" : "#f59e0b"

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxHeight: progress.value * 2000,
    overflow: "hidden" as const,
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

  const hasContent = !!command || (!!details && details.length > 0)

  return (
    <View>
      <Pressable onPress={toggle} className="flex-row items-center gap-1.5 py-0.5 active:opacity-70">
        <WrenchIcon size={13} color={THEME[theme].mutedForeground} />
        {inProgress ? (
          <ShimmerText
            text={`Tool Call: ${formatToolName(name)}`}
            baseColor={THEME[theme].mutedForeground}
            shineColor={THEME[theme].foreground}
          />
        ) : (
          <Text className="text-xs text-muted-foreground font-medium">
            Tool Call: {formatToolName(name)}
          </Text>
        )}
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />
        {!inProgress && hasContent && (
          <Animated.View style={chevronStyle}>
            <ChevronDownIcon size={12} color={THEME[theme].mutedForeground} />
          </Animated.View>
        )}
      </Pressable>
      <Animated.View style={animatedStyle} pointerEvents={expanded ? "auto" : "none"}>
        {expanded && hasContent && (
          <View className="ml-2 pl-3 border-l border-border/60 pb-1.5 gap-2">
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
