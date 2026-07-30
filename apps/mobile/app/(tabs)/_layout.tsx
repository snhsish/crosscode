import { BlurView } from "expo-blur"
import { Stack } from "expo-router"
import { useColorScheme } from "nativewind"
import * as React from "react"
import { Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { THEME } from "@/lib/theme"

export default function StackLayout() {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const insets = useSafeAreaInsets()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: THEME[theme].background,
          paddingBottom: insets.bottom,
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="user" />
    </Stack>
  )
}
