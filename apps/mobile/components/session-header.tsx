import { memo, useState, useCallback, useRef } from "react"
import { View, Pressable, Modal } from "react-native"
import ArrowLeftIcon from "lucide-react-native/dist/esm/icons/arrow-left"
import MoreVerticalIcon from "lucide-react-native/dist/esm/icons/ellipsis-vertical"
import ListTodoIcon from "lucide-react-native/dist/esm/icons/list-todo"
import FileIcon from "lucide-react-native/dist/esm/icons/file"
import FolderIcon from "lucide-react-native/dist/esm/icons/folder"
import ShareIcon from "lucide-react-native/dist/esm/icons/share"
import EditIcon from "lucide-react-native/dist/esm/icons/pencil"
import GitBranchIcon from "lucide-react-native/dist/esm/icons/git-branch"
import { useRouter } from "expo-router"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { shareSession } from "@/lib/sessions"
import { useConnections } from "@/store/connection.store"
import { useSessions } from "@/store/sessions.store"
import { useSettings } from "@/store/settings.store"
import { ShareSessionModal } from "@/components/share-session-modal"
import { SettingsDivider } from "@/components/settings"

interface SessionHeaderProps {
    projectId: string
    sessionId: string
    title?: string
    projectName?: string
    projectDirectory?: string
    sessionDirectory?: string
    theme: "light" | "dark"
    paddingTop: number
}

function SessionHeaderInner({
    projectId,
    sessionId,
    title,
    projectName,
    projectDirectory,
    sessionDirectory,
    theme,
    paddingTop,
}: SessionHeaderProps) {
    const router = useRouter()
    const [showMenu, setShowMenu] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [shareUrl, setShareUrl] = useState<string | null>(null)
    const [shareLoading, setShareLoading] = useState(false)
    const connections = useConnections((s) => s.connections)
    const current = useConnections((s) => s.current)
    const connection = connections.find((c) => c.id === current) ?? null
    const upsertSession = useSessions((s) => s.upsertSession)
    const allowTerminal = useSettings((s) => s.allowTerminal)

    const buttonRef = useRef<View>(null)
    const [buttonPos, setButtonPos] = useState({ top: 0, right: 0 })

    const displayTitle = title && title.length > 40 ? title.slice(0, 37) + "..." : title

    const toggleMenu = () => setShowMenu(!showMenu)
    const closeMenu = () => setShowMenu(false)

    const handleNavigate = (path: string) => {
        closeMenu()
        router.push(path)
    }

    const handleShare = useCallback(async () => {
        closeMenu()
        if (!connection?.url || !connection?.token) return
        setShareLoading(true)
        setShareUrl(null)
        setShowShareModal(true)
        const session = await shareSession(connection.url, connection.token, sessionId)
        setShareLoading(false)
        if (session?.share?.url) {
            setShareUrl(session.share.url)
            upsertSession(session)
        }
    }, [connection?.url, connection?.token, sessionId, upsertSession])

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
                    {sessionDirectory ?? projectDirectory ?? projectName}
                </Text>
            </View>

            <View
                className="relative"
                ref={buttonRef}
                onLayout={(e) => {
                    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
                        setButtonPos({ top: pageY + height, right: width })
                    })
                }}
            >
                <Pressable
                    className="w-10 h-10 rounded-full bg-accent/60 active:bg-accent border border-border/50 items-center justify-center"
                    onPress={toggleMenu}
                >
                    <MoreVerticalIcon size={18} color={THEME[theme].mutedForeground} />
                </Pressable>

                <Modal visible={showMenu} transparent animationType="none" onRequestClose={closeMenu}>
                    <Pressable className="flex-1" onPress={closeMenu}>
                        <View
                            className="w-56 rounded-xl bg-card border border-border shadow-lg"
                            style={{ position: "absolute", top: buttonPos.top, right: buttonPos.right }}
                        >
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

                                <Pressable
                                    className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                    onPress={() => handleNavigate(`/project/${projectId}/browser`)}
                                >
                                    <FolderIcon size={16} color={THEME[theme].mutedForeground} />
                                    <Text className="text-sm text-foreground">Browse files</Text>
                                </Pressable>

                                {allowTerminal && (
                                    <>
                                        <SettingsDivider />
                                        <Pressable
                                            className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                            onPress={() => handleNavigate(`/project/${projectId}/${sessionId}/git-graph`)}
                                        >
                                            <GitBranchIcon size={16} color={THEME[theme].mutedForeground} />
                                            <Text className="text-sm text-foreground">Git graph</Text>
                                        </Pressable>
                                    </>
                                )}
                            </View>

                            <View className="border-t border-border/50 py-2">
                                <Pressable
                                    className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent/50"
                                    onPress={handleShare}
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
                    </Pressable>
                </Modal>
            </View>

            <ShareSessionModal
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                shareUrl={shareUrl}
                loading={shareLoading}
                theme={theme}
            />
        </View>
    )
}

export const SessionHeader = memo(SessionHeaderInner)
