import { memo } from "react"
import { ActivityIndicator, FlatList, Pressable, View } from "react-native"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { SubagentInfo } from "@/lib/mentions"
import BotIcon from "lucide-react-native/dist/esm/icons/bot"
import FileIcon from "lucide-react-native/dist/esm/icons/file"

export type MentionSuggestion =
    | { kind: "agent"; name: string; description?: string }
    | { kind: "file"; path: string }

type MentionAutocompleteProps = {
    visible: boolean
    loading: boolean
    agents: SubagentInfo[]
    files: string[]
    onSelect: (suggestion: MentionSuggestion) => void
    theme: "light" | "dark"
}

const keyExtractor = (item: MentionSuggestion) =>
    item.kind === "agent" ? `agent:${item.name}` : `file:${item.path}`

function MentionAutocompleteInner({ visible, loading, agents, files, onSelect, theme }: MentionAutocompleteProps) {
    if (!visible) return null

    const data: MentionSuggestion[] = [
        ...agents.map((a): MentionSuggestion => ({ kind: "agent", name: a.name, description: a.description })),
        ...files.map((p): MentionSuggestion => ({ kind: "file", path: p })),
    ]

    const renderItem = ({ item }: { item: MentionSuggestion }) => {
        const isAgent = item.kind === "agent"
        const Icon = isAgent ? BotIcon : FileIcon
        return (
            <Pressable
                onPress={() => onSelect(item)}
                accessibilityRole="button"
                accessibilityLabel={isAgent ? `Mention subagent ${item.name}` : `Mention file ${item.path}`}
                className="flex-row items-center gap-3 px-3 py-2.5 rounded-xl active:bg-secondary"
            >
                <View
                    className="w-7 h-7 rounded-lg items-center justify-center"
                    style={{ backgroundColor: THEME[theme].secondary }}
                >
                    <Icon size={15} color={THEME[theme].mutedForeground} />
                </View>
                <View className="flex-1">
                    <Text className="text-sm" numberOfLines={1}>
                        {isAgent ? `@${item.name}` : item.path}
                    </Text>
                    {isAgent && item.description ? (
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                            {item.description}
                        </Text>
                    ) : null}
                </View>
                <Text className="text-[11px] text-muted-foreground">{isAgent ? "Agent" : "File"}</Text>
            </Pressable>
        )
    }

    return (
        <View className="mx-2 mb-2 rounded-2xl bg-card border border-border overflow-hidden">
            {agents.length > 0 && (
                <Text className="text-[11px] text-muted-foreground uppercase tracking-wide px-3 pt-2 pb-1">
                    Subagents
                </Text>
            )}
            <View style={{ maxHeight: 220 }}>
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 4 }}
                    ListEmptyComponent={
                        loading ? (
                            <View className="flex-row items-center justify-center gap-2 py-4">
                                <ActivityIndicator size="small" color={THEME[theme].mutedForeground} />
                                <Text className="text-xs text-muted-foreground">Searching files...</Text>
                            </View>
                        ) : (
                            <Text className="text-xs text-muted-foreground text-center py-4">
                                No matches — keep typing or pick a subagent
                            </Text>
                        )
                    }
                />
            </View>
        </View>
    )
}

export const MentionAutocomplete = memo(MentionAutocompleteInner)
