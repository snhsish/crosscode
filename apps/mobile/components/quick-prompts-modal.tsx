import { memo, useState } from "react"
import { Modal, Pressable, ScrollView, View, Keyboard, Dimensions } from "react-native"
import { Text } from "@/components/ui/text"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { THEME } from "@/lib/theme"
import { useQuickPromptsStore, PRE_DEFINED_PROMPTS, QuickPrompt } from "@/store/quick-prompts.store"
import { PlusIcon, XIcon, ZapIcon } from "lucide-react-native"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

type QuickPromptsModalProps = {
    visible: boolean
    onClose: () => void
    onSelect: (promptText: string) => void
    theme: "light" | "dark"
}

function QuickPromptsModalInner({ visible, onClose, onSelect, theme }: QuickPromptsModalProps) {
    const userPrompts = useQuickPromptsStore((s) => s.userPrompts)
    const addPrompt = useQuickPromptsStore((s) => s.addPrompt)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newPrompt, setNewPrompt] = useState("")

    const allPrompts = [...PRE_DEFINED_PROMPTS, ...userPrompts]

    const handleSelect = (prompt: QuickPrompt) => {
        onSelect(prompt.prompt)
        onClose()
    }

    const handleAdd = () => {
        if (!newTitle.trim() || !newPrompt.trim()) return
        addPrompt({ title: newTitle.trim(), prompt: newPrompt.trim() })
        setNewTitle("")
        setNewPrompt("")
        setShowAddForm(false)
    }

    const handleClose = () => {
        Keyboard.dismiss()
        setShowAddForm(false)
        setNewTitle("")
        setNewPrompt("")
        onClose()
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View className="flex-1 justify-end bg-black/40">
                <Pressable className="absolute inset-0" onPress={handleClose} />
                <View
                    className="bg-card rounded-t-2xl pb-8 px-6"
                    style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
                >
                    <View className="w-10 h-1 rounded-full bg-muted mx-auto my-3" />

                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-2">
                            <ZapIcon size={20} color={THEME[theme].foreground} />
                            <Text className="text-lg font-semibold">Quick Prompts</Text>
                        </View>
                        <Button variant="ghost" size="icon" className="w-9 h-9" onPress={handleClose}>
                            <XIcon size={20} color={THEME[theme].foreground} />
                        </Button>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {allPrompts.map((prompt) => (
                            <Pressable
                                key={prompt.id}
                                onPress={() => handleSelect(prompt)}
                                className="p-3 rounded-xl bg-secondary/50 active:bg-secondary mb-2"
                            >
                                <Text className="text-sm font-medium mb-0.5">{prompt.title}</Text>
                                <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                                    {prompt.prompt}
                                </Text>
                            </Pressable>
                        ))}

                        {showAddForm ? (
                            <View className="gap-3 p-3 rounded-xl bg-accent mt-2">
                                <Input
                                    placeholder="Title"
                                    value={newTitle}
                                    onChangeText={setNewTitle}
                                    className="bg-card"
                                />
                                <Input
                                    placeholder="Prompt text"
                                    value={newPrompt}
                                    onChangeText={setNewPrompt}
                                    multiline
                                    className="bg-card min-h-[80px]"
                                />
                                <View className="flex-row gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-10"
                                        onPress={() => {
                                            setShowAddForm(false)
                                            setNewTitle("")
                                            setNewPrompt("")
                                        }}
                                    >
                                        <Text className="text-sm">Cancel</Text>
                                    </Button>
                                    <Button
                                        className="flex-1 h-10"
                                        onPress={handleAdd}
                                        disabled={!newTitle.trim() || !newPrompt.trim()}
                                    >
                                        <Text className="text-sm font-medium text-primary-foreground">Save</Text>
                                    </Button>
                                </View>
                            </View>
                        ) : (
                            <Pressable
                                onPress={() => setShowAddForm(true)}
                                className="flex-row items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border active:bg-accent mt-2"
                            >
                                <PlusIcon size={18} color={THEME[theme].mutedForeground} />
                                <Text className="text-sm text-muted-foreground">Add Quick Prompt</Text>
                            </Pressable>
                        )}
                        <View style={{ height: 20 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}

export const QuickPromptsModal = memo(QuickPromptsModalInner)
