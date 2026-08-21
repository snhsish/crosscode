import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { type ReactNode, Fragment } from "react"
import Markdown from "react-native-marked"
import type { MarkedStyles } from "react-native-marked"
import { Platform, Text, View, type TextStyle, type ViewStyle, type ImageStyle } from "react-native"
import { CodeBlock } from "@/components/code-block"
import { LinkOptionsModal } from "@/components/link-options-modal"

const monoFont = Platform.select({ ios: "Menlo", default: "monospace" })

const manropeStyles: MarkedStyles = {
    text: { fontFamily: "Manrope_400Regular" },
    em: { fontFamily: "Manrope_400Regular" },
    strong: { fontFamily: "Manrope_700Bold" },
    strikethrough: { fontFamily: "Manrope_400Regular" },
    link: { fontFamily: "Manrope_400Regular" },
    h1: { fontFamily: "Manrope_700Bold", fontSize: 20, lineHeight: 28, fontWeight: "700" },
    h2: { fontFamily: "Manrope_700Bold", fontSize: 18, lineHeight: 25, fontWeight: "700" },
    h3: { fontFamily: "Manrope_600SemiBold", fontSize: 17, lineHeight: 24, fontWeight: "600" },
    h4: { fontFamily: "Manrope_600SemiBold", fontSize: 16, lineHeight: 23, fontWeight: "600" },
    h5: { fontFamily: "Manrope_600SemiBold", fontSize: 15, lineHeight: 21, fontWeight: "600" },
    h6: { fontFamily: "Manrope_600SemiBold", fontSize: 14, lineHeight: 20, fontWeight: "600" },
    codespan: { fontFamily: monoFont },
    li: { fontFamily: "Manrope_400Regular" },
}

function keyedChildren(children: ReactNode[]): ReactNode {
    if (!Array.isArray(children)) return children
    return children.map((child, i) => <Fragment key={i}>{child}</Fragment>)
}

const createCustomRenderer = (theme: "light" | "dark", onLinkPress: (href: string) => void) => ({
    paragraph(children: ReactNode[], styles?: ViewStyle) {
        return <Text selectable={false} style={styles}>{keyedChildren(children)}</Text>
    },
    blockquote(children: ReactNode[], styles?: ViewStyle) {
        return <View style={styles}><Text selectable={false}>{keyedChildren(children)}</Text></View>
    },
    heading(text: string | ReactNode[], styles?: TextStyle, depth?: number) {
        return <Text selectable={false} style={styles}>{Array.isArray(text) ? keyedChildren(text) : text}</Text>
    },
    code(text: string, language?: string, containerStyle?: ViewStyle, textStyle?: TextStyle) {
        return <CodeBlock text={text} language={language} theme={theme} />
    },
    hr(styles?: ViewStyle) {
        return <View style={styles} />
    },
    listItem(children: ReactNode[], styles?: ViewStyle) {
        return <Text selectable={false} style={styles}>{keyedChildren(children)}</Text>
    },
    list(ordered: boolean, li: ReactNode[], listStyle?: ViewStyle, textStyle?: TextStyle, startIndex?: number) {
        return <View style={listStyle}>{li.map((item, i) => <Text key={i} selectable={false} style={textStyle}>{item}</Text>)}</View>
    },
    escape(text: string, styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{text}</Text>
    },
    text(text: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{Array.isArray(text) ? keyedChildren(text) : text}</Text>
    },
    strong(children: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{Array.isArray(children) ? keyedChildren(children) : children}</Text>
    },
    em(children: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{Array.isArray(children) ? keyedChildren(children) : children}</Text>
    },
    codespan(text: string, styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{text}</Text>
    },
    br() {
        return <Text selectable={false}>{"\n"}</Text>
    },
    del(children: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{Array.isArray(children) ? keyedChildren(children) : children}</Text>
    },
    link(children: string | ReactNode[], href: string, styles?: TextStyle, title?: string) {
        return (
            <Text
                selectable={false}
                style={styles}
                onPress={() => {
                    if (href) onLinkPress(href)
                }}
            >
                {Array.isArray(children) ? keyedChildren(children) : children}
            </Text>
        )
    },
    image(uri: string, alt?: string, style?: ImageStyle, title?: string) {
        return null
    },
    html(text: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{Array.isArray(text) ? keyedChildren(text) : text}</Text>
    },
    linkImage(href: string, imageUrl: string, alt?: string, style?: ImageStyle, title?: string | null) {
        return null
    },
    table(header: ReactNode[][], rows: ReactNode[][][], tableStyle?: ViewStyle, rowStyle?: ViewStyle, cellStyle?: ViewStyle) {
        return <View style={tableStyle}><Text selectable={false}>Table</Text></View>
    },
})

function MarkdownRendererInner({ children, streaming, theme }: { children: string; streaming?: boolean; theme: "light" | "dark" }) {
    const [parsed, setParsed] = useState(children)
    const [pendingLink, setPendingLink] = useState<string | null>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const onLinkPress = useCallback((href: string) => setPendingLink(href), [])
    const customRenderer = useMemo(() => createCustomRenderer(theme, onLinkPress), [theme, onLinkPress])

    useEffect(() => {
        if (streaming) {
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => {
                setParsed(children)
            }, 150)
            return () => {
                if (timerRef.current) clearTimeout(timerRef.current)
            }
        }
        setParsed(children)
    }, [children, streaming])

    if (streaming && parsed !== children) {
        return <Text className="text-sm text-foreground leading-relaxed font-sans">{children}</Text>
    }

    return (
        <>
            <Markdown
                value={parsed}
                renderer={customRenderer}
                styles={manropeStyles}
                flatListProps={{
                    scrollEnabled: false,
                    style: {
                        backgroundColor: "transparent"
                    }
                }}
            />
            <LinkOptionsModal open={pendingLink !== null} url={pendingLink} onClose={() => setPendingLink(null)} theme={theme} />
        </>
    )
}

const MemoMarkdown = memo(MarkdownRendererInner, (prev, next) => prev.children === next.children && prev.streaming === next.streaming && prev.theme === next.theme)

export default MemoMarkdown
