import * as React from "react"
import { useFocusEffect, useRouter } from "expo-router"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { decodeQrPayload } from "@crosscode/shared"
import QrScanner from "@/components/qr-scanner"
import { Text } from "@/components/ui/text"
import { FlashlightIcon, FlashlightOffIcon } from "lucide-react-native"
import { Toggle } from "@/components/ui/toggle"

export default function ScanQRScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [torch, setTorch] = React.useState<boolean>(false)
  const navigated = React.useRef(false)

  useFocusEffect(
    React.useCallback(() => {
      navigated.current = false
    }, [])
  )

  const handleScan = (data: string) => {
    if (navigated.current) return
    try {
      const payload = decodeQrPayload(data)
      navigated.current = true
      router.push(`/connect?url=${encodeURIComponent(payload.url)}&token=${payload.token}` as any)
    } catch {
      // Invalid QR code
    }
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-8 pb-4">
        <Text className="text-3xl font-semibold tracking-tight">Scan QR Code</Text>
        <Text className="text-muted-foreground text-sm mt-1">
          Connect to a remote opencode server
        </Text>
      </View>

      <View className="px-6 pb-6">
        <View className="bg-muted/50 rounded-2xl p-5 border border-border/50">
          <Text className="text-sm font-medium mb-4">How to connect</Text>
          <View className="gap-4">
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
          </View>
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <QrScanner onScan={handleScan} torch={torch} />
      </View>

      <View className="items-center py-6">
        <Toggle pressed={torch} onPressedChange={setTorch}>
          {torch ? <FlashlightIcon size={20} /> : <FlashlightOffIcon size={20} />}
        </Toggle>
      </View>
    </View>
  )
}
