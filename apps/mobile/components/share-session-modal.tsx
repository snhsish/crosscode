import { memo, useState } from "react"
import { View, Pressable, ActivityIndicator, Share } from "react-native"
import { XIcon, CopyIcon, CheckIcon, ShareIcon as ShareIconLucide } from "lucide-react-native"
import { Dialog } from "@/components/ui/dialog"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { THEME } from "@/lib/theme"

interface ShareSessionModalProps {
    open: boolean
    onClose: () => void
    shareUrl: string | null
    loading: boolean
    theme: "light" | "dark"
}

function ShareSessionModalInner({ open, onClose, shareUrl, loading, theme }: ShareSessionModalProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!shareUrl) return
        try {
            await Share.share({ message: shareUrl })
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {}
    }

    const handleClose = () => {
        setCopied(false)
        onClose()
    }

    return (
        <Dialog open={open} onClose={handleClose}>
            <View className="items-center gap-4">
                <View className="flex-row items-center justify-between w-full">
                    <Text className="text-lg font-semibold text-foreground">Share session</Text>
                    <Pressable onPress={handleClose} className="w-8 h-8 items-center justify-center">
                        <XIcon size={18} color={THEME[theme].mutedForeground} />
                    </Pressable>
                </View>

                {loading ? (
                    <View className="py-8 items-center justify-center">
                        <ActivityIndicator size="large" color={THEME[theme].mutedForeground} />
                        <Text className="text-sm text-muted-foreground mt-3">Generating share link...</Text>
                    </View>
                ) : shareUrl ? (
                    <View className="w-full gap-4">
                        <View className="bg-accent/50 rounded-lg p-4 border border-border/50">
                            <Text className="text-sm text-foreground break-all" selectable>
                                {shareUrl}
                            </Text>
                        </View>

                        <View className="flex-row gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-11 flex-row items-center justify-center gap-2"
                                onPress={handleCopy}
                            >
                                {copied ? (
                                    <>
                                        <CheckIcon size={16} color="#22c55e" />
                                        <Text className="text-sm font-medium text-green-500">Copied!</Text>
                                    </>
                                ) : (
                                    <>
                                        <CopyIcon size={16} color={THEME[theme].foreground} />
                                        <Text className="text-sm font-medium text-foreground">Copy</Text>
                                    </>
                                )}
                            </Button>
                        </View>
                    </View>
                ) : (
                    <View className="py-4 items-center">
                        <Text className="text-sm text-muted-foreground text-center">
                            Failed to generate share link. Please try again.
                        </Text>
                    </View>
                )}
            </View>
        </Dialog>
    )
}

export const ShareSessionModal = memo(ShareSessionModalInner)
