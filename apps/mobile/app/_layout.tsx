import "../global.css"

import { PortalHost } from "@rn-primitives/portal"
import { ThemeProvider } from "@react-navigation/native"
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope"
import { Stack, useRouter, useSegments } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useColorScheme } from "nativewind"
import * as React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import * as SplashScreen from "expo-splash-screen"

import { NAV_THEME } from "@/lib/theme"
import { useNotificationRouting } from "@/lib/notifications"
import { useSettings } from "@/store/settings.store"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  })
  const hasCompletedOnboarding = useSettings((state) => state.hasCompletedOnboarding)
  const [settingsHydrated, setSettingsHydrated] = React.useState(useSettings.persist.hasHydrated())
  useNotificationRouting()

  React.useEffect(() => {
    const unsubscribe = useSettings.persist.onFinishHydration(() => setSettingsHydrated(true))
    return unsubscribe
  }, [])

  React.useEffect(() => {
    if (!settingsHydrated || !fontsLoaded) return
    if (!hasCompletedOnboarding && segments[0] !== "onboarding") {
      router.replace("/onboarding")
    }
  }, [fontsLoaded, hasCompletedOnboarding, router, segments, settingsHydrated])

  React.useEffect(() => {
    if (fontsLoaded && settingsHydrated) {
      SplashScreen.hideAsync()
    } else {
      const timeout = setTimeout(() => SplashScreen.hideAsync(), 5000)
      return () => clearTimeout(timeout)
    }
  }, [fontsLoaded, settingsHydrated])

  if (!fontsLoaded || !settingsHydrated) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={NAV_THEME[theme]}>
          <StatusBar style={theme === "dark" ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false }} />
          <PortalHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
