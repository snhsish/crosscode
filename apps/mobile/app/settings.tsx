import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react-native"
import { useRouter } from "expo-router"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"

export default function Settings() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-4">
        <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
          <ArrowLeft size={25} color={THEME[theme].foreground} />
        </Button>
      </View>
      <View className="p-6 flex items-center justify-center">
        <Text className="text-2xl font-semibold tracking-tight">Settings</Text>
      </View>
    </View>
  )
}
