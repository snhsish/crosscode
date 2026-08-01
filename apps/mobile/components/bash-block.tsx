import { Platform, Pressable, View } from "react-native"
import { useState } from "react"
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"
import { TerminalIcon } from "lucide-react-native"
import { Text } from "./ui/text"
import { THEME } from "@/lib/theme"

interface BashBlockProps {
  command: string
  status: string
  output?: string
  workdir?: string
  description?: string
  theme: "light" | "dark"
}

function truncateOutput(output: string, maxLength: number = 2000): string {
  if (output.length <= maxLength) return output
  return output.slice(0, maxLength) + "\n... (truncated)"
}

export function BashBlock({ command, status, output, workdir, description, theme }: BashBlockProps) {
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

  const isDark = theme === "dark"
  const promptColor = "#7cfc00"
  const outputColor = isDark ? "#e0e0e0" : "#1e1e2e"
  const statusColor = status === "error" ? "#ef4444" : status === "result" ? "#22c55e" : "#f59e0b"

  return (
    <View className="overflow-hidden rounded-lg border border-accent/50">
      <Pressable
        onPress={toggle}
        className="flex-row items-center gap-1.5 px-2 py-1.5 active:opacity-70"
      >
        <TerminalIcon size={14} color={THEME[theme].mutedForeground ?? "#737373"} />
        <Text className="text-xs text-muted-foreground font-medium">
          bash
        </Text>
        {description && (
          <Text className="text-xs text-muted-foreground flex-1" numberOfLines={1}>
            {description}
          </Text>
        )}
        <View className="flex-1" />
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
        <Text className="text-xs text-muted-foreground font-mono ml-1">
          {expanded ? "─" : "+"}
        </Text>
      </Pressable>
      <Animated.View style={animatedStyle}>
        {expanded && (
          <View className="rounded-b-lg border-t border-accent/50 px-3 py-2">
            {workdir && (
              <Text className="text-xs font-mono mb-1" style={{ color: THEME[theme].mutedForeground }}>
                {workdir}
              </Text>
            )}
            <View className="flex-row">
              <Text className="text-xs font-mono" style={{ color: promptColor }}>
                $
              </Text>
              <Text className="text-xs font-mono flex-1 ml-2" style={{ color: outputColor }}>
                {command}
              </Text>
            </View>
            {output && (
              <View className="mt-2 border-t border-accent/20 pt-2">
                <Text
                  className="text-xs font-mono leading-relaxed"
                  style={{ color: THEME[theme].mutedForeground }}
                >
                  {truncateOutput(output)}
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  )
}
