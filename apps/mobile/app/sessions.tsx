import * as React from "react"
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useColorScheme } from "nativewind"

import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { useConnections } from "@/store/connection.store"
import { useProjects } from "@/store/projects.store"
import { useSessions, Session } from "@/store/sessions.store"
import { getSessionsByProjectDir, deleteSession, createSession } from "@/lib/sessions"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowLeft, ArrowUpDown, Filter, MessageCircle, Plus, Search, Trash2, X } from "lucide-react-native"

type FilterType = "all" | "active" | "completed"
type SortType = "recent" | "oldest" | "name"

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
]

const SORT_OPTIONS: { key: SortType; label: string }[] = [
    { key: "recent", label: "Recent" },
    { key: "oldest", label: "Oldest" },
    { key: "name", label: "Name" },
]

function formatTime(ts: number, now: number) {
  const diff = now - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

const SessionItem = React.memo(function SessionItem({
  session,
  isLast,
  onNavigate,
  onDelete,
  now,
}: {
  session: Session
  isLast: boolean
  onNavigate: (id: string) => void
  onDelete: (id: string) => void
  now: number
}) {
  const theme = useColorScheme().colorScheme ?? "light"
  const [menuVisible, setMenuVisible] = React.useState(false)
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current)
    }
  }, [])

  const handleCloseMenu = React.useCallback(() => setMenuVisible(false), [])

  const handlePressIn = React.useCallback(() => {
    pressTimer.current = setTimeout(() => {
      setMenuVisible(true)
    }, 500)
  }, [])

  const handlePressOut = React.useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }, [])

  const handlePress = React.useCallback(() => {
    if (!menuVisible) {
      onNavigate(session.id)
    }
  }, [menuVisible, onNavigate, session.id])

  const handleDeletePress = React.useCallback(() => {
    setMenuVisible(false)
    onDelete(session.id)
  }, [onDelete, session.id])

  return (
    <>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        className={cn(
          "flex-row items-center px-6 py-4 active:bg-muted/30",
          !isLast && "border-b border-border/30"
        )}
      >
        <View className="flex-1 gap-0.5">
          <Text className="font-medium text-sm" numberOfLines={1}>
            {session.title || "Untitled session"}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {formatTime(session.time.updated, now)}
            {session.agent && ` · ${session.agent}`}
          </Text>
        </View>
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={handleCloseMenu}>
        <Pressable className="flex-1 justify-end" onPress={handleCloseMenu}>
          <View className="bg-black/40 flex-1" />
          <View className="bg-card rounded-t-2xl pb-8 px-6">
            <View className="w-10 h-1 rounded-full bg-muted mx-auto my-3" />

            <View className="flex-row items-start gap-4 mb-6">
              <View className="w-12 h-12 rounded-xl bg-muted items-center justify-center shrink-0">
                <MessageCircle size={20} color={THEME[theme].foreground} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                  {session.title || "Untitled session"}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatTime(session.time.updated, now)}
                  {session.agent && ` · ${session.agent}`}
                </Text>
              </View>
            </View>

            <View className="h-px bg-border/50 mb-4" />

            <Pressable
              onPress={handleDeletePress}
              className="flex-row items-center gap-4 py-3.5 active:bg-destructive/10 rounded-xl px-2 -mx-2"
            >
              <View className="w-9 h-9 rounded-lg bg-destructive/10 items-center justify-center">
                <Trash2 size={18} color={THEME[theme].destructive} />
              </View>
              <Text className="text-sm font-medium text-destructive">Delete session</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  )
})

