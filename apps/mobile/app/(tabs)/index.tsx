import * as React from "react"
import { FlatList, Image, Modal, Pressable, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { useFocusEffect, useRouter } from "expo-router"
import { useConnections } from "@/store/connection.store"
import { useProjects } from "@/store/projects.store"
import { useAllowsMultipleConnections } from "@/lib/entitlement"
import { cn, formatDirectory, getAuthHeader } from "@/lib/utils"
import { getCurrentProject } from "@/lib/projects"
import AlertTriangle from "lucide-react-native/dist/esm/icons/triangle-alert"
import ArrowUpDown from "lucide-react-native/dist/esm/icons/arrow-up-down"
import Bell from "lucide-react-native/dist/esm/icons/bell"
import Filter from "lucide-react-native/dist/esm/icons/funnel"
import Pencil from "lucide-react-native/dist/esm/icons/pencil"
import Plus from "lucide-react-native/dist/esm/icons/plus"
import Search from "lucide-react-native/dist/esm/icons/search"
import Server from "lucide-react-native/dist/esm/icons/server"
import Trash2 from "lucide-react-native/dist/esm/icons/trash-2"
import User from "lucide-react-native/dist/esm/icons/user"
import Wifi from "lucide-react-native/dist/esm/icons/wifi"
import WifiOff from "lucide-react-native/dist/esm/icons/wifi-off"
import X from "lucide-react-native/dist/esm/icons/x"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { Input } from "@/components/ui/input"

type FilterType = "all" | "active" | "inactive"
type SortType = "name" | "recent" | "status"

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
]

const SORT_OPTIONS: { key: SortType; label: string }[] = [
    { key: "recent", label: "Recent" },
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
]

