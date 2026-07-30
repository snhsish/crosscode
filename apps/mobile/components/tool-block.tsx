import { LayoutAnimation, Platform, Pressable, UIManager, View } from "react-native"
import { useState } from "react"
import { Text } from "./ui/text"

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

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

export function ToolBlock({ name, status, details, command }: ToolBlockProps) {
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
        <Text className="text-xs text-muted-foreground">
          Tool: <Text className="font-medium">{name}</Text>
          <Text> ({status})</Text>
        </Text>
      </Pressable>
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
    </View>
  )
}
