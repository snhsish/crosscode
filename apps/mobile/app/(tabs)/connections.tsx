import * as React from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { useConnections } from "@/store/connection.store"
import { useColorScheme } from "nativewind"
import { THEME } from "@/lib/theme"
import { Server, Wifi, WifiOff } from "lucide-react-native"
import { cn } from "@/lib/utils"

export default function ConnectionsScreen() {
  const insets = useSafeAreaInsets()
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "light"
  const { connections, current } = useConnections()

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 10 }}>
      <View className="px-6 pb-6">
        <Text className="text-3xl font-semibold tracking-tight">Connections</Text>
        <Text className="text-muted-foreground text-sm mt-1">
          Manage your remote server connections
        </Text>
      </View>

      <View className="px-6 gap-3">
        {connections.length === 0 ? (
          <View className="items-center pt-10">
            <Text className="text-muted-foreground">No connections yet</Text>
          </View>
        ) : (
          connections.map((c) => {
            const isActive = c.id === current
            return (
              <View
                key={c.id}
                className={cn(
                  "flex-row items-center gap-3 rounded-xl p-4 border",
                  isActive ? "bg-muted/50 border-border" : "bg-muted/30 border-border/50 opacity-60"
                )}
              >
                <View className={cn("w-10 h-10 rounded-xl items-center justify-center", isActive ? "bg-green-500/20" : "bg-muted")}>
                  {isActive ? (
                    <Wifi size={18} color={THEME[theme].foreground} />
                  ) : (
                    <WifiOff size={18} color={THEME[theme].mutedForeground} />
                  )}
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="font-semibold text-sm">{c.name}</Text>
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {c.url.replace(/^https?:\/\//, "")}
                  </Text>
                </View>
                <Server size={16} color={THEME[theme].mutedForeground} />
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}
