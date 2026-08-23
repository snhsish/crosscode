import { View, Pressable } from "react-native"
import { Text } from "@/components/ui/text"
import { Card } from "@/components/ui/card"
import ChevronRight from "lucide-react-native/dist/esm/icons/chevron-right"
import { useColorScheme } from "nativewind"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import React from "react"

function SettingsSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </Text>
  )
}

function SettingsGroup({ className, ...props }: React.ComponentProps<typeof View>) {
  return <Card className={cn("gap-0 py-2 overflow-hidden", className)} {...props} />
}

function SettingsSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      {title ? <SettingsSectionLabel>{title}</SettingsSectionLabel> : null}
      <SettingsGroup>{children}</SettingsGroup>
    </View>
  )
}

function SettingsIcon({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "default" | "destructive"
}) {
  return (
    <View
      className={cn(
        "h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        variant === "destructive" ? "bg-destructive/10" : "bg-primary/10"
      )}
    >
      {children}
    </View>
  )
}

function SettingsRow({
  icon,
  title,
  description,
  control,
  destructive,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  control?: React.ReactNode
  destructive?: boolean
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-2.5">
      {icon ? <SettingsIcon variant={destructive ? "destructive" : "default"}>{icon}</SettingsIcon> : null}
      <View className="flex-1 min-w-0">
        <Text className={cn("text-sm font-medium", destructive && "text-destructive")}>{title}</Text>
        {description ? (
          <Text className="mt-0.5 text-xs text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      {control}
    </View>
  )
}

function SettingsLinkRow({
  icon,
  title,
  description,
  onPress,
  destructive,
  disabled,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  onPress?: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      className={cn(
        "flex-row items-center gap-3 px-4 py-2.5 active:bg-muted/50",
        disabled && "opacity-50"
      )}
    >
      {icon ? <SettingsIcon variant={destructive ? "destructive" : "default"}>{icon}</SettingsIcon> : null}
      <View className="min-w-0 flex-1">
        <Text className={cn("text-sm font-medium", destructive && "text-destructive")}>{title}</Text>
        {description ? (
          <Text className="mt-0.5 text-xs text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={THEME[theme].mutedForeground} />
    </Pressable>
  )
}

function SettingsDivider() {
  return <View className="ml-16 h-px bg-border opacity-60" />
}

export {
  SettingsGroup,
  SettingsIcon,
  SettingsLinkRow,
  SettingsRow,
  SettingsSection,
  SettingsSectionLabel,
  SettingsDivider,
}
