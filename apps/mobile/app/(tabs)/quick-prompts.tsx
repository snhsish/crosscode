import * as React from "react"
import { FlatList, Modal, Pressable, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useColorScheme } from "nativewind"

import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useQuickPromptsStore, PRE_DEFINED_PROMPTS, QuickPrompt } from "@/store/quick-prompts.store"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowUpDown, Filter, Plus, Search, Trash2, X, Zap } from "lucide-react-native"

type FilterType = "all" | "built-in" | "custom"
type SortType = "name-asc" | "name-desc"

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "built-in", label: "Built-in" },
    { key: "custom", label: "Custom" },
]

const SORT_OPTIONS: { key: SortType; label: string }[] = [
    { key: "name-asc", label: "A-Z" },
    { key: "name-desc", label: "Z-A" },
]

type PromptItem = QuickPrompt & { isBuiltIn: boolean }

const PromptItemRow = React.memo(function PromptItemRow({
    item,
    isLast,
    onDelete,
}: {
    item: PromptItem
    isLast: boolean
    onDelete: (id: string) => void
}) {
    const theme = useColorScheme().colorScheme ?? "dark"
    const [menuVisible, setMenuVisible] = React.useState(false)

    const handleCloseMenu = React.useCallback(() => setMenuVisible(false), [])

    const handlePress = React.useCallback(() => {
        if (!item.isBuiltIn) {
            setMenuVisible(true)
        }
    }, [item.isBuiltIn])

    const handleDeletePress = React.useCallback(() => {
        setMenuVisible(false)
        onDelete(item.id)
    }, [onDelete, item.id])

    return (
        <>
            <Pressable
                onPress={handlePress}
                className={cn(
                    "flex-row items-center px-6 py-4",
                    !isLast && "border-b border-border/30",
                    item.isBuiltIn ? "active:bg-muted/10" : "active:bg-muted/30"
                )}
            >
                <View className={cn(
                    "w-10 h-10 rounded-xl items-center justify-center mr-3",
                    item.isBuiltIn ? "bg-muted/50" : "bg-primary/10"
                )}>
                    <Zap size={18} color={item.isBuiltIn ? THEME[theme].mutedForeground : THEME[theme].primary} />
                </View>
                <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2">
                        <Text className="font-medium text-sm" numberOfLines={1}>
                            {item.title}
                        </Text>
                        {item.isBuiltIn && (
                            <View className="px-1.5 py-0.5 rounded bg-muted/50">
                                <Text className="text-[9px] text-muted-foreground">Built-in</Text>
                            </View>
                        )}
                    </View>
                    <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                        {item.prompt}
                    </Text>
                </View>
            </Pressable>

            <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={handleCloseMenu}>
                <Pressable className="flex-1 justify-end" onPress={handleCloseMenu}>
                    <View className="bg-black/40 flex-1" />
                    <View className="bg-card rounded-t-2xl pb-8 px-6">
                        <View className="w-10 h-1 rounded-full bg-muted mx-auto my-3" />

                        <View className="flex-row items-start gap-4 mb-6">
                            <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center shrink-0">
                                <Zap size={20} color={THEME[theme].primary} />
                            </View>
                            <View className="flex-1 gap-1">
                                <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                                    {item.prompt}
                                </Text>
                            </View>
                        </View>

                        <View className="h-px bg-border/50 mb-4" />

                        <Pressable
                            onPress={handleDeletePress}
                            className="flex-row items-center gap-4 py-3.5 active:bg-destructive/10 rounded-xl px-2 -mx-2"
                        >
                            <View className="w-9 h-9 rounded-lg bg-destructive/10 items-center justify-center">
                                <Trash2 size={18} color={THEME[theme].destructive} />
                            </View>
                            <Text className="text-sm font-medium text-destructive">Delete prompt</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </>
    )
})

