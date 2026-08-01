import { memo, useState } from "react"
import { View, Pressable } from "react-native"
import { ArrowLeftIcon, MoreVerticalIcon, ListTodoIcon, FileIcon, ShareIcon, EditIcon } from "lucide-react-native"
import { useRouter } from "expo-router"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"

interface SessionHeaderProps {
    projectId: string
    sessionId: string
    title?: string
    projectName?: string
    projectDirectory?: string
    theme: "light" | "dark"
    paddingTop: number
}

function SessionHeaderInner({
    projectId,
    sessionId,
    title,
    projectName,
    projectDirectory,
    theme,
    paddingTop,
}: SessionHeaderProps) {
    const router = useRouter()
    const [showMenu, setShowMenu] = useState(false)

    const displayTitle = title && title.length > 40 ? title.slice(0, 37) + "..." : title

    const toggleMenu = () => setShowMenu(!showMenu)
    const closeMenu = () => setShowMenu(false)

    const handleNavigate = (path: string) => {
        closeMenu()
        router.push(path)
    }

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
                    {projectName ?? projectDirectory}
                </Text>
            </View>

            <View className="relative">
                <Pressable
                    className="w-10 h-10 rounded-full bg-accent/60 active:bg-accent border border-border/50 items-center justify-center"
                    onPress={toggleMenu}
                >
                    <MoreVerticalIcon size={18} color={THEME[theme].mutedForeground} />
                </Pressable>

                {showMenu && (
                    <>
                        <Pressable
                            className="absolute inset-0 -top-20 -left-20 -right-20 -bottom-20"
                            onPress={closeMenu}
                        />
                        <View className="absolute right-0 top-12 w-56 rounded-xl bg-card border border-border shadow-lg z-50">
                            <View className="py-2">
                                <Pressable
                                    className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                    onPress={() => handleNavigate(`/project/${projectId}/${sessionId}/tasks`)}
                                >
                                    <ListTodoIcon size={16} color={THEME[theme].mutedForeground} />
                                    <Text className="text-sm text-foreground">Tasks</Text>
                                </Pressable>

                                <Pressable
                                    className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                    onPress={() => handleNavigate(`/project/${projectId}/${sessionId}/files`)}
                                >
                                    <FileIcon size={16} color={THEME[theme].mutedForeground} />
                                    <Text className="text-sm text-foreground">Modified files</Text>
                                </Pressable>
                            </View>

                            <View className="border-t border-border/50 py-2">
                                <Pressable
                                    className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                    onPress={() => {
                                        closeMenu()
                                    }}
                                >
                                    <ShareIcon size={16} color={THEME[theme].mutedForeground} />
                                    <Text className="text-sm text-foreground">Share session</Text>
                                </Pressable>

                                <Pressable
                                    className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                    onPress={() => {
                                        closeMenu()
                                    }}
                                >
                                    <EditIcon size={16} color={THEME[theme].mutedForeground} />
                                    <Text className="text-sm text-foreground">Rename session</Text>
                                </Pressable>
                            </View>
                        </View>
                    </>
                )}
            </View>
        </View>
    )
}

export const SessionHeader = memo(SessionHeaderInner)
