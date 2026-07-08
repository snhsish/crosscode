import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"
import * as SelectPrimitive from "@rn-primitives/select"
import { ChevronDown } from "lucide-react-native"
import * as React from "react"
import { Platform } from "react-native"

function AgentSelectTrigger({
    ref,
    className,
    children,
    size = "default",
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
    children?: React.ReactNode
    size?: "default" | "sm"
}) {
    return (
        <SelectPrimitive.Trigger
            ref={ref}
            style={{ borderWidth: 0 }}
            className={cn(
                "bg-transparent flex h-10 flex-row items-center justify-between gap-2 rounded-md border px-3 py-2 shadow-sm shadow-black/5 sm:h-9",
                Platform.select({
                    web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-input/50 w-fit whitespace-nowrap text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
                }),
                props.disabled && "opacity-50",
                size === "sm" && "h-8 py-2 sm:py-1.5",
                className
            )}
            {...props}>
            <>{children}</>
            <Icon as={ChevronDown} aria-hidden={true} className="text-muted-foreground size-4" />
        </SelectPrimitive.Trigger>
    )
}




export {
    AgentSelectTrigger,
}
