import * as React from "react"
import { Linking, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useRouter } from "expo-router"
import { useConnections } from "@/store/connection.store"
import { useRecents } from "@/store/recents.store"
import { useProjects } from "@/store/projects.store"
import { cn, formatWorktree } from "@/lib/utils"
import { getRecents } from "@/lib/recents"
import { getCurrentProject } from "@/lib/projects"
import { DollarSign, GitBranch, Github, Server, Wifi, WifiOff } from "lucide-react-native"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const { connections, current } = useConnections()
  const { recents, lastUpdated, updateRecents } = useRecents()
  const { projects, currentProjectId, updateProjects, setCurrentProjectId } = useProjects()
  const [testing, setTesting] = React.useState(false)
  const [tested, setTested] = React.useState<{ msg: string, error: boolean } | null>(null)

  const theme = colorScheme ?? "light"
  const connection = React.useMemo(() => connections.find((c) => c.id === current) ?? null, [connections, current])
  const currentProject = React.useMemo(() => projects.find((p) => p.id === currentProjectId) ?? null, [projects, currentProjectId])

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

    getCurrentProject(connection.url, connection.token).then((project) => {
      if (project) {
        setCurrentProjectId(project.id)
        updateProjects([project])
      }
    })

    if ((Date.now() - lastUpdated) >= 86400000) {
      getRecents(connection.url, connection.token).then((data) => {
        if (data) updateRecents(data)
      })
    }
  }, [connection?.id])

  const statusBadge = !connection
    ? { bg: "bg-red-500/15", dot: "bg-red-500", text: "text-red-500", label: "Disconnected" }
    : testing
      ? { bg: "bg-yellow-500/15", dot: "bg-yellow-500", text: "text-yellow-500", label: "Testing..." }
      : !tested
        ? { bg: "bg-yellow-500/15", dot: "bg-yellow-500", text: "text-yellow-500", label: "Unknown" }
        : tested.error
          ? { bg: "bg-red-500/15", dot: "bg-red-500", text: "text-red-500", label: "Unhealthy" }
          : { bg: "bg-green-500/15", dot: "bg-green-500", text: "text-green-500", label: "Connected" }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      <View className="px-6 gap-6 pb-8" style={{ paddingTop: insets.top + 10 }}>
        <Text className="text-3xl font-semibold tracking-tight">
          CrossCode
        </Text>

        <Card className="w-full">
          <CardHeader className="flex-row items-start justify-between">
            <View className="flex-1 gap-1.5">
              <View className="flex-row items-center gap-2">
                <Server size={16} color={THEME[theme].foreground} />
                <CardTitle>Connection</CardTitle>
              </View>
              <CardDescription>
                Your OpenCode remote server
              </CardDescription>
            </View>
            <View className={cn("flex-row items-center gap-1.5 rounded-full px-2.5 py-1", statusBadge.bg)}>
              <View className={cn("w-2 h-2 rounded-full", statusBadge.dot)} />
              <Text className={cn("text-xs font-medium", statusBadge.text)}>
                {statusBadge.label}
              </Text>
            </View>
          </CardHeader>
          <CardContent className="gap-4">
            {connection ? (
              <>
                <View className="flex-row items-center gap-3 bg-muted/50 rounded-xl p-4">
                  <View className={cn("w-10 h-10 rounded-xl items-center justify-center", tested?.error || !tested ? "bg-red-500/20" : "bg-green-500/20")}>
                    {tested?.error || !tested ? (
                      <WifiOff size={18} color={THEME[theme].destructive} />
                    ) : (
                      <Wifi size={18} color={THEME[theme].foreground} />
                    )}
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="font-semibold text-sm">{connection.name}</Text>
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                      {connection.url.replace(/^https?:\/\//, "")}
                    </Text>
                  </View>
                </View>

                {currentProject && (
                  <>
                    <View className="h-px bg-border" />
                    <View>
                      <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Current Project
                      </Text>
                      <View className="gap-0.5 mt-0.5">
                        <Text className="font-semibold text-sm">{currentProject.name}</Text>
                        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                          {formatWorktree(currentProject.worktree)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2 mt-2">
                        <View className="flex-row items-center gap-1 rounded-md bg-accent px-2 py-1">
                          <GitBranch size={12} color={THEME[theme].mutedForeground} />
                          <Text className="text-xs text-muted-foreground">{currentProject.vcs}</Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </>
            ) : (
              <View className="flex-row items-center gap-3 bg-muted/50 rounded-xl p-4">
                <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center">
                  <WifiOff size={18} color={THEME[theme].destructive} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="font-semibold text-sm">No connection</Text>
                  <Text className="text-xs text-muted-foreground">
                    Scan a QR code to connect
                  </Text>
                </View>
              </View>
            )}
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

        <Card className="w-full">
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
                <Github size={18} color={THEME[theme].foreground} />
                <Text>GitHub</Text>
              </Button>
              <Button variant="outline" className="flex-1 justify-center" onPress={() => Linking.openURL("https://buymeacoffee.com/snehasish")}>
                <DollarSign size={18} color={THEME[theme].foreground} />
                <Text>Donate</Text>
              </Button>
            </View>

          </CardContent>
        </Card>
      </View>
    </ScrollView>
  )
}
