import Markdown from "react-native-marked"

export default function MarkdownRenderer({ children }: { children: string }) {
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