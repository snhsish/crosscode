import { memo, useCallback } from "react"
import { Keyboard, Platform, Pressable, View } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { CameraIcon, ChevronDownIcon, CpuIcon, FilesIcon, ImageIcon, PlusIcon, SendIcon, VideoIcon, XIcon } from "lucide-react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRouter } from "expo-router"
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

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const ATTACHMENT_OPTIONS = [
    { icon: ImageIcon, label: "Image" },
    { icon: VideoIcon, label: "Video" },
    { icon: FilesIcon, label: "Files" },
    { icon: CameraIcon, label: "Camera" },
] as const

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
}: ChatInputProps) {
    const insets = useSafeAreaInsets()
    const ref = useRef<TriggerRef>(null)
    const router = useRouter()
    const keyboardHeight = useSharedValue(0)
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
    const attachmentMenuHeight = useSharedValue(0)
    const navigation = useNavigation()

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
        attachmentMenuHeight.value = withTiming(0, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
        })
        setShowAttachmentMenu(false)
    }, [])

    const toggleAttachmentMenu = useCallback(() => {
        if (showAttachmentMenu) {
            hideAttachmentMenu()
        } else {
            Keyboard.dismiss()
            setShowAttachmentMenu(true)
            attachmentMenuHeight.value = withTiming(200, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            })
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

    const animatedInputStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -keyboardHeight.value }],
    }))

    const contentInsets = {
        top: insets.top,
        bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }),
        left: 12,
        right: 12,
    }

    return (
        <Animated.View style={animatedInputStyle}>
            <View className="p-4 !bg-transparent" style={{ paddingBottom: insets.bottom + 16 }}>
                <View className="p-2 rounded-3xl bg-accent">
                    <Textarea
                        placeholder={`Ask anything... "Fix broken tests"`}
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

                        <Button
                            className="rounded-full"
                            size="icon"
                            onPress={onSend}
                            disabled={sending || !draft.trim()}
                        >
                            <SendIcon size={20} color={THEME[theme].background} />
                        </Button>
                    </View>
                </View>
                {showAttachmentMenu && (
                    <View className="mt-2 rounded-2xl bg-card border border-border overflow-hidden">
                        <View className="flex-row flex-wrap">
                            {ATTACHMENT_OPTIONS.map((option) => (
                                <Pressable
                                    key={option.label}
                                    disabled
                                    className="w-1/2 items-center justify-center py-4 opacity-40"
                                >
                                    <View className="w-12 h-12 rounded-2xl bg-secondary/70 items-center justify-center mb-1.5">
                                        <option.icon size={22} color={THEME[theme].foreground} />
                                    </View>
                                    <Text className="text-xs text-muted-foreground">{option.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </Animated.View>
    )
}

export const ChatInput = memo(ChatInputInner)
