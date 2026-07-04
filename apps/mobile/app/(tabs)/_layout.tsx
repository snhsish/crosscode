import { Portal } from "@rn-primitives/portal"
import { Tabs } from "expo-router"
import { useColorScheme } from "nativewind"
import * as React from "react"
import { Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { THEME } from "@/lib/theme"
import { Home, ScanQrCode, LayoutGrid } from "lucide-react-native"

function TabIcon({ icon: Icon, focused }: { icon: typeof Home; focused: boolean }) {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const color = focused
    ? THEME[theme].foreground
    : THEME[theme].mutedForeground

  return (
    <View className="items-center justify-center gap-0.5">
      <Icon size={24} color={color} />
    </View>
  )
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const insets = useSafeAreaInsets()

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: THEME[theme].background,
            borderTopColor: THEME[theme].border,
          },
          tabBarActiveTintColor: THEME[theme].foreground,
          tabBarInactiveTintColor: THEME[theme].mutedForeground,
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: Platform.select({ default: undefined }),
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: "Projects",
            tabBarIcon: ({ focused }) => <TabIcon icon={LayoutGrid} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: "Scan QR",
            tabBarIcon: ({ focused }) => <TabIcon icon={ScanQrCode} focused={focused} />,
          }}
        />
      </Tabs>
    </>
  )
}