export default function SessionsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const connections = useConnections((s) => s.connections)
  const current = useConnections((s) => s.current)
  const projects = useProjects((s) => s.projects)
  const sessions = useSessions((s) => s.sessions)
  const upsertSessions = useSessions((s) => s.upsertSessions)

  const theme = colorScheme ?? "light"

  const connection = React.useMemo(() => connections.find((c) => c.id === current) ?? null, [connections, current])
  const project = React.useMemo(() => projects.find((p) => p.connectionId === current) ?? null, [projects, current])

  const [loading, setLoading] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filter, setFilter] = React.useState<FilterType>("all")
  const [sortBy, setSortBy] = React.useState<SortType>("recent")
  const [showFilterMenu, setShowFilterMenu] = React.useState(false)
  const [showSortMenu, setShowSortMenu] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null)
  const [creatingSession, setCreatingSession] = React.useState(false)
  const [now, setNow] = React.useState(Date.now())
  const removeSession = useSessions((s) => s.removeSession)

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  const handleCreateSession = React.useCallback(async () => {
    if (!connection?.url || !connection?.token || !project?.directory || creatingSession) return
    setCreatingSession(true)
    const newSession = await createSession(connection.url, connection.token, project.directory)
    if (newSession) {
      upsertSessions([newSession])
      router.push(`/project/${project.id}/${newSession.id}`)
    }
    setCreatingSession(false)
  }, [connection, project, creatingSession, upsertSessions, router])

  const fetchSessions = React.useCallback(async () => {
    if (!connection?.url || !connection?.token || !project) return
    setLoading(true)
    const data = await getSessionsByProjectDir(connection.url, connection.token, project.directory)
    if (data) {
      upsertSessions(data)
    }
    setLoading(false)
    setRefreshing(false)
  }, [connection?.url, connection?.token, project?.directory, upsertSessions])

  React.useEffect(() => {
    if (connection && project) {
      fetchSessions()
    }
  }, [connection?.id, project?.id, fetchSessions])

  const filteredSessions = React.useMemo(() => {
    let result = sessions.filter((s) => s.directory === project?.directory)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) => s.title?.toLowerCase().includes(q) || s.agent?.toLowerCase().includes(q)
      )
    }

    if (filter === "active") {
      result = result.filter((s) => !s.time.compacting)
    } else if (filter === "completed") {
      result = result.filter((s) => s.time.compacting)
    }

    if (sortBy === "recent") {
      result.sort((a, b) => b.time.updated - a.time.updated)
    } else if (sortBy === "oldest") {
      result.sort((a, b) => a.time.updated - b.time.updated)
    } else if (sortBy === "name") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }

    return result
  }, [sessions, project, searchQuery, filter, sortBy])

  const handleDelete = React.useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId)
    setDeleteDialogOpen(true)
  }, [])

  const handleNavigate = React.useCallback((sessionId: string) => {
    router.push(`/project/${project?.id}/${sessionId}`)
  }, [router, project?.id])

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!selectedSessionId || !connection?.url || !connection?.token) return
    const success = await deleteSession(connection.url, connection.token, selectedSessionId)
    if (success) {
      removeSession(selectedSessionId)
    }
    setDeleteDialogOpen(false)
    setSelectedSessionId(null)
  }, [selectedSessionId, connection, removeSession])

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-4 pb-3 gap-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.push("/")} className="p-2 -ml-2">
            <ArrowLeft size={22} color={THEME[theme].foreground} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-semibold tracking-tight">Sessions</Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {project?.name ?? project?.directory ?? "No project"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-muted/50 rounded-lg px-3 h-10">
            <Search size={18} color={THEME[theme].mutedForeground} />
            <TextInput
              className="flex-1 text-sm text-foreground ml-2 placeholder:text-muted-foreground/50"
              placeholder="Search sessions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={THEME[theme].mutedForeground}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={16} color={THEME[theme].mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false) }}
            className={cn(
              "h-10 w-10 rounded-lg items-center justify-center",
              showFilterMenu ? "bg-primary/10" : "bg-muted/50"
            )}
          >
            <Filter size={18} color={showFilterMenu ? THEME[theme].primary : THEME[theme].mutedForeground} />
          </Pressable>
          <Pressable
            onPress={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false) }}
            className={cn(
              "h-10 w-10 rounded-lg items-center justify-center",
              showSortMenu ? "bg-primary/10" : "bg-muted/50"
            )}
          >
            <ArrowUpDown size={18} color={showSortMenu ? THEME[theme].primary : THEME[theme].mutedForeground} />
          </Pressable>
        </View>

        {(showFilterMenu || showSortMenu) && (
          <View className="flex-row gap-2">
            {showFilterMenu && (
              <View className="flex-row gap-1.5 flex-1">
                {FILTER_OPTIONS.map((f) => (
                  <Pressable
                    key={f.key}
                    onPress={() => { setFilter(f.key); setShowFilterMenu(false) }}
                    className={cn(
                      "px-3 py-1.5 rounded-full",
                      filter === f.key ? "bg-primary" : "bg-muted/50"
                    )}
                  >
                    <Text className={cn(
                      "text-xs font-medium capitalize",
                      filter === f.key ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {showSortMenu && (
              <View className="flex-row gap-1.5 flex-1">
                {SORT_OPTIONS.map((s) => (
                  <Pressable
                    key={s.key}
                    onPress={() => { setSortBy(s.key); setShowSortMenu(false) }}
                    className={cn(
                      "px-3 py-1.5 rounded-full",
                      sortBy === s.key ? "bg-primary" : "bg-muted/50"
                    )}
                  >
                    <Text className={cn(
                      "text-xs font-medium",
                      sortBy === s.key ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {loading && filteredSessions.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={THEME[theme].mutedForeground} />
          <Text className="text-xs text-muted-foreground mt-3">Loading sessions...</Text>
        </View>
      ) : filteredSessions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center">
            <MessageCircle size={28} color={THEME[theme].mutedForeground} />
          </View>
          <View className="items-center gap-1.5">
            <Text className="text-base font-semibold text-foreground">No sessions yet</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Start a new session to begin working with your project
            </Text>
          </View>
          <Button size="sm" onPress={handleCreateSession} disabled={creatingSession} className="mt-2 rounded-full">
            {creatingSession ? (
              <ActivityIndicator size="small" color={THEME[theme].primaryForeground} />
            ) : (
              <>
                <Plus size={16} color={THEME[theme].primaryForeground} />
                <Text className="text-sm font-medium text-primary-foreground">New Session</Text>
              </>
            )}
          </Button>
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={filteredSessions}
          keyExtractor={(session) => session.id}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchSessions() }}
              tintColor={THEME[theme].primary}
            />
          }
          renderItem={({ item: session, index }) => (
            <SessionItem
              session={session}
              isLast={index === filteredSessions.length - 1}
              onNavigate={handleNavigate}
              onDelete={handleDelete}
              now={now}
            />
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogHeader
          icon={
            <View className="w-12 h-12 rounded-full bg-destructive/10 items-center justify-center">
              <AlertTriangle size={24} color={THEME[theme].destructive} />
            </View>
          }
          title="Delete session"
          description="This action cannot be undone. The session will be permanently removed."
        />
        <DialogFooter
          cancelLabel="Cancel"
          confirmLabel="Delete"
          variant="destructive"
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </Dialog>

      {filteredSessions.length > 0 && (
        <View className="absolute" style={{ bottom: insets.bottom + 24, right: 24 }}>
          <Pressable
            onPress={handleCreateSession}
            disabled={creatingSession}
            className={cn(
              "w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg",
              creatingSession ? "opacity-70" : "active:opacity-80"
            )}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {creatingSession ? (
              <ActivityIndicator size="small" color={THEME[theme].primaryForeground} />
            ) : (
              <Plus size={24} color={THEME[theme].primaryForeground} />
            )}
          </Pressable>
        </View>
      )}
    </View>
  )
}
