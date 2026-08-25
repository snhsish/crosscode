import * as React from "react"
import { Image, Linking, Pressable, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/ui/text"
import { useColorScheme } from "nativewind"
import { useRouter } from "expo-router"
import { THEME } from "@/lib/theme"

import ArrowLeft from "lucide-react-native/dist/esm/icons/arrow-left"
import Coffee from "lucide-react-native/dist/esm/icons/coffee"
import Github from "lucide-react-native/dist/esm/icons/github"
import Instagram from "lucide-react-native/dist/esm/icons/instagram"
import Twitter from "lucide-react-native/dist/esm/icons/twitter"
import MessageCircle from "lucide-react-native/dist/esm/icons/message-circle"

const SUPPORT_URL = "https://buymeacoffee.com/snhsish"
const SOURCE_URL = "https://github.com/snhsish/crosscode"
const CREDIT_URL = "https://sish.work"

const SOCIAL_LINKS: { key: string; label: string; url: string; Icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { key: "instagram", label: "Instagram", url: "https://instagram.com/snehasish", Icon: Instagram },
  { key: "github", label: "GitHub", url: "https://github.com/snhsish", Icon: Github },
  { key: "x", label: "X", url: "https://x.com/snhsish", Icon: Twitter },
  { key: "discord", label: "Discord", url: "https://discord.gg/K6k6ebkJkx", Icon: MessageCircle },
]

export default function AboutScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const theme = useColorScheme().colorScheme ?? "light"
  const openLink = React.useCallback((url: string) => Linking.openURL(url), [])

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-6 pt-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2 active:opacity-60"
          hitSlop={12}
        >
          <ArrowLeft size={24} color={THEME[theme].foreground} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, gap: 28 }}
      >
        <View className="items-center gap-4 pt-4">
          <Image
            source={theme === "dark" ? require("@/assets/branding-dark-mode.png") : require("@/assets/branding-light-mode.png")}
            className="h-20 w-20"
            resizeMode="contain"
          />
          <View className="items-center gap-1.5">
            <Text className="text-2xl font-bold text-foreground">CrossCode</Text>
            <Text className="text-sm text-muted-foreground text-center">
              An Opencode remote mobile client
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Pressable
            onPress={() => openLink(SUPPORT_URL)}
            className="flex-row items-center gap-4 rounded-xl bg-muted/50 p-4 active:bg-muted/70"
          >
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Coffee size={20} color={THEME[theme].primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Support project</Text>
              <Text className="text-xs text-muted-foreground">buymeacoffee.com/snhsish</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => openLink(SOURCE_URL)}
            className="flex-row items-center gap-4 rounded-xl bg-muted/50 p-4 active:bg-muted/70"
          >
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Github size={20} color={THEME[theme].primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">GitHub Source</Text>
              <Text className="text-xs text-muted-foreground">github.com/snhsish/crosscode</Text>
            </View>
          </Pressable>
        </View>

        <View className="gap-3">
          <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70 px-1">
            Social
          </Text>
          <View className="flex-row justify-between gap-3">
            {SOCIAL_LINKS.map(({ key, label, url, Icon }) => (
              <Pressable
                key={key}
                onPress={() => openLink(url)}
                className="flex-1 items-center gap-2 rounded-xl bg-muted/50 py-4 active:bg-muted/70"
                hitSlop={8}
              >
                <View className="w-11 h-11 rounded-full bg-background items-center justify-center">
                  <Icon size={22} color={THEME[theme].foreground} />
                </View>
                <Text className="text-[11px] font-medium text-muted-foreground">{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="items-center pt-2">
          <Text className="text-xs text-muted-foreground/60">
            Made by{" "}
            <Text
              className="text-xs text-muted-foreground/60 underline"
              onPress={() => openLink(CREDIT_URL)}
            >
              @snhsish
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
