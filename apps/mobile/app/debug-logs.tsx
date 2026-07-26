import { View, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react-native"
import { useRouter } from "expo-router"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"

export default function DebugLogs() {
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
        <Text className="text-2xl font-semibold tracking-tight">Debug Logs</Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-muted-foreground text-sm">No logs available yet.</Text>
        </View>
      </ScrollView>
    </View>
  )
}
