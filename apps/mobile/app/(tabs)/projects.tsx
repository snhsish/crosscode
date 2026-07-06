import * as React from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useRouter } from "expo-router"
import { Connection, useConnections } from "@/store/connection.store"
import { useProjects } from "@/store/projects.store"
import { ChevronRight } from "lucide-react-native"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { getProjects } from "@/lib/projects"

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const { connections, current } = useConnections()
  const { projects, updateProjects } = useProjects()
  const [connection, setConnection] = React.useState<Connection | null>(null)
  const [refreshing, setRefreshing] = React.useState<boolean>(false)

  const theme = colorScheme ?? "light"

  const setProjects = async () => {
    if (!connection || !connection.url || !connection.token) return
    setRefreshing(true)
    const data = await getProjects(connection.url, connection.token)
    if (data) updateProjects(data)
    setRefreshing(false)
  }

  const redirect = (id: string) => {
    router.push(`/project/${id}`)
  }

  React.useEffect(() => {
    const c = connections.find((c) => c.id === current)
    if (c) {
      setConnection(c)
    }
  }, [connections])

  React.useEffect(() => {
    if (!connection || !connection.url || !connection.token) return

    setProjects()
  }, [])

  return (
    <View className="flex-1 bg-background px-4 gap-6" style={{ paddingTop: insets.top + 10 }}>
      <Card className="w-full">
        <CardHeader className="flex-row">
          <View className="flex-1 gap-1.5">
            <CardTitle className="text-2xl">
              Your OpenCode Projects
            </CardTitle>
            <CardDescription>
              Directories from the host device where OpenCode can be accessed.
            </CardDescription>
          </View>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {
            projects && projects.length > 0 && (
              <>
                {
                  projects.map((p) => (
                    <Button
                      key={p.id}
                      variant={"outline"}
                      className="flex items-center justify-between"
                      onPress={() => redirect(p.id)}
                    >
                      <Text className="text-ellipsis">
                        {p.worktree.length > 36 ? p.worktree.slice(0, 33) + "..." : p.worktree}
                      </Text>
                      <ChevronRight
                        color={THEME[theme].foreground}
                      />
                    </Button>
                  ))
                }
              </>
            )
          }
        </CardContent>
        {
          refreshing && (
            <CardFooter>
              <View className="flex flex-row items-center gap-2">
                <View className="h-2 w-2 bg-yellow-500 rounded-full" />
                <Text>Refreshing projects...</Text>
              </View>
            </CardFooter>
          )
        }
      </Card>
    </View>
  )
}