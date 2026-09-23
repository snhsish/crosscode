import { memo } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { agentDotColor, capitalizeAgent } from "@/lib/agent-colors"

interface AgentBadgeProps {
    name: string
    className?: string
}

function AgentBadgeInner({ name, className }: AgentBadgeProps) {
    if (!name) return null
    return (
        <View
            className={cn(
                "flex-row items-center gap-1.5 self-start rounded-full border border-border/50 bg-accent/60 px-2 py-0.5",
                className
            )}
            accessibilityRole="text"
            accessibilityLabel={`Agent: ${name}`}
        >
            <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: agentDotColor(name) }}
            />
            <Text className="text-[10px] font-medium text-muted-foreground">
                {capitalizeAgent(name)}
            </Text>
        </View>
    )
}

export const AgentBadge = memo(AgentBadgeInner)
