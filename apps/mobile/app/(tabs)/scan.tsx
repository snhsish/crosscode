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
  const [errorModalOpen, setErrorModalOpen] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>("")
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
    }
    catch {
      setError("Invalid QR code. Scan the QR after running `npx crosscode` in your terminal.")
      setErrorModalOpen(true)
    }
  }

  return (
    <View className="flex-1 bg-background gap-6" style={{ paddingTop: insets.top }}>
      <View className="px-6 py-2 mt-4 flex items-center">
        <Text className="text-3xl font-semibold tracking-tight">
          Scan QR Code
        </Text>
        <Text className="text-muted-foreground tracking-tight text-sm text-center">
          Run <Text className="bg-muted text-muted-foreground">npx crosscode</Text> and {"\n"} scan the QR that appears on the terminal
        </Text>
      </View>

      <View className="flex items-center justify-center mt-5 py-2">
        <QrScanner
          onScan={handleScan}
          torch={torch}
        />
      </View>

      <View className="px-6 py-2 mt-4 flex items-center">
        <Toggle
          pressed={torch}
          onPressedChange={setTorch}
        >
          {torch ? <FlashlightIcon /> : <FlashlightOffIcon />}
        </Toggle>
      </View>
    </View>
  )
}
