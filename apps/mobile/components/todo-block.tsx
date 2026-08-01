import { Pressable, View } from "react-native"
import { memo, useState } from "react"
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"
import { Text } from "./ui/text"
import { Checkbox } from "./ui/checkbox"

export interface TodoItem {
  content: string
  status: string
  priority?: string
}

interface TodoBlockProps {
  items: TodoItem[]
}

export const TodoBlock = memo(function TodoBlock({ items }: TodoBlockProps) {
  const [expanded, setExpanded] = useState(true)
  const completed = items.filter((i) => i.status === "completed").length
  const progress = useSharedValue(1)

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
          Todos
        </Text>
        <Text className="text-xs text-muted-foreground">
          ({completed}/{items.length})
        </Text>
      </Pressable>
      <Animated.View style={animatedStyle}>
        {expanded && (
          <View className="px-2 pb-2 gap-1.5">
            {items.map((item, i) => (
              <View key={i} className="flex-row items-start gap-2">
                <Checkbox
                  checked={item.status === "completed"}
                  onCheckedChange={() => {}}
                  disabled
                  className="mt-0.5"
                />
                <Text
                  className={`text-xs flex-1 leading-relaxed ${
                    item.status === "completed"
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {item.content}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  )
})
