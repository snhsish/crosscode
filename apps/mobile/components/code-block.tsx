import { useState } from "react"
import { Platform, ScrollView, Pressable, View, type TextStyle } from "react-native"
import * as Clipboard from "expo-clipboard"
import { CheckIcon, CopyIcon } from "lucide-react-native"
import { Highlight, themes } from "prism-react-renderer"
import { displayLanguage, normalizeLanguage } from "@/lib/prism"
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
}

export function CodeBlock({ text, language, theme }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)
    const prismTheme = theme === "dark" ? themes.oneDark : themes.github
    const normalizedLanguage = normalizeLanguage(language)
    const label = displayLanguage(language)
    const code = text.endsWith("\n") ? text.slice(0, -1) : text

    const copyCode = async () => {
        await Clipboard.setStringAsync(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
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
        </View>
    )
}
