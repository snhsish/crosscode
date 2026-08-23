import { memo, useCallback, useMemo, useState } from "react"
import { Pressable, View } from "react-native"
import ShieldIcon from "lucide-react-native/dist/esm/icons/shield"
import TerminalIcon from "lucide-react-native/dist/esm/icons/terminal"
import FileEditIcon from "lucide-react-native/dist/esm/icons/file-pen"
import FileIcon from "lucide-react-native/dist/esm/icons/file"
import GlobeIcon from "lucide-react-native/dist/esm/icons/globe"
import EyeIcon from "lucide-react-native/dist/esm/icons/eye"
import CheckIcon from "lucide-react-native/dist/esm/icons/check"
import XIcon from "lucide-react-native/dist/esm/icons/x"
import ClockIcon from "lucide-react-native/dist/esm/icons/clock"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { PermissionRequest } from "@/store/permissions.store"

interface PermissionBlockProps {
    request: PermissionRequest
    theme: "light" | "dark"
    onReply: (requestId: string, reply: "once" | "always" | "reject", message?: string) => void
}

function getPermissionIcon(permission: string) {
    switch (permission.toLowerCase()) {
        case "bash":
            return TerminalIcon
        case "edit":
            return FileEditIcon
        case "read":
            return FileIcon
        case "write":
            return FileEditIcon
        case "webfetch":
        case "websearch":
            return GlobeIcon
        case "glob":
        case "grep":
        case "list":
            return EyeIcon
        default:
            return ShieldIcon
    }
}

function getPermissionLabel(permission: string): string {
    switch (permission.toLowerCase()) {
        case "bash":
            return "Run Command"
        case "edit":
            return "Edit File"
        case "read":
            return "Read File"
        case "write":
            return "Write File"
        case "webfetch":
            return "Fetch URL"
        case "websearch":
            return "Search Web"
        case "glob":
            return "Search Files"
        case "grep":
            return "Search Content"
        case "list":
            return "List Directory"
        case "task":
            return "Run Task"
        default:
            return permission
    }
}

function extractDetails(metadata: Record<string, unknown>): { label: string; value: string }[] {
    const details: { label: string; value: string }[] = []

    if (typeof metadata.command === "string") {
        details.push({ label: "Command", value: metadata.command })
    }
    if (typeof metadata.filePath === "string") {
        details.push({ label: "File", value: metadata.filePath })
    }
    if (typeof metadata.url === "string") {
        details.push({ label: "URL", value: metadata.url })
    }
    if (typeof metadata.description === "string") {
        details.push({ label: "Description", value: metadata.description })
    }
    if (typeof metadata.pattern === "string") {
        details.push({ label: "Pattern", value: metadata.pattern })
    }
    if (typeof metadata.query === "string") {
        details.push({ label: "Query", value: metadata.query })
    }
    if (typeof metadata.directory === "string") {
        details.push({ label: "Directory", value: metadata.directory })
    }

    return details
}

export const PermissionBlock = memo(function PermissionBlock({
    request,
    theme,
    onReply,
}: PermissionBlockProps) {
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [showMessage, setShowMessage] = useState(false)

    const IconComponent = getPermissionIcon(request.permission)
    const label = getPermissionLabel(request.permission)
    const details = useMemo(() => extractDetails(request.metadata), [request.metadata])

    const handleReply = useCallback(
        async (reply: "once" | "always" | "reject") => {
            if (submitting) return
            setSubmitting(true)
            try {
                await onReply(request.id, reply, message.trim() || undefined)
            } finally {
                setSubmitting(false)
            }
        },
        [submitting, request.id, message, onReply]
    )

    const hasAlwaysOption = request.always.length > 0

    return (
        <View className="rounded-2xl border border-amber-500/30 bg-card overflow-hidden shadow-sm">
            <View className="flex-row items-center gap-2 px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                <IconComponent size={16} color={theme === "dark" ? "#fbbf24" : "#d97706"} />
                <Text className="text-sm font-semibold text-foreground flex-1">
                    {label}
                </Text>
                <View className="px-2 py-0.5 rounded-full bg-amber-500/20">
                    <Text className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase">
                        Approval Required
                    </Text>
                </View>
            </View>

            <View className="p-4 gap-3">
                {details.length > 0 && (
                    <View className="gap-2">
                        {details.map((detail, i) => (
                            <View key={i} className="gap-0.5">
                                <Text className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    {detail.label}
                                </Text>
                                <View className="rounded-lg bg-accent/50 px-3 py-2">
                                    <Text
                                        className="text-sm text-foreground font-mono"
                                        numberOfLines={4}
                                    >
                                        {detail.value}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {request.patterns.length > 0 && (
                    <View className="gap-1">
                        <Text className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Patterns
                        </Text>
                        <View className="gap-1">
                            {request.patterns.map((pattern, i) => (
                                <View key={i} className="rounded-md bg-accent/30 px-2.5 py-1.5">
                                    <Text className="text-xs text-foreground font-mono">
                                        {pattern}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {showMessage && (
                    <View className="gap-2 mt-1">
                        <Text className="text-xs text-muted-foreground font-medium">
                            Add a message (optional):
                        </Text>
                        <Textarea
                            placeholder="Type a message..."
                            value={message}
                            onChangeText={setMessage}
                            className="min-h-[50px] text-sm"
                            numberOfLines={2}
                        />
                    </View>
                )}
            </View>

            <View className="px-4 pb-4 gap-2">
                <View className="flex-row gap-2">
                    <Button
                        className="flex-1 rounded-xl bg-emerald-600 active:bg-emerald-700"
                        onPress={() => handleReply("once")}
                        disabled={submitting}
                    >
                        <CheckIcon size={14} color="#fff" />
                        <Text className="text-sm font-medium text-white">
                            {submitting ? "..." : "Allow"}
                        </Text>
                    </Button>

                    {hasAlwaysOption && (
                        <Button
                            className="flex-1 rounded-xl bg-blue-600 active:bg-blue-700"
                            onPress={() => handleReply("always")}
                            disabled={submitting}
                        >
                            <ClockIcon size={14} color="#fff" />
                            <Text className="text-sm font-medium text-white">
                                {submitting ? "..." : "Always"}
                            </Text>
                        </Button>
                    )}

                    <Button
                        variant="destructive"
                        className="flex-1 rounded-xl"
                        onPress={() => handleReply("reject")}
                        disabled={submitting}
                    >
                        <XIcon size={14} color="#fff" />
                        <Text className="text-sm font-medium text-white">
                            {submitting ? "..." : "Reject"}
                        </Text>
                    </Button>
                </View>

                {!showMessage && (
                    <Pressable
                        onPress={() => setShowMessage(true)}
                        className="items-center py-1"
                        disabled={submitting}
                    >
                        <Text className="text-xs text-muted-foreground">
                            Add a message
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    )
})
