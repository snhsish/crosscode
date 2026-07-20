import * as React from "react"
import { ScrollView, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useRouter } from "expo-router"
import { useConnections } from "@/store/connection.store"
import { useProjects } from "@/store/projects.store"
import { useSessions } from "@/store/sessions.store"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { getCurrentProject } from "@/lib/projects"
import { getSessionsByProjectDir } from "@/lib/sessions"

export default function SessionsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const { connections, current } = useConnections()
  const { projects, currentProjectId, updateProjects, setCurrentProjectId } = useProjects()
  const { sessions, upsertSessions } = useSessions()
  const [refreshing, setRefreshing] = React.useState(false)

  const theme = colorScheme ?? "light"
  const connection = React.useMemo(() => connections.find((c) => c.id === current) ?? null, [connections, current])
  const currentProject = React.useMemo(() => projects.find((p) => p.id === currentProjectId) ?? null, [projects, currentProjectId])
  const projectSessions = React.useMemo(
    () => sessions.filter((s) => s.projectID === currentProjectId).sort((a, b) => b.time.updated - a.time.updated),
    [sessions, currentProjectId]
  )

  const fetchCurrentProjectAndSessions = React.useCallback(async () => {
    if (!connection?.url || !connection?.token) return
    setRefreshing(true)

    const project = await getCurrentProject(connection.url, connection.token)
    if (project) {
      setCurrentProjectId(project.id)
      updateProjects([project])

      const data = await getSessionsByProjectDir(connection.url, connection.token, project.worktree)
      if (data) upsertSessions(data)
    }

    setRefreshing(false)
  }, [connection, setCurrentProjectId, updateProjects, upsertSessions])

  React.useEffect(() => {
    if (!connection?.url || !connection?.token) return
    fetchCurrentProjectAndSessions()
  }, [connection?.id])

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 10 }}>
      <View className="px-2">
        <Card className="w-full border-0">
          <CardHeader className="flex-row">
            <View className="flex-1 gap-1.5">
              <CardTitle className="text-2xl">
                Sessions
              </CardTitle>
              <CardDescription>
                {currentProject
                  ? currentProject.name || currentProject.worktree
                  : "Loading current project..."}
              </CardDescription>
            </View>
          </CardHeader>
        </Card>
      </View>

      <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
        <View className="flex flex-col gap-2 border-t border-secondary">
          {projectSessions.length > 0 ? (
            projectSessions.map((s) => (
              <TouchableOpacity
                onPress={() => router.push(`/project/${currentProjectId}/${s.id}`)}
                activeOpacity={0.7}
                key={s.id}
              >
                <Card className="w-full border-0 border-b rounded-none">
                  <CardHeader className="flex-row">
                    <View className="flex-1 gap-1.5">
                      <CardTitle className="text-base font-medium tracking-tight">
                        {s.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(s.time.updated).toLocaleString()}
                      </CardDescription>
                    </View>
                  </CardHeader>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-muted-foreground text-sm">
              {refreshing ? "Loading sessions..." : "No sessions found"}
            </Text>
          )}
        </View>

        {refreshing && projectSessions.length > 0 && (
          <View className="py-4">
            <View className="flex flex-row items-center gap-2">
              <View className="h-2 w-2 bg-yellow-500 rounded-full" />
              <Text>Refreshing sessions...</Text>
            </View>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </View>
  )
}
