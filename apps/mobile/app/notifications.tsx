import { Pressable, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, CheckCheck, CheckCircle2, CircleAlert, CircleHelp, ShieldAlert, Trash2 } from "lucide-react-native"
import { useRouter } from "expo-router"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { useNotifications, Notification } from "@/store/notifications.store"
import { cn } from "@/lib/utils"

function NotificationIcon({ notification, theme }: { notification: Notification; theme: "light" | "dark" }) {
  const color =
    notification.type === "success"
      ? "#22c55e"
      : notification.type === "error"
        ? THEME[theme].destructive
        : "#f59e0b"
  const kind = notification.data?.kind
  if (kind === "question") return <CircleHelp size={20} color={color} />
  if (kind === "permission") return <ShieldAlert size={20} color={color} />
  if (notification.type === "error") return <CircleAlert size={20} color={color} />
  return <CheckCircle2 size={20} color={color} />
}

function formatTime(timestamp: number) {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationsPage() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const theme = (colorScheme ?? "dark") as "light" | "dark"
  const notifications = useNotifications((s) => s.notifications)
  const unreadCount = useNotifications((s) => s.unreadCount)
  const markAsRead = useNotifications((s) => s.markAsRead)
  const markAllAsRead = useNotifications((s) => s.markAllAsRead)
  const removeNotification = useNotifications((s) => s.removeNotification)
  const clearAll = useNotifications((s) => s.clearAll)

  const openNotification = (notification: Notification) => {
    markAsRead(notification.id)
    const projectId = typeof notification.data?.projectId === "string" ? notification.data.projectId : undefined
    const sessionId = typeof notification.data?.sessionId === "string" ? notification.data.sessionId : undefined
    if (projectId && sessionId) {
      router.push(`/project/${projectId}/${sessionId}` as any)
    }
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-4 flex-row items-center gap-2">
        <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
          <ArrowLeft size={25} color={THEME[theme].foreground} />
        </Button>
        <Text className="text-2xl font-semibold tracking-tight flex-1">Notifications</Text>
        {notifications.length > 0 && (
          <>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="px-2" onPress={markAllAsRead}>
                <CheckCheck size={16} color={THEME[theme].mutedForeground} />
                <Text className="text-xs">Read all</Text>
              </Button>
            )}
            <Button variant="ghost" size="icon" onPress={clearAll}>
              <Trash2 size={18} color={THEME[theme].mutedForeground} />
            </Button>
          </>
        )}
      </View>

      {notifications.length === 0 ? (
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
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24, gap: 10 }}>
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => openNotification(notification)}
              className={cn(
                "flex-row gap-3 rounded-lg border border-border bg-card p-4 active:bg-accent",
                !notification.read && "border-primary/60 border-l-4 bg-primary/5"
              )}
            >
              <View
                className={cn(
                  "relative mt-0.5 h-9 w-9 items-center justify-center rounded-lg",
                  notification.read ? "bg-muted" : "bg-primary/15"
                )}
              >
                <NotificationIcon notification={notification} theme={theme} />
                {!notification.read && <View className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />}
              </View>
              <View className="flex-1 gap-1">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className={cn("text-sm text-foreground flex-1", notification.read ? "font-semibold" : "font-bold")}>
                    {notification.title}
                  </Text>
                  <Text className={cn("text-[11px]", notification.read ? "text-muted-foreground" : "text-primary font-medium")}>
                    {formatTime(notification.timestamp)}
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground leading-4">{notification.message}</Text>
              </View>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation()
                  removeNotification(notification.id)
                }}
                className="p-1"
              >
                <Trash2 size={16} color={THEME[theme].mutedForeground} />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  )
}
