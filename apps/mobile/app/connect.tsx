import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useConnections } from "@/store/connection.store"
import { useAuth } from "@/store/auth.store"
import { isAtTunnelLimit, requestPaywall } from "@/lib/paywall"
import { Text } from "@/components/ui/text"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import XIcon from "lucide-react-native/dist/esm/icons/x"
import { cn, getAuthHeader } from "@/lib/utils"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { consumePendingConnection, peekPendingConnection } from "@/lib/pending-connection"
import { validateConnectionUrl, validateAuthToken } from "@/lib/security"

export default function Connect() {
    const params = useLocalSearchParams<{ url?: string, token?: string }>()
    const pending = peekPendingConnection()
    const url = pending?.url ?? params.url ?? ""
    const token = pending?.token ?? params.token ?? ""
    const { colorScheme } = useColorScheme()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const addConnection = useConnections((s) => s.addConnection)
    const connections = useConnections((s) => s.connections)
    const [name, setName] = useState(`Connection ${new Date().toLocaleString()}`)
    const [testing, setTesting] = useState<boolean>(false)
    const [tested, setTested] = useState<{ msg: string, error: boolean } | null>(null)

    const theme = colorScheme ?? "light"

    const testConnection = useCallback(async () => {
        setTesting(true)

        try {
            validateConnectionUrl(url)
            validateAuthToken(token)
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), 10000)
            try {
                const res = await fetch(`${url}/global/health`, {
                    method: "GET",
                    headers: {
                        "Authorization": getAuthHeader(token)
                    },
                    signal: controller.signal,
                })
                if (res.ok) {
                    setTested({
                        msg: "Remote server reachable",
                        error: false
                    })
                } else {
                    setTested({
                        msg: "Remote server unreachable",
                        error: true
                    })
                }
            } finally {
                clearTimeout(timer)
            }
        } catch {
            setTested({
                msg: "Remote server unreachable",
                error: true
            })
        } finally {
            setTesting(false)
        }
    }, [url, token])

    function save() {
        try {
            validateConnectionUrl(url)
            validateAuthToken(token)
        } catch (error) {
            setTested({ msg: error instanceof Error ? error.message : "Invalid connection", error: true })
            return
        }
        const tier = useAuth.getState().user?.tier ?? "free"
        if (isAtTunnelLimit(tier, connections.length)) {
            void requestPaywall("connection_limit")
            return
        }
        addConnection({
            url,
            name,
            token
        })
        consumePendingConnection()
        router.replace("/")
    }

    useEffect(() => {
        testConnection()
    }, [testConnection])

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            <View className="p-4">
                <Button variant="ghost" className="w-10 h-10 text-white" onPress={() => {
                    consumePendingConnection()
                    router.replace("/new-connection")
                }}>
                    <XIcon size={25} color={THEME[theme].foreground} />
                </Button>
            </View>

            <View className="p-6 flex items-center justify-center">
                <Text className="text-2xl font-semibold tracking-tight">
                    Connect to OpenCode
                </Text>
                <Text className="text-muted-foreground text-sm text-center">
                    You will connect to your local OpenCode server remotely.
                </Text>
            </View>

            <View className="p-6 flex flex-col gap-4">
                <View className="flex flex-col gap-1">
                    <Text className="font-medium text-muted-foreground">Connection Name</Text>
                    <Input
                        placeholder="Connection Name"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View className="flex flex-col gap-1">
                    <Text className="font-medium text-muted-foreground">OpenCode Remote Server URL</Text>
                    <Input
                        keyboardType="url"
                        textContentType="URL"
                        autoComplete="url"
                        placeholder="OpenCode Remote Server URL"
                        defaultValue={url}
                        editable={false}
                    />
                </View>

                <View className="flex flex-col gap-1">
                    <Text className="font-medium text-muted-foreground">Authentication Status</Text>
                    <View className="px-4 py-2 bg-muted rounded-lg flex flex-col gap-1">
                        <View className="flex flex-row items-center gap-2">
                            <View className={cn(token ? "bg-green-500" : "bg-red-500", "h-2 w-2 rounded-full")} />
                            <Text className="text-muted-foreground text-sm">
                                {token ? "Authorization Token" : "No authorization token"}
                            </Text>
                        </View>
                        <View className="flex flex-row items-center gap-2">
                            <View className={cn(testing ? "bg-yellow-500" : (tested?.error ? "bg-red-500" : "bg-green-500"), "h-2 w-2 rounded-full")} />
                            <Text className="text-muted-foreground text-sm">
                                {!testing && tested ? tested.msg : "Establishing a connection with remote server"}
                            </Text>
                        </View>
                    </View>
                </View>

                {tested?.error && (
                    <View className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                        <Text className="text-red-500 text-sm text-center">
                            The remote server is unreachable. Please restart the{" "}
                            <Text className="font-mono font-bold">npx crosscode</Text> command and scan the QR code again.
                        </Text>
                    </View>
                )}

                <Button
                    className="mt-5 rounded-full"
                    onPress={tested?.error ? () => {
                        consumePendingConnection()
                        router.replace("/new-connection")
                    } : save}
                >
                    <Text>
                        {tested?.error ? "Scan again" : "Connect to OpenCode"}
                    </Text>
                </Button>
            </View>
        </View>
    )
}

