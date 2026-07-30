import { memo } from "react"
import { View, Pressable } from "react-native"
import { ArrowLeftIcon, ListTodoIcon } from "lucide-react-native"
import { useRouter } from "expo-router"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"

interface SessionHeaderProps {
    projectId: string
    sessionId: string
    title?: string
    projectName?: string
    projectWorktree?: string
    theme: "light" | "dark"
    paddingTop: number
}

function SessionHeaderInner({
    projectId,
    sessionId,
    title,
    projectName,
    projectWorktree,
    theme,
    paddingTop,
}: SessionHeaderProps) {
    const router = useRouter()

    const displayTitle = title && title.length > 40 ? title.slice(0, 37) + "..." : title

    return (
        <View
            className="flex flex-row gap-2 items-center border-b border-accent pb-2 px-4"
            style={{ paddingTop: paddingTop + 10 }}
        >
            <Button variant="ghost" className="w-10 h-10 text-white" onPress={() => router.push("/sessions")}>
                <ArrowLeftIcon size={20} color={THEME[theme].foreground} />
            </Button>

            <View className="flex flex-1 flex-col gap-0">
                <Text className="text-base font-semibold tracking-tight line-clamp-1">
                    {displayTitle}
                </Text>
                <Text className="text-xs tracking-tight line-clamp-1 text-muted-foreground">
                    {projectName ?? projectWorktree}
                </Text>
            </View>

            <Pressable
                className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/60 active:bg-accent border border-border/50"
                onPress={() =>
                    router.push(`/project/${projectId}/${sessionId}/tasks`)
                }
            >
                <ListTodoIcon size={13} color={THEME[theme].mutedForeground} />
                <Text className="text-xs text-muted-foreground">Tasks</Text>
            </Pressable>
        </View>
    )
}

export const SessionHeader = memo(SessionHeaderInner)
