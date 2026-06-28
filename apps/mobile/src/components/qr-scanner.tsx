import { CameraView, useCameraPermissions } from "expo-camera"
import { useRef, useState } from "react"
import {
    Button,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native"

type QrScannerProps = {
    onScan: (data: string) => void
    isActive?: boolean
    cooldownMs?: number
}

export default function QrScanner({ onScan, isActive = true, cooldownMs = 2000 }: QrScannerProps) {
    const [permission, requestPermission] = useCameraPermissions()
    const [torch, setTorch] = useState(false)
    const lastScanned = useRef<string | null>(null)
    const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleBarCodeScanned = (data: string) => {
        if (!isActive) return
        if (lastScanned.current === data) return

        lastScanned.current = data
        onScan(data)

        if (cooldownTimer.current) clearTimeout(cooldownTimer.current)
        cooldownTimer.current = setTimeout(() => {
            lastScanned.current = null
        }, cooldownMs)
    }

    if (!permission)
        return <View style={styles.container} />

    if (!permission.granted)
        return (
            <View style={styles.container}>
                <View style={styles.centered}>
                    <Text style={styles.title}>
                        Camera permission required
                    </Text>
                    <Text style={styles.subtitle}>
                        CrossCode needs camera access to scan the QR code from your terminal
                    </Text>
                    <Button
                        onPress={requestPermission}
                        title="Grant permission"
                    />
                </View>
            </View>
        )

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                active={isActive}
                enableTorch={torch}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"]
                }}
                onBarcodeScanned={({ data }) => handleBarCodeScanned(data)}
            >
                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                </View>
            </CameraView>
            <Pressable style={styles.torchButton} onPress={() => setTorch((t) => !t)}>
                <Text style={styles.torchText}>
                    FLASH {torch ? "ON" : "OFF"}
                </Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        gap: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 20,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: "#ffffff",
        borderRadius: 16,
        backgroundColor: "transparent",
    },
    torchButton: {
        position: "absolute",
        bottom: 80,
        alignSelf: "center",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    torchText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
})