import { CameraView, useCameraPermissions } from "expo-camera"
import { useRef, useState } from "react"
import { Button } from "./ui/button"
import { Text } from "./ui/text"
import { View } from "react-native"
import { CameraOff, Flashlight, FlashlightOff } from "lucide-react-native"

type QrScannerProps = {
    onScan: (data: string) => void
    torch?: boolean
    isActive?: boolean
    cooldownMs?: number
}

export default function QrScanner({
    onScan,
    torch,
    isActive = true,
    cooldownMs = 200
}: QrScannerProps) {
    const [perm, reqPerm] = useCameraPermissions()
    const lastScanned = useRef<string | null>(null)
    const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleQrCodeScanned = (data: string) => {
        if (!isActive) return
        if (lastScanned.current === data) return

        lastScanned.current = data
        onScan(data)

        if (cooldownTimer.current) clearTimeout(cooldownTimer.current)
        cooldownTimer.current = setTimeout(() => {
            lastScanned.current = null
        }, cooldownMs)
    }

    if (!perm)
        return (
            <View>
            </View>
        )

    if (!perm.granted)
        return (
            <View className="flex flex-col items-center gap-6">
                <CameraOff
                    size={75}
                    color={"gray"}
                />

                <View className="flex flex-col items-center">
                    <Text className="text-2xl font-semibold tracking-tighter">
                        Camera permission required
                    </Text>
                    <Text className="text-muted-foreground text-xs text-center">
                        CrossCode needs camera access to scan the QR code from your terminal
                    </Text>
                </View>

                <Button
                    onPress={reqPerm}
                    className="mt-5 rounded-full"
                >
                    <Text>Grant permission</Text>
                </Button>
            </View>
        )

    return (
        <View className="flex flex-col justify-between items-center">
            <CameraView
                active={isActive}
                enableTorch={torch}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"]
                }}
                onBarcodeScanned={({ data }) => handleQrCodeScanned(data)}
            >
                <View className="justify-center items-center">
                    <View
                        className="w-[250px] h-[250px] bg-transparent"
                    />
                </View>
            </CameraView>
        </View>
    )
}
