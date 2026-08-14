import * as React from "react"
import { useFocusEffect, useRouter } from "expo-router"
import { View, Alert, ActivityIndicator } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { decodeDeviceLinkQrPayload, detectQrPayloadType } from "@crosscode/shared"
import QrScanner from "@/components/qr-scanner"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { FlashlightIcon, FlashlightOffIcon, ArrowLeft } from "lucide-react-native"
import { Toggle } from "@/components/ui/toggle"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { useAuth } from "@/store/auth.store"
import { registerPushDevice } from "@/lib/account-notifications"
import { useSettings } from "@/store/settings.store"

export default function LoginScannerScreen() {
  const router = useRouter()
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

      if (payloadType === "device-link") {
        const payload = decodeDeviceLinkQrPayload(data)
        navigated.current = true
        setClaiming(true)
        await claimDevice(payload.token, payload.url)
      } else {
        Alert.alert("Invalid QR", "Please scan a login QR code from the web dashboard.")
      }
    } catch {
      Alert.alert("Invalid QR", "Please scan a valid login QR code.")
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
        Alert.alert("Logged In", "You have been successfully logged in!", [
          { text: "OK", onPress: () => router.replace("/(tabs)/user") },
        ])
      } else {
        throw new Error("Failed to fetch account")
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to login")
      navigated.current = false
    } finally {
      setClaiming(false)
    }
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-4 flex-row items-center gap-2">
        <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
          <ArrowLeft size={25} color={THEME[theme].foreground} />
        </Button>
        <Text className="text-2xl font-semibold tracking-tight">Login Scanner</Text>
      </View>

      <View className="px-6 pb-4">
        <View className="bg-muted/50 rounded-2xl p-5 border border-border/50">
          <Text className="text-sm font-medium mb-4">How to login</Text>
          <View className="gap-4">
            <View className="flex-row items-start gap-3">
              <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-xs font-bold text-primary">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium leading-5">Open the web dashboard</Text>
                <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                  Go to your CrossCode dashboard and click "Generate Login QR"
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
                  Point your camera at the login QR code to authenticate
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        {claiming ? (
          <View className="items-center gap-4">
            <ActivityIndicator size="large" color={THEME[theme].primary} />
            <Text className="text-sm text-muted-foreground">Logging in...</Text>
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
