import * as React from "react"
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router"
import { View, Alert, ActivityIndicator } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { decodeQrPayload, decodeLoginQrPayload, decodeDeviceLinkQrPayload, detectQrPayloadType } from "@crosscode/shared"
import QrScanner from "@/components/qr-scanner"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { importQrFromGallery } from "@/lib/qr-from-gallery"
import FlashlightIcon from "lucide-react-native/dist/esm/icons/flashlight"
import FlashlightOffIcon from "lucide-react-native/dist/esm/icons/flashlight-off"
import Images from "lucide-react-native/dist/esm/icons/images"
import { Toggle } from "@/components/ui/toggle"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { useAuth } from "@/store/auth.store"
import { registerPushDevice } from "@/lib/account-notifications"
import { useSettings } from "@/store/settings.store"
import { setPendingConnection } from "@/lib/pending-connection"
import { validateConnectionUrl, validateAuthToken, validateServerUrl, secureFetch } from "@/lib/security"

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

      if (payloadType === "login") {
        // Login QR payloads are untrusted: validate shape, then verify the
        // session against the auth server before persisting any login state.
        const payload = decodeLoginQrPayload(data)
        validateAuthToken(payload.sessionToken)
        setClaiming(true)
        await claimDevice(payload.sessionToken, AUTH_SERVER_URL)
      } else if (payloadType === "device-link") {
        const payload = decodeDeviceLinkQrPayload(data)
        validateAuthToken(payload.token)
        const serverUrl = payload.url ? validateServerUrl(payload.url) : AUTH_SERVER_URL
        if (!isLoginMode && payload.url) validateConnectionUrl(payload.url)
        setClaiming(true)
        await claimDevice(payload.token, isLoginMode ? AUTH_SERVER_URL : serverUrl)
      } else {
        const payload = decodeQrPayload(data)
        validateConnectionUrl(payload.url)
        validateAuthToken(payload.token)
        // Keep the secret out of router query params / deep-link history.
        setPendingConnection({ url: payload.url, token: payload.token })
        router.push("/connect" as any)
      }
    } catch (error) {
      navigated.current = false
      Alert.alert("Invalid QR", error instanceof Error ? error.message : "Please scan a valid QR code.")
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
        Alert.alert("Device Linked", "Your phone has been linked to your account!", [
          { text: "OK", onPress: () => router.replace("/(tabs)/user") },
        ])
      } else {
        throw new Error("Failed to fetch account")
      }
    } catch (error) {
      navigated.current = false
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
        {claiming || importing ? (
          <View className="items-center gap-4">
            <ActivityIndicator size="large" color={THEME[theme].primary} />
            <Text className="text-sm text-muted-foreground">
              {claiming ? "Linking device..." : "Reading QR code..."}
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
