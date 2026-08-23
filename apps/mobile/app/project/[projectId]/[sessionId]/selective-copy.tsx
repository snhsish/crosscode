import { useCallback, useEffect, useRef, useState } from "react"
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native"
import { useRouter } from "expo-router"
import ArrowLeftIcon from "lucide-react-native/dist/esm/icons/arrow-left"
import CopyIcon from "lucide-react-native/dist/esm/icons/copy"
import Undo2Icon from "lucide-react-native/dist/esm/icons/undo-2"
import Redo2Icon from "lucide-react-native/dist/esm/icons/redo-2"
import * as Clipboard from "expo-clipboard"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import { THEME } from "@/lib/theme"
import { Text } from "@/components/ui/text"
import { useSelectiveCopy } from "@/store/selective-copy.store"
import { cn } from "@/lib/utils"

const MAX_HISTORY = 200
const DEBOUNCE_MS = 400

export default function SelectiveCopyScreen() {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { colorScheme } = useColorScheme()
    const theme = colorScheme ?? "dark"
    const t = THEME[theme]

    const initialText = useSelectiveCopy((s) => s.text)
    const textInputRef = useRef<TextInput>(null)

    const [text, setText] = useState(initialText)
    const historyRef = useRef<string[]>([initialText])
    const historyIndexRef = useRef(0)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)
    const [copied, setCopied] = useState(false)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => textInputRef.current?.focus(), 300)
        return () => clearTimeout(timer)
    }, [])

    const syncUndoRedoState = useCallback((idx: number, hist: string[]) => {
        setCanUndo(idx > 0)
        setCanRedo(idx < hist.length - 1)
    }, [])

    const handleChangeText = useCallback((newText: string) => {
        setText(newText)
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
            const hist = historyRef.current
            const idx = historyIndexRef.current
            const truncated = hist.slice(0, idx + 1)
            truncated.push(newText)
            if (truncated.length > MAX_HISTORY) truncated.shift()
            historyRef.current = truncated
            historyIndexRef.current = truncated.length - 1
            syncUndoRedoState(historyIndexRef.current, truncated)
        }, DEBOUNCE_MS)
    }, [syncUndoRedoState])

    const handleUndo = useCallback(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        const idx = historyIndexRef.current
        if (idx <= 0) return
        const newIndex = idx - 1
        historyIndexRef.current = newIndex
        const prev = historyRef.current[newIndex]
        setText(prev)
        syncUndoRedoState(newIndex, historyRef.current)
    }, [syncUndoRedoState])

    const handleRedo = useCallback(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        const hist = historyRef.current
        const idx = historyIndexRef.current
        if (idx >= hist.length - 1) return
        const newIndex = idx + 1
        historyIndexRef.current = newIndex
        const next = hist[newIndex]
        setText(next)
        syncUndoRedoState(newIndex, hist)
    }, [syncUndoRedoState])

    const handleCopyAll = useCallback(async () => {
        await Clipboard.setStringAsync(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }, [text])

    const handleBack = useCallback(() => {
        useSelectiveCopy.getState().clear()
        router.back()
    }, [router])

    return (
        <KeyboardAvoidingView
            className="flex-1"
            style={{ backgroundColor: t.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View
                className="flex-row items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: t.border, paddingTop: insets.top + 12, paddingLeft: Math.max(insets.left, 16) }}
            >
                <Pressable onPress={handleBack} className="p-1 -ml-1 active:opacity-60">
                    <ArrowLeftIcon size={22} color={t.foreground} />
                </Pressable>
                <Text className="text-lg font-semibold flex-1" style={{ color: t.foreground }}>
                    Selective Copy
                </Text>
                <View className="flex-row items-center gap-1">
                    <Pressable
                        onPress={handleUndo}
                        disabled={!canUndo}
                        className={cn("p-2 rounded-lg active:bg-accent/50", !canUndo && "opacity-30")}
                    >
                        <Undo2Icon size={20} color={t.foreground} />
                    </Pressable>
                    <Pressable
                        onPress={handleRedo}
                        disabled={!canRedo}
                        className={cn("p-2 rounded-lg active:bg-accent/50", !canRedo && "opacity-30")}
                    >
                        <Redo2Icon size={20} color={t.foreground} />
                    </Pressable>
                    <Pressable
                        onPress={handleCopyAll}
                        className="p-2 rounded-lg active:bg-accent/50"
                    >
                        <CopyIcon size={20} color={copied ? "#22c55e" : t.foreground} />
                    </Pressable>
                </View>
            </View>

            <TextInput
                ref={textInputRef}
                className="flex-1 px-4 py-3 text-base"
                style={{
                    color: t.foreground,
                    textAlignVertical: "top",
                    fontFamily: "Manrope_400Regular",
                }}
                value={text}
                onChangeText={handleChangeText}
                multiline
                scrollEnabled
                selectionColor={t.ring}
                placeholder="No text to edit"
                placeholderTextColor={t.mutedForeground}
            />

            {copied && (
                <View
                    className="absolute bottom-6 self-center px-4 py-2 rounded-full"
                    style={{ backgroundColor: "#22c55e" }}
                >
                    <Text className="text-white text-sm font-medium">Copied to clipboard</Text>
                </View>
            )}
        </KeyboardAvoidingView>
    )
}
