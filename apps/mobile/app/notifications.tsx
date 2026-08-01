import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell } from "lucide-react-native"
import { useRouter } from "expo-router"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"

export default function NotificationsPage() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-4 flex-row items-center gap-2">
        <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
          <ArrowLeft size={25} color={THEME[theme].foreground} />
        </Button>
        <Text className="text-2xl font-semibold tracking-tight">Notifications</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6 py-20 gap-4">
        <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center">
          <Bell size={28} color={THEME[theme].mutedForeground} />
        </View>
        <View className="items-center gap-1.5">
          <Text className="text-base font-semibold text-foreground">No notifications yet</Text>
          <Text className="text-sm text-muted-foreground text-center">
            You're all caught up! Check back later for updates.
          </Text>
        </View>
      </View>
    </View>
  )
}
