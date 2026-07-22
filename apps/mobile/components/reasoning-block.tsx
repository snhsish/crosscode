import { LayoutAnimation, Platform, Pressable, UIManager, View } from "react-native"
import { useState } from "react"
import { Text } from "./ui/text"

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface ReasoningBlockProps {
  text: string
  duration?: number
}

export function ReasoningBlock({ text, duration }: ReasoningBlockProps) {
  const [expanded, setExpanded] = useState(false)

  const toggle = () => {
    LayoutAnimation.configureNext({
      duration: 200,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    })
    setExpanded(!expanded)
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
      {expanded && (
        <View className="px-2 pb-2">
          <Text className="text-xs text-muted-foreground leading-relaxed">
            {text}
          </Text>
        </View>
      )}
    </View>
  )
}
