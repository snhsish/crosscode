import { Pressable, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Project, useProjects } from "@/store/projects.store";
import { useEffect, useState } from "react";
import { Session, useSessions } from "@/store/sessions.store";
import { getSessionsByProjectDir } from "@/lib/sessions";
import { Connection, useConnections } from "@/store/connection.store";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { THEME } from "@/lib/theme";
import { Text } from "@/components/ui/text";

export default function ModelSelectScreen() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const { projectId } = useLocalSearchParams<{ projectId: string }>()
    const { connections, current } = useConnections()
    const { projects } = useProjects()
    const { sessions, upsertSessions } = useSessions()

    const [project, setProject] = useState<Project | null>(null)
    const [projectSessions, setProjectSessions] = useState<Session[]>([])
    const [connection, setConnection] = useState<Connection | null>(null)
    const [refreshing, setRefreshing] = useState<boolean>(false)

    const theme = colorScheme ?? "light"

    const getAndSetSessions = async () => {
        if (!connection || !connection.url || !connection.token || !project) return
        setRefreshing(true)

        const data = await getSessionsByProjectDir(connection.url, connection.token, project.worktree)
        if (data) upsertSessions(data)
        setRefreshing(false)
    }

    useEffect(() => {
        const c = connections.find((c) => c.id === current)
        if (c) {
            setConnection(c)
        }
    }, [connections, current])

    useEffect(() => {
        if (!connection || !connection.url || !connection.token) return

        const currentProject = projects.find((p) => p.id === projectId)

        if (!currentProject) return

        setProject(currentProject)
    }, [connection, projects, projectId])

    useEffect(() => {
        const currentSessions = sessions.filter(s => s.projectID === projectId)
        setProjectSessions(currentSessions)
    }, [sessions])

    useEffect(() => {
        if (project) {
            getAndSetSessions()
        }
    }, [project])

    // if (!project) return <View></View>

    return (
        <View className="flex-1 bg-background px-4 gap-6" style={{ paddingTop: insets.top + 10 }}>
            <View className="flex flex-row gap-2 items-center">
                <Button variant="ghost" className="w-10 h-10 text-white" onPress={() => router.push("/projects")}>
                    <ArrowLeftIcon size={20} color={THEME[theme].foreground} />
                </Button>

                <Text className="text-lg font-semibold tracking-tight line-clamp-1">
                    {project?.name ?? project?.worktree}
                </Text>
            </View>

            <View className="flex flex-col gap-2">
                {
                    projectSessions.map((s) => (
                        <Pressable
                            onPress={() => router.push(`/project/${projectId}/${s.id}`)}
                            className="active:opacity-70" key={s.id}
                        >
                            <Card className="w-full">
                                <CardHeader className="flex-row p-0!">
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
                        </Pressable>
                    ))
                }
            </View>
        </View>
    );
}