const ConnectionItem = React.memo(function ConnectionItem({
  connection,
  isActive,
  project,
  allowMultiple,
  onNavigate,
  onRename,
  onDelete,
}: {
  connection: { id: string; name: string; url: string; healthy?: boolean | null }
  isActive: boolean
  project?: { directory: string }
  allowMultiple: boolean
  onNavigate: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
}) {
  const theme = useColorScheme().colorScheme ?? "light"
  const [menuVisible, setMenuVisible] = React.useState(false)
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUnreachable = connection.healthy === false
  const isSelectable = allowMultiple && !isActive

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
    if (!menuVisible && (!isUnreachable || isSelectable)) {
      onNavigate(connection.id)
    }
  }, [menuVisible, isUnreachable, isSelectable, onNavigate, connection.id])

  const handleRenamePress = React.useCallback(() => {
    setMenuVisible(false)
    onRename(connection.id)
  }, [onRename, connection.id])

  const handleDeletePress = React.useCallback(() => {
    setMenuVisible(false)
    onDelete(connection.id)
  }, [onDelete, connection.id])

  return (
    <>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={(isActive && !isUnreachable) || isSelectable ? handlePress : undefined}
        className={cn(
          "flex-row items-center gap-3 rounded-xl p-4",
          isActive
            ? "bg-muted/50 border border-border active:bg-muted/70"
            : isSelectable
              ? "bg-muted/50 active:bg-muted/70"
              : "bg-muted/30 active:bg-muted/50"
        )}
        style={isUnreachable && !isSelectable ? { opacity: 0.5 } : undefined}
      >
        <View className={cn(
          "w-10 h-10 rounded-xl items-center justify-center",
          isUnreachable && !isSelectable
            ? "bg-destructive/15"
            : isActive
              ? "bg-green-500/20"
              : isSelectable
                ? "bg-primary/10"
                : "bg-muted"
        )}>
          {isUnreachable && !isSelectable ? (
            <WifiOff size={18} color={THEME[theme].destructive} />
          ) : isActive ? (
            <Wifi size={18} color={THEME[theme].foreground} />
          ) : isSelectable ? (
            <Wifi size={18} color={THEME[theme].primary} />
          ) : (
            <WifiOff size={18} color={THEME[theme].mutedForeground} />
          )}
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-sm">{connection.name}</Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {connection.url.replace(/^https?:\/\//, "")}
          </Text>
          {project && (
            <Text className="text-xs text-muted-foreground/70 mt-0.5" numberOfLines={1}>
              {formatDirectory(project.directory)}
            </Text>
          )}
        </View>
        {isUnreachable && !isSelectable ? (
          <View className="px-2 py-0.5 rounded-full bg-destructive/10">
            <Text className="text-[10px] font-medium text-destructive">Unreachable</Text>
          </View>
        ) : isActive ? (
          <View className="px-2 py-0.5 rounded-full bg-primary/10">
            <Text className="text-[10px] font-medium text-primary">Active</Text>
          </View>
        ) : isSelectable ? (
          <View className="px-2 py-0.5 rounded-full bg-primary/10">
            <Text className="text-[10px] font-medium text-primary">Available</Text>
          </View>
        ) : null}
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={handleCloseMenu}>
        <Pressable className="flex-1 justify-end" onPress={handleCloseMenu}>
          <View className="bg-black/40 flex-1" />
          <View className="bg-card rounded-t-2xl pb-8 px-6">
            <View className="w-10 h-1 rounded-full bg-muted mx-auto my-3" />

            <View className="flex-row items-start gap-4 mb-6">
              <View className={cn("w-12 h-12 rounded-xl items-center justify-center shrink-0", isUnreachable && !isSelectable ? "bg-destructive/15" : isActive ? "bg-green-500/20" : isSelectable ? "bg-primary/10" : "bg-muted")}>
                {isUnreachable && !isSelectable ? (
                  <WifiOff size={20} color={THEME[theme].destructive} />
                ) : isActive ? (
                  <Wifi size={20} color={THEME[theme].foreground} />
                ) : isSelectable ? (
                  <Wifi size={20} color={THEME[theme].primary} />
                ) : (
                  <WifiOff size={20} color={THEME[theme].mutedForeground} />
                )}
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                  {connection.name}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {connection.url.replace(/^https?:\/\//, "")}
                </Text>
                {project && (
                  <Text className="text-xs text-muted-foreground/70" numberOfLines={1}>
                    {formatDirectory(project.directory)}
                  </Text>
                )}
                {isUnreachable && !isSelectable ? (
                  <View className="mt-1 self-start px-2 py-0.5 rounded-full bg-destructive/10">
                    <Text className="text-[10px] font-medium text-destructive">Unreachable</Text>
                  </View>
                ) : isActive ? (
                  <View className="mt-1 self-start px-2 py-0.5 rounded-full bg-primary/10">
                    <Text className="text-[10px] font-medium text-primary">Active</Text>
                  </View>
                ) : isSelectable ? (
                  <View className="mt-1 self-start px-2 py-0.5 rounded-full bg-primary/10">
                    <Text className="text-[10px] font-medium text-primary">Available</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="h-px bg-border/50 mb-4" />

            <Pressable
              onPress={handleRenamePress}
              className="flex-row items-center gap-4 py-3.5 active:bg-muted/50 rounded-xl px-2 -mx-2"
            >
              <View className="w-9 h-9 rounded-lg bg-muted/50 items-center justify-center">
                <Pencil size={18} color={THEME[theme].foreground} />
              </View>
              <Text className="text-sm font-medium text-foreground">Rename connection</Text>
            </Pressable>

            <Pressable
              onPress={handleDeletePress}
              className="flex-row items-center gap-4 py-3.5 active:bg-destructive/10 rounded-xl px-2 -mx-2"
            >
              <View className="w-9 h-9 rounded-lg bg-destructive/10 items-center justify-center">
                <Trash2 size={18} color={THEME[theme].destructive} />
              </View>
              <Text className="text-sm font-medium text-destructive">Delete connection</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  )
})

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const connections = useConnections((s) => s.connections)
  const current = useConnections((s) => s.current)
  const setCurrent = useConnections((s) => s.setCurrent)
  const setConnectionHealth = useConnections((s) => s.setConnectionHealth)
  const allowMultiple = useAllowsMultipleConnections()
  const projects = useProjects((s) => s.projects)
  const setProjectForConnection = useProjects((s) => s.setProjectForConnection)
  const removeConnection = useConnections((s) => s.removeConnection)
  const updateConnection = useConnections((s) => s.updateConnection)

  const theme = colorScheme ?? "light"
  const currentConnection = React.useMemo(() => connections.find((c) => c.id === current) ?? null, [connections, current])

  const [searchQuery, setSearchQuery] = React.useState("")
  const [filter, setFilter] = React.useState<FilterType>("all")
  const [sortBy, setSortBy] = React.useState<SortType>("recent")
  const [showFilterMenu, setShowFilterMenu] = React.useState(false)
  const [showSortMenu, setShowSortMenu] = React.useState(false)

  const lastHealthCheckRef = React.useRef(0)

  const checkHealth = React.useCallback(async () => {
    const now = Date.now()
    if (now - lastHealthCheckRef.current < 30000) return
    lastHealthCheckRef.current = now
    await Promise.all(connections.map(async (conn) => {
      if (!conn.url || !conn.token) return
      try {
        const res = await fetch(`${conn.url}/global/health`, {
          method: "GET",
          headers: {
            "Authorization": getAuthHeader(conn.token)
          }
        })
        setConnectionHealth(conn.id, res.ok)
      } catch {
        setConnectionHealth(conn.id, false)
      }
    }))
  }, [connections.length, setConnectionHealth])

  useFocusEffect(
    React.useCallback(() => {
      checkHealth()
    }, [checkHealth])
  )

  React.useEffect(() => {
    if (!currentConnection?.url || !currentConnection?.token) return

    getCurrentProject(currentConnection.url, currentConnection.token).then((project) => {
      if (project) {
        setProjectForConnection(currentConnection.id, project)
      }
    })
  }, [currentConnection?.id, currentConnection?.url, currentConnection?.token, setProjectForConnection])

  const filteredConnections = React.useMemo(() => {
    let result = [...connections]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.url.toLowerCase().includes(q)
      )
    }

    if (filter === "active") {
      result = result.filter((c) => c.id === current)
    } else if (filter === "inactive") {
      result = result.filter((c) => c.id !== current)
    }

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "recent") {
      result.sort((a, b) => b.added - a.added)
    } else if (sortBy === "status") {
      result.sort((a, b) => {
        if (a.id === current && b.id !== current) return -1
        if (a.id !== current && b.id === current) return 1
        return 0
      })
    }

    return result
  }, [connections, searchQuery, filter, sortBy, current])

  const projectByConnectionId = React.useMemo(() => {
    const map = new Map<string, { directory: string }>()
    for (const p of projects) {
      map.set(p.connectionId, p)
    }
    return map
  }, [projects])

  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<string | null>(null)
  const [renameValue, setRenameValue] = React.useState("")

  const handleRename = React.useCallback((connectionId: string) => {
    const conn = connections.find((c) => c.id === connectionId)
    if (!conn) return
    setSelectedConnectionId(connectionId)
    setRenameValue(conn.name)
    setRenameDialogOpen(true)
  }, [connections])

  const handleRenameConfirm = React.useCallback(() => {
    if (selectedConnectionId && renameValue.trim()) {
      updateConnection(selectedConnectionId, { name: renameValue.trim() })
    }
    setRenameDialogOpen(false)
    setSelectedConnectionId(null)
  }, [selectedConnectionId, renameValue, updateConnection])

  const handleDelete = React.useCallback((connectionId: string) => {
    setSelectedConnectionId(connectionId)
    setDeleteDialogOpen(true)
  }, [])

  const handleNavigate = React.useCallback((id: string) => {
    setCurrent(id)
    router.push("/sessions")
  }, [router, setCurrent])

  const handleDeleteConfirm = React.useCallback(() => {
    if (selectedConnectionId) {
      removeConnection(selectedConnectionId)
    }
    setDeleteDialogOpen(false)
    setSelectedConnectionId(null)
  }, [selectedConnectionId, removeConnection])

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-4 pb-3 gap-4">
        <View className="flex-row items-center justify-between">
          <Image
            source={theme === "dark" ? require("@/assets/branding-dark-mode.png") : require("@/assets/branding-light-mode.png")}
            className="h-6 w-6"
            resizeMode="contain"
          />
          <View className="flex-row items-center gap-1">
            <Pressable onPress={() => router.push("/notifications")} className="p-2">
              <Bell size={22} color={THEME[theme].mutedForeground} />
            </Pressable>
            <Pressable onPress={() => router.push("/user")} className="p-2">
              <User size={22} color={THEME[theme].mutedForeground} />
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-muted/50 rounded-lg px-3 h-10">
            <Search size={18} color={THEME[theme].mutedForeground} />
            <TextInput
              className="flex-1 text-sm text-foreground ml-2 placeholder:text-muted-foreground/50"
              placeholder="Search connections..."
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

      <FlatList
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        data={filteredConnections}
        keyExtractor={(c) => c.id}
        contentContainerStyle={filteredConnections.length === 0 ? undefined : { gap: 12, paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 gap-4">
            <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center">
              <Server size={28} color={THEME[theme].mutedForeground} />
            </View>
            <View className="items-center gap-1.5">
              <Text className="text-base font-semibold text-foreground">No remote connections</Text>
              <Text className="text-sm text-muted-foreground text-center">
                {searchQuery || filter !== "all"
                  ? "No connections match your filters"
                  : "Add a remote OpenCode connection to get started"}
              </Text>
            </View>
            <Button
              size="sm"
              onPress={() => router.push("/new-connection")}
              className="mt-2 rounded-full"
            >
              <Plus size={16} color={THEME[theme].primaryForeground} />
              <Text className="text-sm font-medium text-primary-foreground">New Connection</Text>
            </Button>
          </View>
        }
        renderItem={({ item: c }) => {
          const isActive = c.id === current
          const project = projectByConnectionId.get(c.id)
          return (
            <ConnectionItem
              connection={c}
              isActive={isActive}
              project={project}
              allowMultiple={allowMultiple}
              onNavigate={handleNavigate}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          )
        }}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
      />

      {filteredConnections.length > 0 && (
        <View className="absolute" style={{ bottom: insets.bottom + 24, right: 24 }}>
          <Pressable
            onPress={() => router.push("/new-connection")}
            className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg active:opacity-80"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Plus size={24} color={THEME[theme].primaryForeground} />
          </Pressable>
        </View>
      )}

      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogHeader
          title="Rename connection"
          description="Enter a new name for this connection"
        />
        <Input
          value={renameValue}
          onChangeText={setRenameValue}
          placeholder="Connection name"
          className="mb-4"
          autoFocus
        />
        <DialogFooter
          cancelLabel="Cancel"
          confirmLabel="Rename"
          onCancel={() => setRenameDialogOpen(false)}
          onConfirm={handleRenameConfirm}
        />
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogHeader
          icon={
            <View className="w-12 h-12 rounded-full bg-destructive/10 items-center justify-center">
              <AlertTriangle size={24} color={THEME[theme].destructive} />
            </View>
          }
          title="Delete connection"
          description="This action cannot be undone. The connection will be permanently removed."
        />
        <DialogFooter
          cancelLabel="Cancel"
          confirmLabel="Delete"
          variant="destructive"
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </Dialog>
    </View>
  )
}
