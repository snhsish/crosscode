import { BlurView } from "expo-blur"
import { Tabs } from "expo-router"
import { useColorScheme } from "nativewind"
import * as React from "react"
import { Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { THEME } from "@/lib/theme"
import { Home, ScanQrCode, MessageSquare, User } from "lucide-react-native"

function TabIcon({ icon: Icon, focused }: { icon: typeof Home; focused: boolean }) {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"

  return (
    <Icon
      size={focused ? 24 : 22}
      color={focused ? THEME[theme].foreground : THEME[theme].mutedForeground}
    />
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
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: THEME[theme].background,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 6,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
          },
          tabBarBackground: () => (
            <BlurView
              tint={theme === "dark" ? "dark" : "light"}
              intensity={90}
              style={{
                flex: 1,
                backgroundColor: THEME[theme].background,
              }}
            />
          ),
          tabBarActiveTintColor: THEME[theme].foreground,
          tabBarInactiveTintColor: THEME[theme].mutedForeground,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            fontFamily: Platform.select({ default: undefined }),
          },
          tabBarItemStyle: {
            paddingVertical: 2,
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
          name="sessions"
          options={{
            title: "Sessions",
            tabBarIcon: ({ focused }) => <TabIcon icon={MessageSquare} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: "Scan QR",
            tabBarIcon: ({ focused }) => <TabIcon icon={ScanQrCode} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="user"
          options={{
            title: "Account",
            tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} />,
          }}
        />
      </Tabs>
    </>
  )
}


