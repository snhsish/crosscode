import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"
import { ModelVariant } from "@/lib/models"
import * as SelectPrimitive from "@rn-primitives/select"
import { ChevronDown } from "lucide-react-native"
import * as React from "react"
import { Platform } from "react-native"

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

function VariantSelectTrigger({
    ref,
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
    children?: React.ReactNode
}) {
    return (
        <SelectPrimitive.Trigger
            ref={ref}
            style={{ borderWidth: 0 }}
            className={cn(
                "bg-transparent flex h-8 flex-row items-center justify-between gap-1 rounded-md border px-2 py-1 shadow-sm shadow-black/5",
                Platform.select({
                    web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-input/50 w-fit whitespace-nowrap text-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
                }),
                props.disabled && "opacity-50",
                className
            )}
            {...props}>
            <>{children}</>
            <Icon as={ChevronDown} aria-hidden={true} className="text-muted-foreground size-3" />
        </SelectPrimitive.Trigger>
    )
}

export {
    VariantSelectTrigger,
    capitalize,
}
export type { ModelVariant }
