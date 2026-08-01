import { memo, useCallback, useMemo, useState } from "react"
import { Pressable, View } from "react-native"
import { CheckIcon, ChevronRightIcon, HelpCircleIcon, XIcon } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { QuestionInfo, QuestionRequest } from "@/store/questions.store"

interface QuestionBlockProps {
    request: QuestionRequest
    theme: "light" | "dark"
    onReply: (requestId: string, answers: string[][]) => void
    onReject: (requestId: string) => void
}

const SingleQuestion = memo(function SingleQuestion({
    question,
    index,
    selected,
    customText,
    onSelect,
    onCustomChange,
    theme,
}: {
    question: QuestionInfo
    index: number
    selected: string[]
    customText: string
    onSelect: (label: string) => void
    onCustomChange: (text: string) => void
    theme: "light" | "dark"
}) {
    const isMultiple = question.multiple ?? false
    const hasCustom = question.custom ?? false

    return (
        <View className="gap-3">
            <View className="flex-row items-center gap-2">
                <View className="w-5 h-5 rounded-full bg-primary/15 items-center justify-center">
                    <Text className="text-[10px] font-bold text-primary">{index + 1}</Text>
                </View>
                <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {question.header}
                </Text>
            </View>

            <Text className="text-sm text-foreground leading-5">
                {question.question}
            </Text>

            <View className="gap-2">
                {question.options.map((option) => {
                    const isSelected = selected.includes(option.label)
                    return (
                        <Pressable
                            key={option.label}
                            onPress={() => onSelect(option.label)}
                            className={cn(
                                "flex-row items-center gap-3 p-3 rounded-xl border transition-colors",
                                isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border/50 bg-accent/30 active:bg-accent/50"
                            )}
                        >
                            {isMultiple ? (
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => onSelect(option.label)}
                                />
                            ) : (
                                <View
                                    className={cn(
                                        "w-4 h-4 rounded-full border-2 items-center justify-center",
                                        isSelected ? "border-primary" : "border-muted-foreground/40"
                                    )}
                                >
                                    {isSelected && (
                                        <View className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </View>
                            )}
                            <View className="flex-1">
                                <Text className={cn(
                                    "text-sm font-medium",
                                    isSelected ? "text-primary" : "text-foreground"
                                )}>
                                    {option.label}
                                </Text>
                                {option.description ? (
                                    <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                                        {option.description}
                                    </Text>
                                ) : null}
                            </View>
                            {isSelected && (
                                <CheckIcon size={14} color={THEME[theme].primary} className="opacity-70" />
                            )}
                        </Pressable>
                    )
                })}

                {hasCustom && (
                    <View className="gap-2 mt-1">
                        <Text className="text-xs text-muted-foreground font-medium">
                            Or type your own answer:
                        </Text>
                        <Textarea
                            placeholder="Type your answer..."
                            value={customText}
                            onChangeText={onCustomChange}
                            className="min-h-[60px] text-sm"
                            numberOfLines={2}
                        />
                    </View>
                )}
            </View>
        </View>
    )
})

export const QuestionBlock = memo(function QuestionBlock({ request, theme, onReply, onReject }: QuestionBlockProps) {
    const [selections, setSelections] = useState<string[][]>(
        request.questions.map(() => [])
    )
    const [customTexts, setCustomTexts] = useState<string[]>(
        request.questions.map(() => "")
    )
    const [submitting, setSubmitting] = useState(false)

    const handleSelect = useCallback((questionIndex: number, label: string) => {
        setSelections((prev) => {
            const next = [...prev]
            const isMultiple = request.questions[questionIndex].multiple ?? false
            const current = next[questionIndex] ?? []

            if (isMultiple) {
                next[questionIndex] = current.includes(label)
                    ? current.filter((l) => l !== label)
                    : [...current, label]
            } else {
                next[questionIndex] = current.includes(label) ? [] : [label]
            }
            return next
        })
    }, [request.questions])

    const handleCustomChange = useCallback((questionIndex: number, text: string) => {
        setCustomTexts((prev) => {
            const next = [...prev]
            next[questionIndex] = text
            return next
        })
    }, [])

    const canSubmit = useMemo(() => selections.every((sel, i) => {
        const hasCustom = request.questions[i].custom ?? false
        const hasCustomText = hasCustom && (customTexts[i] ?? "").trim().length > 0
        return sel.length > 0 || hasCustomText
    }), [selections, customTexts, request.questions])

    const handleSubmit = useCallback(async () => {
        if (!canSubmit || submitting) return
        setSubmitting(true)

        const answers = selections.map((sel, i) => {
            const hasCustom = request.questions[i].custom ?? false
            const customText = (customTexts[i] ?? "").trim()
            if (hasCustom && customText) {
                return [...sel, customText]
            }
            return sel
        })

        try {
            await onReply(request.id, answers)
        } finally {
            setSubmitting(false)
        }
    }, [canSubmit, submitting, selections, customTexts, request, onReply])

    const handleReject = useCallback(async () => {
        if (submitting) return
        setSubmitting(true)
        try {
            await onReject(request.id)
        } finally {
            setSubmitting(false)
        }
    }, [submitting, request.id, onReject])

    return (
        <View className="rounded-2xl border border-primary/20 bg-card overflow-hidden shadow-sm">
            <View className="flex-row items-center gap-2 px-4 py-3 bg-primary/5 border-b border-primary/10">
                <HelpCircleIcon size={16} color={THEME[theme].primary} />
                <Text className="text-sm font-semibold text-foreground flex-1">
                    {request.questions.length === 1 ? "Question" : `${request.questions.length} Questions`}
                </Text>
                <Pressable
                    onPress={handleReject}
                    disabled={submitting}
                    className="w-6 h-6 rounded-full items-center justify-center active:bg-destructive/10"
                    hitSlop={8}
                >
                    <XIcon size={14} color={THEME[theme].mutedForeground} />
                </Pressable>
            </View>

            <View className="p-4 gap-5">
                {request.questions.map((q, i) => (
                    <View key={i}>
                        {i > 0 && <View className="h-px bg-border/50 mb-5" />}
                        <SingleQuestion
                            question={q}
                            index={i}
                            selected={selections[i] ?? []}
                            customText={customTexts[i] ?? ""}
                            onSelect={(label) => handleSelect(i, label)}
                            onCustomChange={(text) => handleCustomChange(i, text)}
                            theme={theme}
                        />
                    </View>
                ))}
            </View>

            <View className="px-4 pb-4">
                <Button
                    className="w-full rounded-xl"
                    onPress={handleSubmit}
                    disabled={!canSubmit || submitting}
                >
                    <Text className="text-sm font-medium">
                        {submitting ? "Sending..." : "Submit Answer"}
                    </Text>
                    {!submitting && <ChevronRightIcon size={14} />}
                </Button>
            </View>
        </View>
    )
})
