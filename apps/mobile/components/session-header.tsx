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
import TerminalIcon from "lucide-react-native/dist/esm/icons/terminal"
import MonitorIcon from "lucide-react-native/dist/esm/icons/monitor"
import { useRouter } from "expo-router"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { shareSession } from "@/lib/sessions"
import { useConnections } from "@/store/connection.store"
import { useSessions } from "@/store/sessions.store"
import { useSettings } from "@/store/settings.store"
import { ShareSessionModal } from "@/components/share-session-modal"
import { SettingsDivider } from "@/components/settings"
import { GlassCircleButton, GlassPill, GlassView } from "@/components/ui/glass"

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

    const displayTitle = title && title.length > 24 ? title.slice(0, 21) + "..." : (title || projectName || "Chat")
    const subtitle = sessionDirectory ?? projectDirectory ?? projectName ?? ""

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
            pointerEvents="box-none"
            className="absolute top-0 left-0 right-0 z-10"
            style={{ paddingTop: paddingTop + 8 }}
        >
            <View className="flex-row gap-2 items-center px-3" pointerEvents="box-none">
                <GlassCircleButton theme={theme} size={44} onPress={() => router.push("/sessions")} accessibilityLabel="Go back">
                    <ArrowLeftIcon size={20} color={THEME[theme].foreground} />
                </GlassCircleButton>

                <GlassPill theme={theme} className="flex-1 px-3.5 py-2 gap-2.5">
                    <View className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#34c759" }} />
                    <View className="flex-1 flex-col gap-0 min-w-0">
                        <Text className="text-[15px] font-semibold tracking-tight" numberOfLines={1}>
                            {displayTitle}
                        </Text>
                        {subtitle ? (
                            <Text className="text-[11px] tracking-tight text-muted-foreground" numberOfLines={1}>
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                </GlassPill>

                <GlassPill theme={theme} className="px-1.5 py-1.5 gap-0.5">
                    <Pressable
                        className="w-9 h-9 rounded-full items-center justify-center active:bg-white/10"
                        onPress={() => handleNavigate(`/project/${projectId}/${sessionId}/tasks`)}
                        accessibilityRole="button"
                        accessibilityLabel="Tasks"
                    >
                        <TerminalIcon size={17} color={THEME[theme].foreground} />
                    </Pressable>
                    <Pressable
                        className="w-9 h-9 rounded-full items-center justify-center active:bg-white/10"
                        onPress={() => handleNavigate(`/project/${projectId}/browser`)}
                        accessibilityRole="button"
                        accessibilityLabel="Browse files"
                    >
                        <FolderIcon size={17} color={THEME[theme].foreground} />
                    </Pressable>
                    {allowTerminal ? (
                        <Pressable
                            className="w-9 h-9 rounded-full items-center justify-center active:bg-white/10"
                            onPress={() => handleNavigate(`/project/${projectId}/${sessionId}/git-graph`)}
                            accessibilityRole="button"
                            accessibilityLabel="Git graph"
                        >
                            <GitBranchIcon size={17} color={THEME[theme].foreground} />
                        </Pressable>
                    ) : null}
                </GlassPill>

                <View
                    ref={buttonRef}
                    onLayout={() => {
                        buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
                            setButtonPos({ top: pageY + height + 8, right: 12 })
                        })
                    }}
                >
                    <GlassCircleButton theme={theme} size={44} onPress={toggleMenu} accessibilityLabel="More options">
                        <MonitorIcon size={18} color={THEME[theme].foreground} />
                    </GlassCircleButton>

                    <Modal visible={showMenu} transparent animationType="fade" onRequestClose={closeMenu}>
                        <Pressable className="flex-1" onPress={closeMenu}>
                            <GlassView
                                theme={theme}
                                borderRadius={20}
                                intensity={60}
                                style={{ position: "absolute", top: buttonPos.top, right: buttonPos.right, width: 224 }}
                            >
                                <View className="py-2">
                                    <Pressable
                                        className="flex-row items-center gap-3 px-4 py-2.5 active:bg-white/10"
                                        onPress={() => handleNavigate(`/project/${projectId}/${sessionId}/tasks`)}
                                    >
                                        <ListTodoIcon size={16} color={THEME[theme].mutedForeground} />
                                        <Text className="text-sm text-foreground">Tasks</Text>
                                    </Pressable>

                                    <Pressable
                                        className="flex-row items-center gap-3 px-4 py-2.5 active:bg-white/10"
                                        onPress={() => handleNavigate(`/project/${projectId}/${sessionId}/files`)}
                                    >
                                        <FileIcon size={16} color={THEME[theme].mutedForeground} />
                                        <Text className="text-sm text-foreground">Modified files</Text>
                                    </Pressable>

                                    <Pressable
                                        className="flex-row items-center gap-3 px-4 py-2.5 active:bg-white/10"
                                        onPress={() => handleNavigate(`/project/${projectId}/browser`)}
                                    >
                                        <FolderIcon size={16} color={THEME[theme].mutedForeground} />
                                        <Text className="text-sm text-foreground">Browse files</Text>
                                    </Pressable>

                                    {allowTerminal && (
                                        <>
                                            <SettingsDivider />
                                            <Pressable
                                                className="flex-row items-center gap-3 px-4 py-2.5 active:bg-white/10"
                                                onPress={() => handleNavigate(`/project/${projectId}/${sessionId}/git-graph`)}
                                            >
                                                <GitBranchIcon size={16} color={THEME[theme].mutedForeground} />
                                                <Text className="text-sm text-foreground">Git graph</Text>
                                            </Pressable>
                                        </>
                                    )}
                                </View>

                                <View className="border-t border-white/10 py-2">
                                    <Pressable
                                        className="flex-row items-center gap-3 px-4 py-2.5 active:bg-white/10"
                                        onPress={handleShare}
                                    >
                                        <ShareIcon size={16} color={THEME[theme].mutedForeground} />
                                        <Text className="text-sm text-foreground">Share session</Text>
                                    </Pressable>

                                    <Pressable
                                        className="flex-row items-center gap-3 px-4 py-2.5 active:bg-white/10"
                                        onPress={() => {
                                            closeMenu()
                                        }}
                                    >
                                        <EditIcon size={16} color={THEME[theme].mutedForeground} />
                                        <Text className="text-sm text-foreground">Rename session</Text>
                                    </Pressable>

                                    <Pressable
                                        className="flex-row items-center gap-3 px-4 py-2.5 active:bg-white/10"
                                        onPress={toggleMenu}
                                    >
                                        <MoreVerticalIcon size={16} color={THEME[theme].mutedForeground} />
                                        <Text className="text-sm text-foreground">Close menu</Text>
                                    </Pressable>
                                </View>
                            </GlassView>
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
        </View>
    )
}

export const SessionHeader = memo(SessionHeaderInner)
