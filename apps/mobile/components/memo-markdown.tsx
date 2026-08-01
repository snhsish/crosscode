import { memo } from "react"
import { type ReactNode } from "react"
import Markdown from "react-native-marked"
import { Text, View, type TextStyle, type ViewStyle, type ImageStyle } from "react-native"

const customRenderer = {
    paragraph(children: ReactNode[], styles?: ViewStyle) {
        return <Text selectable={false} style={styles}>{children}</Text>
    },
    blockquote(children: ReactNode[], styles?: ViewStyle) {
        return <View style={styles}><Text selectable={false}>{children}</Text></View>
    },
    heading(text: string | ReactNode[], styles?: TextStyle, depth?: number) {
        return <Text selectable={false} style={styles}>{text}</Text>
    },
    code(text: string, language?: string, containerStyle?: ViewStyle, textStyle?: TextStyle) {
        return <View style={containerStyle}><Text selectable={false} style={textStyle}>{text}</Text></View>
    },
    hr(styles?: ViewStyle) {
        return <View style={styles} />
    },
    listItem(children: ReactNode[], styles?: ViewStyle) {
        return <Text selectable={false} style={styles}>{children}</Text>
    },
    list(ordered: boolean, li: ReactNode[], listStyle?: ViewStyle, textStyle?: TextStyle, startIndex?: number) {
        return <View style={listStyle}>{li.map((item, i) => <Text key={i} selectable={false} style={textStyle}>{item}</Text>)}</View>
    },
    escape(text: string, styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{text}</Text>
    },
    text(text: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{text}</Text>
    },
    strong(children: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{children}</Text>
    },
    em(children: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{children}</Text>
    },
    codespan(text: string, styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{text}</Text>
    },
    br() {
        return <Text selectable={false}>{"\n"}</Text>
    },
    del(children: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{children}</Text>
    },
    link(children: string | ReactNode[], href: string, styles?: TextStyle, title?: string) {
        return <Text selectable={false} style={styles}>{children}</Text>
    },
    image(uri: string, alt?: string, style?: ImageStyle, title?: string) {
        return null
    },
    html(text: string | ReactNode[], styles?: TextStyle) {
        return <Text selectable={false} style={styles}>{text}</Text>
    },
    linkImage(href: string, imageUrl: string, alt?: string, style?: ImageStyle, title?: string | null) {
        return null
    },
    table(header: ReactNode[][], rows: ReactNode[][][], tableStyle?: ViewStyle, rowStyle?: ViewStyle, cellStyle?: ViewStyle) {
        return <View style={tableStyle}><Text selectable={false}>Table</Text></View>
    },
}

function MarkdownRendererInner({ children }: { children: string }) {
    return (
        <Markdown
            value={children}
            renderer={customRenderer}
            flatListProps={{
                scrollEnabled: false,
                style: {
                    backgroundColor: "transparent"
                }
            }}
        />
    )
}

const MemoMarkdown = memo(MarkdownRendererInner, (prev, next) => prev.children === next.children)

export default MemoMarkdown
