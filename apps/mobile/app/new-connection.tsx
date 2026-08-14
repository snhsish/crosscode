import * as React from "react"
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router"
import { View, Alert, ActivityIndicator } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { decodeQrPayload, decodeLoginQrPayload, decodeDeviceLinkQrPayload, detectQrPayloadType } from "@crosscode/shared"
import QrScanner from "@/components/qr-scanner"
import { Text } from "@/components/ui/text"
import { FlashlightIcon, FlashlightOffIcon } from "lucide-react-native"
import { Toggle } from "@/components/ui/toggle"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { useAuth } from "@/store/auth.store"
import { registerPushDevice } from "@/lib/account-notifications"
import { useSettings } from "@/store/settings.store"

const AUTH_SERVER_URL = "https://crosscode.site"

export default function NewConnectionScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ mode?: string }>()
  const isLoginMode = params.mode === "login"
  const insets = useSafeAreaInsets()
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "light"
  const [torch, setTorch] = React.useState<boolean>(false)
  const [claiming, setClaiming] = React.useState(false)
  const navigated = React.useRef(false)
  const login = useAuth((s) => s.login)

  useFocusEffect(
    React.useCallback(() => {
      navigated.current = false
    }, [])
  )

  const handleScan = async (data: string) => {
    if (navigated.current || claiming) return
    try {
      const payloadType = detectQrPayloadType(data)

      if (payloadType === "login") {
        const payload = decodeLoginQrPayload(data)
        login(
          {
            id: payload.email,
            email: payload.email,
            name: payload.name,
            tier: payload.tier,
          },
          payload.sessionToken
        )
        navigated.current = true
        Alert.alert("Logged in", `Welcome, ${payload.name}!`, [
          { text: "OK", onPress: () => router.replace("/(tabs)/user") },
        ])
      } else if (payloadType === "device-link") {
        const payload = decodeDeviceLinkQrPayload(data)
        navigated.current = true
        setClaiming(true)
        await claimDevice(payload.token, isLoginMode ? AUTH_SERVER_URL : payload.url)
      } else {
        const payload = decodeQrPayload(data)
        navigated.current = true
        router.push(`/connect?url=${encodeURIComponent(payload.url)}&token=${payload.token}` as any)
      }
    } catch {
      // Invalid QR code
    }
  }

  const claimDevice = async (token: string, serverUrl: string) => {
    try {
      const res = await fetch(`${serverUrl}/api/auth/device-link/claim?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceName: "Mobile Device" }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to claim device")
      }

      const data = await res.json()

      const accountRes = await fetch(`${serverUrl}/api/account`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (accountRes.ok) {
        const accountData = await accountRes.json()
        login(
          {
            id: accountData.user.id,
            email: accountData.user.email,
            name: accountData.user.name,
            tier: accountData.user.tier,
          },
          token,
          serverUrl
        )
        if (useSettings.getState().notifications) {
          await registerPushDevice(serverUrl, token)
        }
        Alert.alert("Device Linked", "Your phone has been linked to your account!", [
          { text: "OK", onPress: () => router.replace("/(tabs)/user") },
        ])
      } else {
        throw new Error("Failed to fetch account")
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to link device")
    } finally {
      setClaiming(false)
    }
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-8 pb-4">
        <Text className="text-3xl font-semibold tracking-tight">
          {isLoginMode ? "Login" : "New Connection"}
        </Text>
        <Text className="text-muted-foreground text-sm mt-1">
          {isLoginMode
            ? "Scan a QR code to login to your account"
            : "Scan a QR code to connect to a remote server"}
        </Text>
      </View>

      <View className="px-6 pb-6">
        <View className="bg-muted/50 rounded-2xl p-5 border border-border/50">
          <Text className="text-sm font-medium mb-4">
            {isLoginMode ? "How to login" : "How to connect"}
          </Text>
          <View className="gap-4">
            {isLoginMode ? (
              <>
                <View className="flex-row items-start gap-3">
                  <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                    <Text className="text-xs font-bold text-primary">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium leading-5">Visit the dashboard</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                      Go to <Text className="text-primary">crosscode.site/dashboard</Text> in your browser
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-start gap-3">
                  <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                    <Text className="text-xs font-bold text-primary">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium leading-5">Click "Login with Mobile"</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                      Find and click the login button on the dashboard page
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-start gap-3">
                  <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                    <Text className="text-xs font-bold text-primary">3</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium leading-5">Scan the QR code</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                      Point your camera at the QR code displayed on the website
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View className="flex-row items-start gap-3">
                  <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                    <Text className="text-xs font-bold text-primary">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium leading-5">Start the server</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                      Run <Text className="bg-muted text-foreground font-mono text-xs">npx crosscode</Text> in your project directory
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-start gap-3">
                  <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                    <Text className="text-xs font-bold text-primary">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium leading-5">Scan the QR code</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                      Point your camera at the QR code displayed in your terminal
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        {claiming ? (
          <View className="items-center gap-4">
            <ActivityIndicator size="large" color={THEME[theme].primary} />
            <Text className="text-sm text-muted-foreground">Linking device...</Text>
          </View>
        ) : (
          <QrScanner onScan={handleScan} torch={torch} />
        )}
      </View>

      <View className="items-center py-6">
        <Toggle pressed={torch} onPressedChange={setTorch}>
          {torch ? <FlashlightIcon size={20} color={THEME[theme].foreground} /> : <FlashlightOffIcon size={20} color={THEME[theme].foreground} />}
        </Toggle>
      </View>
    </View>
  )
}
