import { memo, useEffect, useRef, useState } from "react"
import { Linking, View, Pressable } from "react-native"
import * as Clipboard from "expo-clipboard"
import { XIcon, CopyIcon, CheckIcon, GlobeIcon } from "lucide-react-native"
import { Dialog } from "@/components/ui/dialog"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { THEME } from "@/lib/theme"

interface LinkOptionsModalProps {
    open: boolean
    url: string | null
    onClose: () => void
    theme: "light" | "dark"
}

function LinkOptionsModalInner({ open, url, onClose, theme }: LinkOptionsModalProps) {
    const [copied, setCopied] = useState(false)
    const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
        }
    }, [])

    const handleClose = () => {
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
        setCopied(false)
        onClose()
    }

    const handleOpen = async () => {
        if (!url) return
        handleClose()
        try {
            await Linking.openURL(url)
        } catch {}
    }

    const handleCopy = async () => {
        if (!url) return
        try {
            await Clipboard.setStringAsync(url)
            setCopied(true)
            if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
            copyTimerRef.current = setTimeout(() => handleClose(), 800)
        } catch {}
    }

    return (
        <Dialog open={open} onClose={handleClose} contentClassName="border border-border" blurred blurTint={theme === "dark" ? "dark" : "light"}>
            <View className="items-center gap-4">
                <View className="flex-row items-center justify-between w-full">
                    <Text className="text-lg font-semibold text-foreground">Link</Text>
                    <Pressable onPress={handleClose} className="w-8 h-8 items-center justify-center">
                        <XIcon size={18} color={THEME[theme].mutedForeground} />
                    </Pressable>
                </View>

                <View className="w-full bg-accent/50 rounded-lg p-3 border border-border/50">
                    <Text className="text-sm text-muted-foreground break-all" numberOfLines={3}>
                        {url}
                    </Text>
                </View>

                <View className="flex-row gap-3 w-full">
                    <Button variant="outline" className="flex-1 h-11 flex-row items-center justify-center gap-2" onPress={handleOpen}>
                        <GlobeIcon size={16} color={THEME[theme].foreground} />
                        <Text className="text-sm font-medium text-foreground">Open in browser</Text>
                    </Button>
                    <Button variant="outline" className="flex-1 h-11 flex-row items-center justify-center gap-2" onPress={handleCopy}>
                        {copied ? (
                            <>
                                <CheckIcon size={16} color="#22c55e" />
                                <Text className="text-sm font-medium text-green-500">Copied!</Text>
                            </>
                        ) : (
                            <>
                                <CopyIcon size={16} color={THEME[theme].foreground} />
                                <Text className="text-sm font-medium text-foreground">Copy link</Text>
                            </>
                        )}
                    </Button>
                </View>
            </View>
        </Dialog>
    )
}

export const LinkOptionsModal = memo(LinkOptionsModalInner)
