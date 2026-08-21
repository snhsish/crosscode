import { memo, useCallback, useMemo } from "react"
import { Keyboard, Platform, Pressable, View } from "react-native"
import { Image } from "expo-image"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated"
import { CameraIcon, ChevronDownIcon, CpuIcon, FilesIcon, ImageIcon, MicIcon, PlusIcon, SendIcon, VideoIcon, XIcon, ZapIcon } from "lucide-react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRouter } from "expo-router"
import * as ImagePicker from "expo-image-picker"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TriggerRef } from "@rn-primitives/select"
import { THEME } from "@/lib/theme"
import { AgentSelectTrigger } from "@/components/agent-mode-select"
import { VariantSelectTrigger } from "@/components/variant-select"
import { useRef, useEffect, useState } from "react"
import { BackHandler } from "react-native"
import { SelectedModel } from "@/store/chat.store"
import { QuickPromptsModal } from "@/components/quick-prompts-modal"

export type ImageAttachment = {
    uri: string
    mime: string
    fileName?: string
    base64?: string
}

const MAX_IMAGES = 2

const ATTACHMENT_SECTIONS = [
    {
        title: "Add to message",
        actions: [
            { key: "photo", icon: ImageIcon, label: "Photo Library" },
            { key: "camera", icon: CameraIcon, label: "Camera" },
        ],
    },
    {
        title: "More",
        actions: [
            { key: "files", icon: FilesIcon, label: "Files" },
            { key: "video", icon: VideoIcon, label: "Video" },
            { key: "quick-prompts", icon: ZapIcon, label: "Quick Prompts" },
        ],
    },
] as const

const DISABLED_ACTIONS = new Set(["camera", "files", "video"])

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

type Agent = { name: string; [key: string]: unknown }

interface ChatInputProps {
    draft: string
    setDraft: (sessionId: string, text: string) => void
    sending: boolean
    onSend: () => void
    selectedAgent: string
    onAgentChange: (agent: string) => void
    agents: Agent[]
    variants: Array<{ name: string }>
    currentVariant?: string
    selectedModelId?: string
    selectedProviderId?: string
    sessionId: string
    projectId: string
    connectionUrl?: string
    connectionToken?: string
    theme: "light" | "dark"
    modelByAgent: Record<string, SelectedModel>
    onModelSelect: (model: { id: string; providerID: string; variant?: string }) => void
    onVariantSelect: (variant: string) => void
    onSessionModelUpdate: (model: { id: string; providerID: string; variant: string }) => void
    images: ImageAttachment[]
    onImagesChange: React.Dispatch<React.SetStateAction<ImageAttachment[]>>
    recognizing?: boolean
    voiceVolume?: number
    voiceAvailable?: boolean
    onStartVoice?: () => void
    onStopVoice?: () => void
}

