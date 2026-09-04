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
        case "external_directory":
            return FileIcon
        case "doom_loop":
            return ShieldIcon
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
        case "external_directory":
            return "External Directory Access"
        case "doom_loop":
            return "Repeated Action"
        default:
            return permission
    }
}

function extractDetails(request: PermissionRequest): { label: string; value: string }[] {
    const metadata = request.metadata ?? {}
    const details: { label: string; value: string }[] = []

    if (typeof request.title === "string" && request.title.length > 0) {
        details.push({ label: "Request", value: request.title })
    }

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
    if (typeof metadata.path === "string") {
        details.push({ label: "Path", value: metadata.path })
    }
    if (typeof metadata.file === "string") {
        details.push({ label: "File", value: metadata.file })
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
    const details = useMemo(() => extractDetails(request), [request])

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

    const hasAlwaysOption = true

    return (
        <View className="rounded-2xl border border-primary/20 bg-card overflow-hidden shadow-sm">
            <View className="flex-row items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-primary/10">
                <IconComponent size={14} color={THEME[theme].primary} />
                <Text className="text-[13px] font-semibold text-foreground flex-1">
                    {label}
                </Text>
                <View className="px-2 py-0.5 rounded-full bg-accent">
                    <Text className="text-[10px] font-medium text-muted-foreground uppercase">
                        Approval Required
                    </Text>
                </View>
            </View>

            <View className="px-4 py-3 gap-2.5">
                {details.length > 0 && (
                    <View className="gap-2">
                        {details.map((detail, i) => (
                            <View key={i} className="gap-0.5">
                                <Text className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    {detail.label}
                                </Text>
                                <View className="rounded-lg bg-muted px-2.5 py-1.5">
                                    <Text
                                        className="text-[13px] text-foreground font-mono"
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
                                <View key={i} className="rounded-md bg-muted px-2 py-1">
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

            <View className="px-4 pb-3 gap-1.5">
                <View className="flex-row gap-1.5">
                    <Button
                        size="sm"
                        className="flex-1 rounded-xl"
                        onPress={() => handleReply("once")}
                        disabled={submitting}
                    >
                        <CheckIcon size={12} color={THEME[theme].primaryForeground} />
                        <Text className="text-xs font-medium">
                            {submitting ? "..." : "Allow"}
                        </Text>
                    </Button>

                    {hasAlwaysOption && (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 rounded-xl"
                            onPress={() => handleReply("always")}
                            disabled={submitting}
                        >
                            <ClockIcon size={12} color={THEME[theme].secondaryForeground} />
                            <Text className="text-xs font-medium">
                                {submitting ? "..." : "Always"}
                            </Text>
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 rounded-xl"
                        onPress={() => handleReply("reject")}
                        disabled={submitting}
                    >
                        <XIcon size={12} color="#fff" />
                        <Text className="text-xs font-medium">
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
                        <Text className="text-[11px] text-muted-foreground">
                            Add a message
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    )
})
