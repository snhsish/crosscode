import { memo } from "react"
import { Pressable, StyleProp, TextInput, View, ViewStyle } from "react-native"
import { BlurView } from "expo-blur"
import SearchIcon from "lucide-react-native/dist/esm/icons/search"
import XIcon from "lucide-react-native/dist/esm/icons/x"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"

type GlassTheme = "light" | "dark"

function glassColors(theme: GlassTheme) {
    return theme === "dark"
        ? { fill: "rgba(28,28,32,0.62)", border: "rgba(255,255,255,0.14)", fallback: "rgba(24,24,27,0.88)" }
        : { fill: "rgba(255,255,255,0.68)", border: "rgba(0,0,0,0.08)", fallback: "rgba(255,255,255,0.92)" }
}

interface GlassViewProps {
    theme: GlassTheme
    borderRadius?: number
    intensity?: number
    children?: React.ReactNode
    className?: string
    style?: StyleProp<ViewStyle>
    pointerEvents?: "none" | "auto" | "box-none" | "box-only"
}

function GlassViewInner({ theme, borderRadius = 22, intensity = 50, children, className, style, pointerEvents }: GlassViewProps) {
    const c = glassColors(theme)
    return (
        <View
            pointerEvents={pointerEvents}
            className={cn("overflow-hidden", className)}
            style={[{ borderRadius, borderWidth: 1, borderColor: c.border, backgroundColor: c.fallback }, style]}
        >
            <BlurView
                intensity={intensity}
                tint={theme === "dark" ? "dark" : "light"}
                experimentalBlurMethod="dimezisBlurView"
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.fill }} />
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.18)" }} />
            <View style={{ flex: 1 }}>{children}</View>
        </View>
    )
}

export const GlassView = memo(GlassViewInner)

interface GlassCircleButtonProps {
    theme: GlassTheme
    size?: number
    onPress?: () => void
    accessibilityLabel?: string
    children?: React.ReactNode
    className?: string
}

function GlassCircleButtonInner({ theme, size = 46, onPress, accessibilityLabel, children, className }: GlassCircleButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className={cn("items-center justify-center active:opacity-70", className)}
            style={{ width: size, height: size }}
            hitSlop={8}
        >
            <GlassView theme={theme} borderRadius={size / 2} intensity={55} style={{ width: size, height: size }} className="items-center justify-center">
                <View className="items-center justify-center" style={{ width: size, height: size }}>
                    {children}
                </View>
            </GlassView>
        </Pressable>
    )
}

export const GlassCircleButton = memo(GlassCircleButtonInner)

interface GlassPillProps {
    theme: GlassTheme
    children?: React.ReactNode
    className?: string
    style?: StyleProp<ViewStyle>
}

function GlassPillInner({ theme, children, className, style }: GlassPillProps) {
    return (
        <GlassView theme={theme} borderRadius={999} intensity={55} className={cn("flex-row items-center", className)} style={style}>
            {children}
        </GlassView>
    )
}

export const GlassPill = memo(GlassPillInner)

interface GlassSearchBarProps {
    theme: GlassTheme
    value: string
    onChangeText: (t: string) => void
    placeholder?: string
    className?: string
}

function GlassSearchBarInner({ theme, value, onChangeText, placeholder = "Search...", className }: GlassSearchBarProps) {
    return (
        <GlassView theme={theme} borderRadius={999} intensity={45} className={cn("flex-row items-center px-4 h-11 gap-2", className)}>
            <SearchIcon size={17} color={THEME[theme].mutedForeground} />
            <TextInput
                className="flex-1 text-[15px] text-foreground"
                style={{ paddingVertical: 0 }}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor={THEME[theme].mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
            />
            {value.length > 0 && (
                <Pressable onPress={() => onChangeText("")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
                    <XIcon size={16} color={THEME[theme].mutedForeground} />
                </Pressable>
            )}
        </GlassView>
    )
}

export const GlassSearchBar = memo(GlassSearchBarInner)