function ChatInputInner({
    draft,
    setDraft,
    sending,
    onSend,
    selectedAgent,
    onAgentChange,
    agents,
    variants,
    currentVariant,
    selectedModelId,
    selectedProviderId,
    sessionId,
    projectId,
    theme,
    modelByAgent,
    onModelSelect,
    onVariantSelect,
    onSessionModelUpdate,
    connectionUrl,
    connectionToken,
    images,
    onImagesChange,
    recognizing = false,
    voiceVolume = 0,
    voiceAvailable = true,
    onStartVoice,
    onStopVoice,
}: ChatInputProps) {
    const insets = useSafeAreaInsets()
    const ref = useRef<TriggerRef>(null)
    const router = useRouter()
    const keyboardHeight = useSharedValue(0)
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
    const [showQuickPromptsModal, setShowQuickPromptsModal] = useState(false)
    const navigation = useNavigation()
    const micPulse = useSharedValue(1)

    useEffect(() => {
        if (recognizing) {
            micPulse.value = withRepeat(
                withSequence(
                    withTiming(1.15, { duration: 500, easing: Easing.out(Easing.sin) }),
                    withTiming(1, { duration: 500, easing: Easing.in(Easing.sin) })
                ),
                -1,
                true
            )
        } else {
            micPulse.value = withTiming(1, { duration: 200 })
        }
    }, [recognizing])

    const micAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: micPulse.value }],
    }))

    const showSend = Boolean(draft.trim()) || !voiceAvailable
    const showSendRef = useRef(showSend)
    useEffect(() => {
        showSendRef.current = showSend
    }, [showSend])

    const handleActionPress = useCallback(() => {
        if (showSendRef.current) {
            onSend?.()
            return
        }
        if (recognizing) {
            onStopVoice?.()
        } else {
            onStartVoice?.()
        }
    }, [onSend, onStartVoice, onStopVoice, recognizing])

    useEffect(() => {
        const showListener = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (e) => {
            keyboardHeight.value = withTiming(e.endCoordinates.height, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            })
            setIsKeyboardVisible(true)
        })
        const hideListener = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => {
            keyboardHeight.value = withTiming(0, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            })
            setIsKeyboardVisible(false)
        })
        return () => {
            showListener.remove()
            hideListener.remove()
        }
    }, [])

    const hideAttachmentMenu = useCallback(() => {
        setShowAttachmentMenu(false)
    }, [])

    const toggleAttachmentMenu = useCallback(() => {
        if (showAttachmentMenu) {
            hideAttachmentMenu()
        } else {
            Keyboard.dismiss()
            setShowAttachmentMenu(true)
        }
    }, [showAttachmentMenu, hideAttachmentMenu])

    useEffect(() => {
        if (!showAttachmentMenu) return
        const onBackPress = () => {
            hideAttachmentMenu()
            return true
        }
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress)
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            e.preventDefault()
            hideAttachmentMenu()
        })
        return () => {
            backHandler.remove()
            unsubscribe()
        }
    }, [showAttachmentMenu, navigation, hideAttachmentMenu])

    const pickImages = useCallback(async () => {
        const remaining = MAX_IMAGES - images.length
        if (remaining <= 0) return

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            base64: true,
            quality: 0.8,
        })

        if (!result.canceled && result.assets.length > 0) {
            const newImages: ImageAttachment[] = result.assets.map((asset) => ({
                uri: asset.uri,
                mime: asset.mimeType ?? "image/jpeg",
                fileName: asset.fileName ?? undefined,
                base64: asset.base64 ?? undefined,
            }))
            onImagesChange((prev: ImageAttachment[]) => [...prev, ...newImages].slice(0, MAX_IMAGES))
        }
        hideAttachmentMenu()
    }, [images.length, onImagesChange, hideAttachmentMenu])

    const removeImage = useCallback((index: number) => {
        onImagesChange((prev: ImageAttachment[]) => prev.filter((_, i) => i !== index))
    }, [onImagesChange])

    const handleQuickPromptSelect = useCallback((promptText: string) => {
        setDraft(sessionId, promptText)
        setShowQuickPromptsModal(false)
        hideAttachmentMenu()
    }, [sessionId, setDraft, hideAttachmentMenu])

    const animatedInputStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -keyboardHeight.value }],
    }))

    const contentInsets = useMemo(() => ({
        top: insets.top,
        bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }),
        left: 12,
        right: 12,
    }), [insets.top, insets.bottom])

    return (
        <>
            <Animated.View style={animatedInputStyle}>
                <View className="p-4 !bg-transparent" style={{ paddingBottom: insets.bottom + 16 }}>
                    <View className="p-2 rounded-3xl bg-accent">
                        {images.length > 0 && (
                            <View className="flex-row gap-2 px-2 pt-2 pb-1">
                                {images.map((img, index) => (
                                    <View key={img.uri} className="relative">
                                        <Image
                                            source={{ uri: img.uri }}
                                            className="w-16 h-16 rounded-xl"
                                            resizeMode="cover"
                                        />
                                        <Pressable
                                            onPress={() => removeImage(index)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive items-center justify-center"
                                        >
                                            <XIcon size={12} color="#fff" />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                        <Textarea
                            placeholder={recognizing ? "Listening..." : `Ask anything... "Fix broken tests"`}
                            style={{ borderWidth: 0, backgroundColor: "transparent" }}
                            className="w-full"
                            value={draft}
                            onChangeText={(t) => setDraft(sessionId, t)}
                            blurOnSubmit={false}
                            returnKeyType="default"
                        />

                        <View className="flex flex-row justify-between items-center">
                            <View className="flex flex-row items-center gap-1">
                                <Button variant="ghost" size="icon" className="w-9 h-9" onPress={toggleAttachmentMenu}>
                                    {showAttachmentMenu ? <XIcon size={20} color={THEME[theme].foreground} /> : <PlusIcon size={20} color={THEME[theme].foreground} />}
                                </Button>
                                <Select
                                    defaultValue={{ value: selectedAgent, label: capitalize(selectedAgent) }}
                                    onValueChange={(option) => {
                                        const agent = option?.value ?? "plan"
                                        onAgentChange(agent)
                                        const agentModel = modelByAgent[agent]
                                        if (agentModel) {
                                            onModelSelect({ id: agentModel.id, providerID: agentModel.providerID })
                                        }
                                    }}
                                >
                                    <AgentSelectTrigger ref={ref} className="w-fit">
                                        <SelectValue placeholder="Select an agent" />
                                    </AgentSelectTrigger>
                                    <SelectContent insets={contentInsets} side={isKeyboardVisible ? "top" : "bottom"}>
                                        <SelectGroup>
                                            <SelectLabel>Agents</SelectLabel>
                                            {agents.map((agent) => (
                                                <SelectItem key={agent.name} label={capitalize(agent.name)} value={agent.name} className="capitalize!">
                                                    {capitalize(agent.name)}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <Pressable
                                    className="flex-row items-center gap-1 h-8 px-2 rounded-md border border-border/50 bg-transparent active:bg-accent"
                                    onPress={() =>
                                        router.push(
                                            `/project/${projectId}/${sessionId}/models?currentModelId=${selectedModelId ?? ""}&currentProviderId=${selectedProviderId ?? ""}&agent=${selectedAgent}`
                                        )
                                    }
                                >
                                    <CpuIcon size={12} color={THEME[theme].mutedForeground} />
                                    <Text className="text-xs text-muted-foreground max-w-[80px]" numberOfLines={1}>
                                        {selectedModelId ?? "Model"}
                                    </Text>
                                    <ChevronDownIcon size={11} color={THEME[theme].mutedForeground} />
                                </Pressable>
                                {variants.length > 0 && (
                                    <Select
                                        defaultValue={{ value: currentVariant ?? variants[0]?.name, label: capitalize(currentVariant ?? variants[0]?.name) }}
                                        onValueChange={(option) => {
                                            if (!option?.value || !connectionUrl) return
                                            onVariantSelect(option.value)
                                            onSessionModelUpdate({
                                                id: option.value,
                                                providerID: "",
                                                variant: option.value,
                                            })
                                        }}
                                    >
                                        <VariantSelectTrigger className="w-fit">
                                            <SelectValue placeholder="Effort" />
                                        </VariantSelectTrigger>
                                        <SelectContent insets={contentInsets} side={isKeyboardVisible ? "top" : "bottom"}>
                                            <SelectGroup>
                                                <SelectLabel>Effort</SelectLabel>
                                                {variants.map((v) => (
                                                    <SelectItem key={v.name} label={capitalize(v.name)} value={v.name} className="capitalize!">
                                                        {capitalize(v.name)}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            </View>

                            <Pressable
                                onPress={handleActionPress}
                                disabled={showSend ? sending || !draft.trim() : false}
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={{ backgroundColor: recognizing && !showSend ? THEME[theme].destructive : THEME[theme].primary }}
                            >
                                <Animated.View style={micAnimatedStyle}>
                                    {showSend ? (
                                        <SendIcon size={20} color={THEME[theme].background} />
                                    ) : (
                                        <MicIcon size={20} color={THEME[theme].background} />
                                    )}
                                </Animated.View>
                            </Pressable>
                        </View>
                    </View>
                    {showAttachmentMenu && (
                        <View className="mt-2 rounded-2xl bg-card border border-border overflow-hidden">
                            {ATTACHMENT_SECTIONS.map((section, sectionIndex) => (
                                <View key={section.title}>
                                    {sectionIndex > 0 && <View className="h-px bg-border/60" style={{ marginHorizontal: 16 }} />}
                                    <Text
                                        className="text-xs text-muted-foreground uppercase tracking-wide px-4 pt-3 pb-1"
                                        accessibilityRole="header"
                                    >
                                        {section.title}
                                    </Text>
                                    {section.actions.map((action, actionIndex) => {
                                        const isPhoto = action.key === "photo"
                                        const isQuickPrompts = action.key === "quick-prompts"
                                        const disabled = DISABLED_ACTIONS.has(action.key) || (isPhoto && images.length >= MAX_IMAGES)
                                        const tint = isQuickPrompts ? THEME[theme].primary : THEME[theme].foreground

                                        return (
                                            <Pressable
                                                key={action.key}
                                                onPress={() => {
                                                    if (isPhoto) pickImages()
                                                    else if (isQuickPrompts) {
                                                        hideAttachmentMenu()
                                                        setShowQuickPromptsModal(true)
                                                    }
                                                }}
                                                disabled={disabled}
                                                accessibilityRole="button"
                                                accessibilityLabel={action.label}
                                                accessibilityHint={
                                                    disabled
                                                        ? "Not available yet"
                                                        : isPhoto
                                                            ? `Attach an image. Up to ${MAX_IMAGES} images per message.`
                                                            : `Open ${action.label}`
                                                }
                                                accessibilityState={{ disabled }}
                                                className={`flex-row items-center gap-3 px-4 py-3 min-h-[44px] active:bg-muted ${
                                                    disabled ? "opacity-40" : ""
                                                } ${actionIndex === section.actions.length - 1 ? "mb-1" : ""}`}
                                            >
                                                <View
                                                    className="w-8 h-8 rounded-lg items-center justify-center"
                                                    style={{
                                                        backgroundColor: isQuickPrompts
                                                            ? THEME[theme].primary + "1A"
                                                            : THEME[theme].secondary,
                                                    }}
                                                >
                                                    <action.icon size={18} color={tint} />
                                                </View>
                                                <Text
                                                    className={`flex-1 text-[15px] ${
                                                        isQuickPrompts ? "text-primary font-medium" : "text-foreground"
                                                    }`}
                                                >
                                                    {action.label}
                                                    {isPhoto && images.length >= MAX_IMAGES ? " (max reached)" : ""}
                                                </Text>
                                                {disabled && !isPhoto && (
                                                    <Text className="text-xs text-muted-foreground">Soon</Text>
                                                )}
                                            </Pressable>
                                        )
                                    })}
                                    {sectionIndex === ATTACHMENT_SECTIONS.length - 1 && <View className="pb-1" />}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Animated.View>
            <QuickPromptsModal
                visible={showQuickPromptsModal}
                onClose={() => setShowQuickPromptsModal(false)}
                onSelect={handleQuickPromptSelect}
                theme={theme}
            />
        </>
    )
}

export const ChatInput = memo(ChatInputInner)
