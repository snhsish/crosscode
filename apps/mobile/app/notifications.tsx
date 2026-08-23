import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import ArrowLeft from "lucide-react-native/dist/esm/icons/arrow-left"
import Bell from "lucide-react-native/dist/esm/icons/bell"
import BellOff from "lucide-react-native/dist/esm/icons/bell-off"
import CheckCheck from "lucide-react-native/dist/esm/icons/check-check"
import CheckCircle2 from "lucide-react-native/dist/esm/icons/circle-check-big"
import CircleAlert from "lucide-react-native/dist/esm/icons/circle-alert"
import CircleHelp from "lucide-react-native/dist/esm/icons/circle-help"
import ShieldAlert from "lucide-react-native/dist/esm/icons/shield-alert"
import Trash2 from "lucide-react-native/dist/esm/icons/trash-2"
import { useRouter } from "expo-router"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { useNotifications, Notification } from "@/store/notifications.store"
import { cn } from "@/lib/utils"

type FilterType = "all" | "unread"

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
]

type TimeSection = {
  key: "today" | "earlier"
  title: string
  data: Notification[]
}

function getTypeAccent(notification: Notification, theme: "light" | "dark") {
  switch (notification.type) {
    case "success":
      return "#22c55e"
    case "error":
      return THEME[theme].destructive
    default:
      return "#f59e0b"
  }
}

function getIcon(kind: string | undefined, type: Notification["type"]) {
  if (kind === "question") return CircleHelp
  if (kind === "permission") return ShieldAlert
  if (type === "error") return CircleAlert
  return CheckCircle2
}

function formatTime(timestamp: number, now: number) {
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

function isToday(timestamp: number, now: number) {
  const a = new Date(timestamp)
  const b = new Date(now)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const NotificationItem = React.memo(function NotificationItem({
  notification,
  theme,
  now,
  isLast,
  onOpen,
  onRemove,
}: {
  notification: Notification
  theme: "light" | "dark"
  now: number
  isLast: boolean
  onOpen: (notification: Notification) => void
  onRemove: (id: string) => void
}) {
  const accent = getTypeAccent(notification, theme)
  const Icon = getIcon(typeof notification.data?.kind === "string" ? notification.data.kind : undefined, notification.type)

  const renderRightActions = React.useCallback(
    () => (
      <View className="flex-1 items-end justify-center pr-6">
        <Pressable
          onPress={() => onRemove(notification.id)}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-destructive/25"
        >
          <Trash2 size={19} color={THEME[theme].destructive} />
        </Pressable>
      </View>
    ),
    [notification.id, onRemove, theme]
  )

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <Pressable
        onPress={() => onOpen(notification)}
        className={cn(
          "flex-row items-center gap-3 px-6 py-4 active:bg-muted/30",
          !isLast && "border-b border-border/30"
        )}
      >
        <View
          className="h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}1A` }}
        >
          <Icon size={19} color={accent} />
          {!notification.read && (
            <View
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary"
              style={{ borderWidth: 2, borderColor: THEME[theme].background }}
            />
          )}
        </View>

        <View className="flex-1 gap-0.5">
          <Text
            numberOfLines={1}
            className={cn("text-sm text-foreground", !notification.read && "font-semibold")}
          >
            {notification.title}
          </Text>
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {notification.message}
          </Text>
          <Text className="text-[11px] text-muted-foreground/70">
            {formatTime(notification.timestamp, now)}
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  )
})

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

  const [filter, setFilter] = React.useState<FilterType>("all")
  const [now, setNow] = React.useState(Date.now())
  const [confirmClear, setConfirmClear] = React.useState(false)

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  const filtered = React.useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [notifications, filter]
  )

  const sections = React.useMemo<TimeSection[]>(() => {
    const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp)
    const today: TimeSection = { key: "today", title: "Today", data: sorted.filter((n) => isToday(n.timestamp, now)) }
    const earlier: TimeSection = { key: "earlier", title: "Earlier", data: sorted.filter((n) => !isToday(n.timestamp, now)) }
    return [today, earlier].filter((section) => section.data.length > 0)
  }, [filtered, now])

  const openNotification = React.useCallback(
    (notification: Notification) => {
      markAsRead(notification.id)
      const projectId =
        typeof notification.data?.projectId === "string" ? notification.data.projectId : undefined
      const sessionId =
        typeof notification.data?.sessionId === "string" ? notification.data.sessionId : undefined
      if (projectId && sessionId) {
        router.push(`/project/${projectId}/${sessionId}` as any)
      }
    },
    [markAsRead, router]
  )

  const handleRemove = React.useCallback(
    (id: string) => removeNotification(id),
    [removeNotification]
  )

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-4 pb-3 gap-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={22} color={THEME[theme].foreground} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-semibold tracking-tight">Notifications</Text>
            <Text className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </Text>
          </View>
          {notifications.length > 0 && (
            <>
              {unreadCount > 0 && (
                <Pressable
                  onPress={markAllAsRead}
                  className="h-9 w-9 items-center justify-center rounded-lg bg-muted/50 active:bg-muted"
                >
                  <CheckCheck size={18} color={THEME[theme].foreground} />
                </Pressable>
              )}
              <Pressable
                onPress={() => setConfirmClear(true)}
                className="h-9 w-9 items-center justify-center rounded-lg bg-muted/50 active:bg-muted"
              >
                <Trash2 size={17} color={THEME[theme].destructive} />
              </Pressable>
            </>
          )}
        </View>

        {notifications.length > 0 && (
          <View className="flex-row gap-1.5">
            {FILTER_OPTIONS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full",
                  filter === f.key ? "bg-primary" : "bg-muted/50"
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium",
                    filter === f.key ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {f.key === "unread" ? `Unread (${unreadCount})` : `All (${notifications.length})`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center">
            {filter === "unread" ? (
              <BellOff size={28} color={THEME[theme].mutedForeground} />
            ) : (
              <Bell size={28} color={THEME[theme].mutedForeground} />
            )}
          </View>
          <View className="items-center gap-1.5">
            <Text className="text-base font-semibold text-foreground">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              {filter === "unread"
                ? "Everything has been read. Nice work!"
                : "Updates about your agents will show up here"}
            </Text>
          </View>
          {filter === "unread" && (
            <Button variant="outline" size="sm" className="mt-2 rounded-full" onPress={() => setFilter("all")}>
              <Text className="text-sm font-medium">View all</Text>
            </Button>
          )}
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {sections.map((section) => (
            <View key={section.key}>
              <View className="flex-row items-center gap-2 px-6 pt-5 pb-2">
                <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </Text>
                <Text className="text-xs text-muted-foreground/70">{section.data.length}</Text>
              </View>
              {section.data.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  theme={theme}
                  now={now}
                  isLast={index === section.data.length - 1}
                  onOpen={openNotification}
                  onRemove={handleRemove}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)}>
        <DialogHeader
          icon={
            <View className="w-12 h-12 rounded-full bg-destructive/10 items-center justify-center">
              <Trash2 size={24} color={THEME[theme].destructive} />
            </View>
          }
          title="Clear all notifications"
          description={`This will permanently remove all ${notifications.length} notifications.`}
        />
        <DialogFooter
          cancelLabel="Cancel"
          confirmLabel="Clear all"
          variant="destructive"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            clearAll()
            setConfirmClear(false)
          }}
        />
      </Dialog>
    </View>
  )
}
