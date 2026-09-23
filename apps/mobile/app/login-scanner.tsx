import * as React from "react"
import { useFocusEffect, useRouter } from "expo-router"
import { View, Alert, ActivityIndicator } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { decodeDeviceLinkQrPayload, detectQrPayloadType } from "@crosscode/shared"
import QrScanner from "@/components/qr-scanner"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { importQrFromGallery } from "@/lib/qr-from-gallery"
import FlashlightIcon from "lucide-react-native/dist/esm/icons/flashlight"
import FlashlightOffIcon from "lucide-react-native/dist/esm/icons/flashlight-off"
import ArrowLeft from "lucide-react-native/dist/esm/icons/arrow-left"
import Images from "lucide-react-native/dist/esm/icons/images"
import { Toggle } from "@/components/ui/toggle"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { useAuth } from "@/store/auth.store"
import { registerPushDevice } from "@/lib/account-notifications"
import { useSettings } from "@/store/settings.store"
import { validateAuthToken, validateServerUrl, secureFetch } from "@/lib/security"

const AUTH_SERVER_URL = "https://crosscode.site"

export default function LoginScannerScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "light"
  const [torch, setTorch] = React.useState<boolean>(false)
  const [claiming, setClaiming] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const navigated = React.useRef(false)
  const login = useAuth((s) => s.login)

  useFocusEffect(
    React.useCallback(() => {
      navigated.current = false
    }, [])
  )

  const handleScan = async (data: string) => {
    if (navigated.current || claiming || importing) return
    navigated.current = true
    try {
      const payloadType = detectQrPayloadType(data)

      if (payloadType === "device-link") {
        const payload = decodeDeviceLinkQrPayload(data)
        validateAuthToken(payload.token)
        // Login QRs must resolve against the pinned auth server unless the
        // payload carries an explicit self-hosted URL.
        const serverUrl = payload.url ? validateServerUrl(payload.url) : AUTH_SERVER_URL
        setClaiming(true)
        await claimDevice(payload.token, serverUrl)
      } else {
        navigated.current = false
        Alert.alert("Invalid QR", "Please scan a login QR code from the web dashboard.")
      }
    } catch (error) {
      navigated.current = false
      Alert.alert("Invalid QR", error instanceof Error ? error.message : "Please scan a valid login QR code.")
    }
  }

  const handleGalleryImport = async () => {
    if (navigated.current || claiming || importing) return

    setImporting(true)
    try {
      const data = await importQrFromGallery()
      if (data) await handleScan(data)
    } catch (error) {
      Alert.alert("Unable to import QR", error instanceof Error ? error.message : "Please select a valid QR code image")
    } finally {
      setImporting(false)
    }
  }

  const claimDevice = async (token: string, serverUrl: string) => {
    try {
      validateAuthToken(token)
      const safeServerUrl = validateServerUrl(serverUrl)
      const res = await secureFetch(
        safeServerUrl,
        `/api/auth/device-link/claim?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceName: "Mobile Device" }),
        },
        15000
      )

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error((error as { error?: string }).error || "Failed to claim device")
      }

      await res.json().catch(() => ({}))

      const accountRes = await secureFetch(
        safeServerUrl,
        "/api/account",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        15000
      )

      if (accountRes.ok) {
        const accountData = await accountRes.json().catch(() => null)
        const user = (accountData as { user?: { id?: unknown; email?: unknown; name?: unknown; tier?: unknown } } | null)?.user
        if (
          !user ||
          typeof user.id !== "string" ||
          typeof user.email !== "string" ||
          typeof user.name !== "string" ||
          typeof user.tier !== "string"
        ) {
          throw new Error("Failed to fetch account")
        }
        login(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: user.tier,
          },
          token,
          safeServerUrl
        )
        if (useSettings.getState().notifications) {
          await registerPushDevice(safeServerUrl, token)
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
        {claiming || importing ? (
          <View className="items-center gap-4">
            <ActivityIndicator size="large" color={THEME[theme].primary} />
            <Text className="text-sm text-muted-foreground">
              {claiming ? "Logging in..." : "Reading QR code..."}
            </Text>
          </View>
        ) : (
          <QrScanner onScan={handleScan} torch={torch} />
        )}
      </View>

      <View className="flex-row items-center justify-center gap-4 py-6">
        <Toggle pressed={torch} onPressedChange={setTorch}>
          {torch ? <FlashlightIcon size={20} color={THEME[theme].foreground} /> : <FlashlightOffIcon size={20} color={THEME[theme].foreground} />}
        </Toggle>
        <Button variant="outline" onPress={handleGalleryImport} disabled={claiming || importing}>
          <Images size={18} color={THEME[theme].foreground} />
          <Text>Import from gallery</Text>
        </Button>
      </View>
    </View>
  )
}
