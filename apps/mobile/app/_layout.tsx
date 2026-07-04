import "../global.css"

import { PortalHost } from "@rn-primitives/portal"
import { ThemeProvider } from "@react-navigation/native"
import { useFonts } from "@expo-google-fonts/manrope"
import { Manrope_400Regular } from "@expo-google-fonts/manrope"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useColorScheme } from "nativewind"
import * as React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { NAV_THEME } from "@/lib/theme"

export default function RootLayout() {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const [fontsLoaded] = useFonts({ Manrope: Manrope_400Regular })

  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <ThemeProvider value={NAV_THEME[theme]}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }} />
        <PortalHost />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
