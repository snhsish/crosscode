import { View, ScrollView, Switch, AppState, Linking, Alert, TouchableOpacity } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Bug, Moon, Sun, LogOut, User as UserIcon } from "lucide-react-native"
import { useRouter } from "expo-router"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import Constants from "expo-constants"
import { useSettings } from "@/store/settings.store"
import { useConnections } from "@/store/connection.store"
import { useAuth } from "@/store/auth.store"
import React from "react"

const SUPPORT_EMAIL = "support@crosscode.app"

export default function UserPage() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme, toggleColorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"

  const { user, sessionToken, logout, isLoggedIn } = useAuth()

  const clearLastRemoteUrlOnClose = useSettings((s) => s.clearLastRemoteUrlOnClose)
  const setClearLastRemoteUrlOnClose = useSettings((s) => s.setClearLastRemoteUrlOnClose)
  const notifications = useSettings((s) => s.notifications)
  const setNotifications = useSettings((s) => s.setNotifications)
  const emailForUpdates = useSettings((s) => s.emailForUpdates)
  const setEmailForUpdates = useSettings((s) => s.setEmailForUpdates)

  const [emailInput, setEmailInput] = React.useState(emailForUpdates)
  const [emailSaved, setEmailSaved] = React.useState(false)

  const setCurrent = useConnections((s) => s.setCurrent)

  React.useEffect(() => {
    if (!clearLastRemoteUrlOnClose) return

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        setCurrent("" as never)
      }
    })

    return () => subscription.remove()
  }, [clearLastRemoteUrlOnClose])

  const handleSaveEmail = () => {
    const trimmed = emailInput.trim()
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert("Invalid email", "Please enter a valid email address.")
      return
    }
    setEmailForUpdates(trimmed)
    setEmailSaved(true)
    setTimeout(() => setEmailSaved(false), 2000)
  }

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            logout()
            router.replace("/(tabs)/scan")
          },
        },
      ]
    )
  }

  const openLink = (url: string) => Linking.openURL(url)

  const version = Constants.expoConfig?.version ?? "1.0.0"
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? undefined
  const versionDisplay = buildNumber ? `${version} (${buildNumber})` : version

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-4">
        <Text className="text-2xl font-semibold tracking-tight">Account</Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your CrossCode account</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoggedIn && user ? (
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-full bg-primary items-center justify-center">
                  <UserIcon size={24} color={THEME[theme].background} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium">{user.email}</Text>
                  <Text className="text-sm text-muted-foreground capitalize">{user.tier} tier</Text>
                </View>
                <Button variant="ghost" size="sm" onPress={handleLogout}>
                  <LogOut size={18} color={THEME[theme].mutedForeground} />
                </Button>
              </View>
            ) : (
              <View className="items-center py-4 gap-3">
                <Text className="text-sm text-muted-foreground text-center">
                  Scan a QR code from the terminal to login
                </Text>
                <Button onPress={() => router.push("/(tabs)/scan")}>
                  <Text>Scan QR to Login</Text>
                </Button>
              </View>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the app look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center gap-2">
                  {colorScheme === "dark" ? (
                    <Moon size={18} color={THEME[theme].foreground} />
                  ) : (
                    <Sun size={18} color={THEME[theme].foreground} />
                  )}
                  <Text className="text-sm">Dark mode</Text>
                </View>
                <Text className="text-xs text-muted-foreground mt-1">
                  Toggle between light and dark color themes
                </Text>
              </View>
              <Switch
                value={colorScheme === "dark"}
                onValueChange={toggleColorScheme}
                trackColor={{ false: THEME[theme].border, true: THEME[theme].primary }}
                thumbColor={THEME[theme].foreground}
              />
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Remote connection preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 mr-4">
                <Text className="text-sm">Clear last remote session URL after closing app</Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Removes the stored connection URL when the app goes to background
                </Text>
              </View>
              <Switch
                value={clearLastRemoteUrlOnClose}
                onValueChange={setClearLastRemoteUrlOnClose}
                trackColor={{ false: THEME[theme].border, true: THEME[theme].primary }}
                thumbColor={THEME[theme].foreground}
              />
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage app notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 mr-4">
                <Text className="text-sm">Enable notifications</Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Receive alerts for connection status and session activity
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: THEME[theme].border, true: THEME[theme].primary }}
                thumbColor={THEME[theme].foreground}
              />
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Updates</CardTitle>
            <CardDescription>Stay informed about new features and improvements</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center gap-2">
              <Input
                className="flex-1"
                placeholder="your@email.com"
                placeholderTextColor={THEME[theme].mutedForeground}
                value={emailInput}
                onChangeText={setEmailInput}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Button size="sm" onPress={handleSaveEmail} disabled={emailSaved}>
                <Text>{emailSaved ? "Saved" : "Save"}</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug</CardTitle>
            <CardDescription>Development and troubleshooting tools</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 flex-row items-center gap-2">
                <Bug size={18} color={THEME[theme].foreground} />
                <View>
                  <Text className="text-sm">Debug logs</Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    View app logs and diagnostics
                  </Text>
                </View>
              </View>
              <Button variant="ghost" size="sm" onPress={() => router.push("/debug-logs")}>
                <ExternalLink size={16} color={THEME[theme].mutedForeground} />
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View>
              <Text className="text-sm text-muted-foreground">Version</Text>
              <Text className="text-base">{versionDisplay}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm">Privacy Policy</Text>
              <Button variant="ghost" size="sm" onPress={() => openLink("https://crosscode.app/privacy")}>
                <ExternalLink size={16} color={THEME[theme].mutedForeground} />
              </Button>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm">Terms of Use</Text>
              <Button variant="ghost" size="sm" onPress={() => openLink("https://crosscode.app/terms")}>
                <ExternalLink size={16} color={THEME[theme].mutedForeground} />
              </Button>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm">Support</Text>
              <Button variant="ghost" size="sm" onPress={() => openLink("https://crosscode.app/support")}>
                <ExternalLink size={16} color={THEME[theme].mutedForeground} />
              </Button>
            </View>
          </CardContent>
        </Card>

        <View className="items-center pt-4 pb-8">
          <Text className="text-xs text-muted-foreground">
            For help, contact us at{" "}
            <Text
              className="text-xs text-primary"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              {SUPPORT_EMAIL}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
