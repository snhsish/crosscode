import { memo } from "react"
import Markdown from "react-native-marked"

function MarkdownRendererInner({ children }: { children: string }) {
    return (
        <Markdown
            value={children}
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
