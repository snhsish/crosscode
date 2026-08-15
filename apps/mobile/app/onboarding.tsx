import * as React from "react"
import { FlatList, Image, Pressable, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import {
  Bell,
  Code2,
  FolderKanban,
  MessageSquareCode,
  QrCode,
  type LucideIcon,
} from "lucide-react-native"
import { useColorScheme } from "nativewind"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { THEME } from "@/lib/theme"
import { useSettings } from "@/store/settings.store"

type Slide = {
  title: string
  description: string
  icon?: LucideIcon
  accent: string
}

const SLIDES: Slide[] = [
  {
    title: "Welcome to CrossCode",
    description: "Control your OpenCode projects from anywhere.",
    accent: "bg-primary/10",
  },
  {
    title: "Connect your server",
    description: "Scan the QR code from CrossCode to securely connect your OpenCode server.",
    icon: QrCode,
    accent: "bg-blue-500/15",
  },
  {
    title: "Manage projects and sessions",
    description: "Switch connections, browse projects, and continue existing sessions from your phone.",
    icon: FolderKanban,
    accent: "bg-violet-500/15",
  },
  {
    title: "Chat, review, and control",
    description: "Chat with your coding agent, inspect activity, review diffs, and use quick prompts.",
    icon: MessageSquareCode,
    accent: "bg-emerald-500/15",
  },
  {
    title: "Stay in the loop",
    description: "Get notified about completed responses, questions, permissions, and errors.",
    icon: Bell,
    accent: "bg-amber-500/15",
  },
]

export default function OnboardingScreen() {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const completeOnboarding = useSettings((state) => state.completeOnboarding)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const listRef = React.useRef<FlatList<Slide>>(null)
  const isLastSlide = currentIndex === SLIDES.length - 1

  const finish = React.useCallback(() => {
    completeOnboarding()
    router.replace("/")
  }, [completeOnboarding, router])

  const goToNextSlide = () => {
    if (isLastSlide) {
      finish()
      return
    }

    listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="h-14 flex-row items-center justify-end px-6">
        {!isLastSlide && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={finish}
            className="rounded-full px-3 py-2 active:bg-muted"
          >
            <Text className="text-sm font-medium text-muted-foreground">Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => String(index)}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(event) => {
          setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }}
        renderItem={({ item, index }) => {
          const Icon = item.icon

          return (
            <View className="flex-1 items-center justify-center px-8" style={{ width }}>
              <View className={`mb-10 h-40 w-40 items-center justify-center rounded-[40px] ${index === 0 ? "" : item.accent}`}>
                {index === 0 ? (
                  <Image
                    source={theme === "dark" ? require("@/assets/branding-dark-mode.png") : require("@/assets/branding-light-mode.png")}
                    accessibilityLabel="CrossCode"
                    className="h-24 w-24"
                    resizeMode="contain"
                  />
                ) : Icon ? (
                  <Icon size={76} color={THEME[theme].foreground} strokeWidth={1.5} />
                ) : (
                  <Code2 size={76} color={THEME[theme].foreground} strokeWidth={1.5} />
                )}
              </View>

              <Text variant="h1" className="max-w-sm text-3xl">{item.title}</Text>
              <Text className="mt-4 max-w-sm text-center text-base leading-6 text-muted-foreground">
                {item.description}
              </Text>
            </View>
          )
        }}
      />

      <View className="px-8 pb-5">
        <View className="mb-7 flex-row items-center justify-center gap-2">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              accessibilityLabel={`Onboarding slide ${index + 1} of ${SLIDES.length}`}
              className={`h-2 rounded-full ${index === currentIndex ? "w-6 bg-primary" : "w-2 bg-muted"}`}
            />
          ))}
        </View>

        <Button size="lg" className="rounded-full" onPress={goToNextSlide} accessibilityLabel={isLastSlide ? "Get started" : "Next slide"}>
          <Text>{isLastSlide ? "Get Started" : "Next"}</Text>
        </Button>
      </View>
    </View>
  )
}
