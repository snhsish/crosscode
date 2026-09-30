import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Platform, ScrollView, Pressable, View, type TextStyle } from "react-native"
import * as Clipboard from "expo-clipboard"
import CheckIcon from "lucide-react-native/dist/esm/icons/check"
import CopyIcon from "lucide-react-native/dist/esm/icons/copy"
import { Highlight, themes } from "prism-react-renderer"
import { displayLanguage, ensurePrismLanguages, normalizeLanguage } from "@/lib/prism"
import { THEME } from "@/lib/theme"
import { Text } from "@/components/ui/text"

const monoFont = Platform.select({ ios: "Menlo", default: "monospace" })

const codeTextStyle: TextStyle = {
    fontFamily: monoFont,
    fontSize: 13,
    lineHeight: 20,
}

interface CodeBlockProps {
    text: string
    language?: string
    theme: "light" | "dark"
    header?: boolean
    lineNumbers?: boolean
}

const MAX_CODE_CHARS = 20000

function CodeBlockInner({ text, language, theme, header = true, lineNumbers = false }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        // Defer sync prism grammar requires off the render path.
        const t = setTimeout(() => ensurePrismLanguages(), 0)
        return () => {
            clearTimeout(t)
            if (copyTimer.current) clearTimeout(copyTimer.current)
        }
    }, [])
    const prismTheme = theme === "dark" ? themes.oneDark : themes.github
    const normalizedLanguage = useMemo(() => normalizeLanguage(language), [language])
    const label = useMemo(() => displayLanguage(language), [language])
    const truncated = text.length > MAX_CODE_CHARS && !expanded
    const code = useMemo(() => {
        const raw = truncated ? text.slice(0, MAX_CODE_CHARS) : text
        return raw.endsWith("\n") ? raw.slice(0, -1) : raw
    }, [text, truncated])

    const copyCode = async () => {
        await Clipboard.setStringAsync(code)
        setCopied(true)
        if (copyTimer.current) clearTimeout(copyTimer.current)
        copyTimer.current = setTimeout(() => setCopied(false), 1500)
    }

    if (!header) {
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 4 }}>
                <Highlight code={code} language={normalizedLanguage} theme={prismTheme}>
                    {({ tokens, getTokenProps }) => (
                        <View>
                            {tokens.map((line, lineIndex) => (
                                <View key={lineIndex} className="flex-row">
                                    {lineNumbers && (
                                        <Text
                                            style={[
                                                codeTextStyle,
                                                {
                                                    width: 32,
                                                    marginRight: 12,
                                                    textAlign: "right",
                                                    color: THEME[theme].mutedForeground,
                                                    opacity: 0.6,
                                                },
                                            ]}
                                        >
                                            {lineIndex + 1}
                                        </Text>
                                    )}
                                    <View className="flex-row flex-shrink-0">
                                        {line.map((token, tokenIndex) => {
                                            const tokenProps = getTokenProps({ token })
                                            return (
                                                <Text
                                                    key={tokenIndex}
                                                    style={[
                                                        codeTextStyle,
                                                        { color: prismTheme.plain.color },
                                                        tokenProps.style as TextStyle | undefined,
                                                    ]}
                                                >
                                                    {tokenProps.children}
                                                </Text>
                                            )
                                        })}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </Highlight>
            </ScrollView>
        )
    }

    return (
        <View
            className="overflow-hidden rounded-lg border border-border/60"
            style={{ backgroundColor: prismTheme.plain.backgroundColor }}
        >
            <View className="flex-row items-center justify-between border-b border-border/40 px-3 py-1.5">
                <Text className="text-xs text-muted-foreground" style={{ fontFamily: monoFont }}>{label}</Text>
                <Pressable
                    accessibilityLabel={copied ? "Code copied" : "Copy code"}
                    accessibilityRole="button"
                    className="rounded p-1 active:opacity-60"
                    onPress={copyCode}
                >
                    {copied ? (
                        <CheckIcon size={14} color={THEME[theme].mutedForeground} />
                    ) : (
                        <CopyIcon size={14} color={THEME[theme].mutedForeground} />
                    )}
                </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
                <Highlight code={code} language={normalizedLanguage} theme={prismTheme}>
                    {({ tokens, getTokenProps }) => (
                        <View>
                            {tokens.map((line, lineIndex) => (
                                <View key={lineIndex} className="flex-row">
                                    {line.map((token, tokenIndex) => {
                                        const tokenProps = getTokenProps({ token })
                                        return (
                                            <Text
                                                key={tokenIndex}
                                                style={[
                                                    codeTextStyle,
                                                    { color: prismTheme.plain.color },
                                                    tokenProps.style as TextStyle | undefined,
                                                ]}
                                            >
                                                {tokenProps.children}
                                            </Text>
                                        )
                                    })}
                                </View>
                            ))}
                        </View>
                    )}
                </Highlight>
            </ScrollView>
            {truncated && (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Show full code"
                    className="border-t border-border/40 px-3 py-2 active:opacity-60"
                    onPress={() => setExpanded(true)}
                >
                    <Text className="text-xs text-muted-foreground">Show more ({Math.round(text.length / 1000)}k chars)</Text>
                </Pressable>
            )}
        </View>
    )
}

export const CodeBlock = memo(CodeBlockInner)
