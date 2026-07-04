import * as React from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/ui/text"

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1 items-center justify-center bg-background p-6" style={{ paddingTop: insets.top }}>
      <Text className="text-muted-foreground">Projects tab</Text>
    </View>
  )
}