export default function QuickPromptsScreen() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const { colorScheme } = useColorScheme()
    const theme = colorScheme ?? "dark"

    const userPrompts = useQuickPromptsStore((s) => s.userPrompts)
    const removePrompt = useQuickPromptsStore((s) => s.removePrompt)
    const addPrompt = useQuickPromptsStore((s) => s.addPrompt)

    const [searchQuery, setSearchQuery] = React.useState("")
    const [filter, setFilter] = React.useState<FilterType>("all")
    const [sortBy, setSortBy] = React.useState<SortType>("name-asc")
    const [showFilterMenu, setShowFilterMenu] = React.useState(false)
    const [showSortMenu, setShowSortMenu] = React.useState(false)
    const [addDialogOpen, setAddDialogOpen] = React.useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [selectedPromptId, setSelectedPromptId] = React.useState<string | null>(null)
    const [newTitle, setNewTitle] = React.useState("")
    const [newPromptText, setNewPromptText] = React.useState("")

    const allPrompts = React.useMemo<PromptItem[]>(() => {
        const builtIn: PromptItem[] = PRE_DEFINED_PROMPTS.map((p) => ({ ...p, isBuiltIn: true }))
        const custom: PromptItem[] = userPrompts.map((p) => ({ ...p, isBuiltIn: false }))
        return [...builtIn, ...custom]
    }, [userPrompts])

    const filteredPrompts = React.useMemo(() => {
        let result = [...allPrompts]

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (p) => p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q)
            )
        }

        if (filter === "built-in") {
            result = result.filter((p) => p.isBuiltIn)
        } else if (filter === "custom") {
            result = result.filter((p) => !p.isBuiltIn)
        }

        if (sortBy === "name-asc") {
            result.sort((a, b) => a.title.localeCompare(b.title))
        } else if (sortBy === "name-desc") {
            result.sort((a, b) => b.title.localeCompare(a.title))
        }

        return result
    }, [allPrompts, searchQuery, filter, sortBy])

    const handleDelete = React.useCallback((promptId: string) => {
        setSelectedPromptId(promptId)
        setDeleteDialogOpen(true)
    }, [])

    const handleDeleteConfirm = React.useCallback(() => {
        if (selectedPromptId) {
            removePrompt(selectedPromptId)
        }
        setDeleteDialogOpen(false)
        setSelectedPromptId(null)
    }, [selectedPromptId, removePrompt])

    const handleAddPrompt = React.useCallback(() => {
        if (!newTitle.trim() || !newPromptText.trim()) return
        addPrompt({ title: newTitle.trim(), prompt: newPromptText.trim() })
        setNewTitle("")
        setNewPromptText("")
        setAddDialogOpen(false)
    }, [newTitle, newPromptText, addPrompt])

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            <View className="px-6 pt-4 pb-3 gap-4">
                <View className="flex-row items-center gap-3">
                    <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={22} color={THEME[theme].foreground} />
                    </Pressable>
                    <View className="flex-1">
                        <Text className="text-lg font-semibold tracking-tight">Quick Prompts</Text>
                        <Text className="text-xs text-muted-foreground">
                            {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? "s" : ""}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    <View className="flex-1 flex-row items-center bg-muted/50 rounded-lg px-3 h-10">
                        <Search size={18} color={THEME[theme].mutedForeground} />
                        <TextInput
                            className="flex-1 text-sm text-foreground ml-2 placeholder:text-muted-foreground/50"
                            placeholder="Search prompts..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={THEME[theme].mutedForeground}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery("")}>
                                <X size={16} color={THEME[theme].mutedForeground} />
                            </Pressable>
                        )}
                    </View>
                    <Pressable
                        onPress={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false) }}
                        className={cn(
                            "h-10 w-10 rounded-lg items-center justify-center",
                            showFilterMenu ? "bg-primary/10" : "bg-muted/50"
                        )}
                    >
                        <Filter size={18} color={showFilterMenu ? THEME[theme].primary : THEME[theme].mutedForeground} />
                    </Pressable>
                    <Pressable
                        onPress={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false) }}
                        className={cn(
                            "h-10 w-10 rounded-lg items-center justify-center",
                            showSortMenu ? "bg-primary/10" : "bg-muted/50"
                        )}
                    >
                        <ArrowUpDown size={18} color={showSortMenu ? THEME[theme].primary : THEME[theme].mutedForeground} />
                    </Pressable>
                </View>

                {(showFilterMenu || showSortMenu) && (
                    <View className="flex-row gap-2">
                        {showFilterMenu && (
                            <View className="flex-row gap-1.5 flex-1">
                                {FILTER_OPTIONS.map((f) => (
                                    <Pressable
                                        key={f.key}
                                        onPress={() => { setFilter(f.key); setShowFilterMenu(false) }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full",
                                            filter === f.key ? "bg-primary" : "bg-muted/50"
                                        )}
                                    >
                                        <Text className={cn(
                                            "text-xs font-medium",
                                            filter === f.key ? "text-primary-foreground" : "text-muted-foreground"
                                        )}>
                                            {f.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                        {showSortMenu && (
                            <View className="flex-row gap-1.5 flex-1">
                                {SORT_OPTIONS.map((s) => (
                                    <Pressable
                                        key={s.key}
                                        onPress={() => { setSortBy(s.key); setShowSortMenu(false) }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full",
                                            sortBy === s.key ? "bg-primary" : "bg-muted/50"
                                        )}
                                    >
                                        <Text className={cn(
                                            "text-xs font-medium",
                                            sortBy === s.key ? "text-primary-foreground" : "text-muted-foreground"
                                        )}>
                                            {s.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>

            {filteredPrompts.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8 gap-4">
                    <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center">
                        <Zap size={28} color={THEME[theme].mutedForeground} />
                    </View>
                    <View className="items-center gap-1.5">
                        <Text className="text-base font-semibold text-foreground">
                            {searchQuery || filter !== "all" ? "No matching prompts" : "No custom prompts yet"}
                        </Text>
                        <Text className="text-sm text-muted-foreground text-center">
                            {searchQuery || filter !== "all"
                                ? "Try adjusting your search or filters"
                                : "Add your own quick prompts for easy access"}
                        </Text>
                    </View>
                </View>
            ) : (
                <FlatList
                    className="flex-1"
                    data={filteredPrompts}
                    keyExtractor={(item) => item.id}
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    initialNumToRender={15}
                    renderItem={({ item, index }) => (
                        <PromptItemRow
                            item={item}
                            isLast={index === filteredPrompts.length - 1}
                            onDelete={handleDelete}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogHeader
                    title="Delete prompt"
                    description="Are you sure you want to delete this custom prompt?"
                />
                <DialogFooter
                    cancelLabel="Cancel"
                    confirmLabel="Delete"
                    variant="destructive"
                    onCancel={() => setDeleteDialogOpen(false)}
                    onConfirm={handleDeleteConfirm}
                />
            </Dialog>

            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
                <DialogHeader
                    icon={<Zap size={24} color={THEME[theme].primary} />}
                    title="Add Quick Prompt"
                    description="Create a custom quick prompt for easy access"
                />
                <View className="gap-3">
                    <Input
                        placeholder="Title (e.g., Fix bugs)"
                        value={newTitle}
                        onChangeText={setNewTitle}
                    />
                    <Input
                        placeholder="Prompt text"
                        value={newPromptText}
                        onChangeText={setNewPromptText}
                        multiline
                        className="min-h-[80px]"
                    />
                </View>
                <DialogFooter
                    cancelLabel="Cancel"
                    confirmLabel="Add"
                    onCancel={() => {
                        setAddDialogOpen(false)
                        setNewTitle("")
                        setNewPromptText("")
                    }}
                    onConfirm={handleAddPrompt}
                />
            </Dialog>

            <View className="absolute" style={{ bottom: insets.bottom + 24, right: 24 }}>
                <Pressable
                    onPress={() => setAddDialogOpen(true)}
                    className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg active:opacity-80"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <Plus size={24} color={THEME[theme].primaryForeground} />
                </Pressable>
            </View>
        </View>
    )
}
