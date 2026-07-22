import * as React from "react"
import { Linking, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useRouter } from "expo-router"
import { useConnections } from "@/store/connection.store"
import { useRecents } from "@/store/recents.store"
import { cn, formatWorktree } from "@/lib/utils"
import { getRecents } from "@/lib/recents"
import { ChevronRight, DollarSign, Github } from "lucide-react-native"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const { connections, current } = useConnections()
  const { recents, lastUpdated, updateRecents } = useRecents()
  const [testing, setTesting] = React.useState(false)
  const [tested, setTested] = React.useState<{ msg: string, error: boolean } | null>(null)

  const theme = colorScheme ?? "light"
  const connection = React.useMemo(() => connections.find((c) => c.id === current) ?? null, [connections, current])

  const testConnection = React.useCallback(async (url: string, token: string) => {
    setTesting(true)
    try {
      const res = await fetch(`${url}/global/health`, {
        method: "GET",
        headers: { "Authorization": `Basic ${btoa(`opencode:${token}`)}` }
      }).then((r) => r.json())

      setTested(res?.healthy === true
        ? { msg: "Healthy connection", error: false }
        : { msg: "Degraded connection health", error: true }
      )
    } catch {
      setTested({ msg: "Remote server unreachable", error: true })
    } finally {
      setTesting(false)
    }
  }, [])

  React.useEffect(() => {
    if (!connection?.url || !connection?.token) return
    testConnection(connection.url, connection.token)

    if ((Date.now() - lastUpdated) >= 86400000) {
      getRecents(connection.url, connection.token).then((data) => {
        if (data) updateRecents(data)
      })
    }
  }, [connection?.id])

  return (
    <View className="flex-1 bg-background px-6 gap-6" style={{ paddingTop: insets.top + 10 }}>
      <Text className="text-3xl font-semibold tracking-tight">
        CrossCode
      </Text>

      <Card className="w-full max-w-sm">
        <CardHeader className="flex-row">
          <View className="flex-1 gap-1.5">
            <CardTitle>Connection</CardTitle>
            <CardDescription>
              Your OpenCode remote server connection status
            </CardDescription>
          </View>
        </CardHeader>
        <CardContent>
          <View className="flex flex-row items-center gap-2 bg-muted text-muted-foreground p-4 rounded-lg">
            {!connection ? (
              <>
                <View className="w-2 h-2 rounded-full bg-red-500" />
                <Text className="text-red-500 font-semibold text-sm">No connection established</Text>
              </>
            ) : (
              <>
                <View className={cn("w-2 h-2 rounded-full", testing || !tested ? "bg-yellow-500" : (tested.error ? "bg-red-500" : "bg-green-500"))} />
                <Text className="text-muted-foreground font-semibold text-sm">{connection?.name}</Text>
              </>
            )}
          </View>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          {connection ? (
            <Button variant="outline" className="w-full" onPress={() => router.push("/scan")}>
              <Text>Change Connection</Text>
            </Button>
          ) : (
            <Button className="w-full" onPress={() => router.push("/scan")}>
              <Text>New Connection</Text>
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="w-full max-w-sm">
        <CardHeader className="flex-row">
          <View className="flex-1 gap-1.5">
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>
              Your recent CrossCode remote work sessions
            </CardDescription>
          </View>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recents?.length > 0 ? (
            recents.map((r) => (
              <Button key={r.id} variant="outline" className="flex items-center justify-between" onPress={() => router.push("/sessions")}>
                <Text className="text-ellipsis">
                  {formatWorktree(r.worktree)}
                </Text>
                <ChevronRight color={THEME[theme].foreground} />
              </Button>
            ))
          ) : (
            <Button variant="outline" className="w-full" onPress={() => router.push("/sessions")}>
              <Text>View All Sessions</Text>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm">
        <CardHeader className="flex-row">
          <View className="flex-1 gap-1.5">
            <CardTitle>About CrossCode</CardTitle>
            <CardDescription>
              Remote mobile client for OpenCode
            </CardDescription>
          </View>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Text className="text-muted-foreground text-sm leading-5">
            Control your OpenCode sessions from your phone, tablet, wherever. Pair with your PC over a QR code and keep building on the go.
          </Text>
          <View className="flex flex-row gap-2 pt-1">
            <Button variant="outline" className="flex-1 justify-center" onPress={() => Linking.openURL("https://github.com/snhsish/crosscode")}>
              <Github className="text-foreground" size={18} />
              <Text>GitHub</Text>
            </Button>
            <Button variant="outline" className="flex-1 justify-center" onPress={() => Linking.openURL("https://buymeacoffee.com/snehasish")}>
              <DollarSign className="text-foreground" size={18} />
              <Text>Donate</Text>
            </Button>
          </View>

          <Text className="w-full text-center text-xs text-muted-foreground">
            Build b3fa4c from 3 days ago
          </Text>
        </CardContent>
      </Card>
    </View>
  )
}
