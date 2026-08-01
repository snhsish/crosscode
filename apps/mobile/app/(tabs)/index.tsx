import * as React from "react"
import { Image, Modal, Pressable, ScrollView, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { useRouter } from "expo-router"
import { useConnections } from "@/store/connection.store"
import { useProjects } from "@/store/projects.store"
import { cn, formatDirectory } from "@/lib/utils"
import { getCurrentProject } from "@/lib/projects"
import { AlertTriangle, ArrowUpDown, Bell, Filter, Pencil, Plus, Search, Server, Trash2, User, Wifi, WifiOff, X } from "lucide-react-native"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import { Input } from "@/components/ui/input"

type FilterType = "all" | "active" | "inactive"
type SortType = "name" | "recent" | "status"

function ConnectionItem({
  connection,
  isActive,
  project,
  onPress,
  onRename,
  onDelete,
}: {
  connection: { id: string; name: string; url: string; healthy?: boolean | null }
  isActive: boolean
  project?: { directory: string }
  onPress: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const theme = useColorScheme().colorScheme ?? "light"
  const [menuVisible, setMenuVisible] = React.useState(false)
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUnreachable = connection.healthy === false

  const handlePressIn = () => {
    pressTimer.current = setTimeout(() => {
      setMenuVisible(true)
    }, 500)
  }

  const handlePressOut = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const handlePress = () => {
    if (!menuVisible && !isUnreachable) {
      onPress()
    }
  }

  const Wrapper = Pressable

  return (
    <>
      <Wrapper
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={isActive && !isUnreachable ? handlePress : undefined}
        className={cn(
          "flex-row items-center gap-3 rounded-xl p-4",
          isActive ? "bg-muted/50 border border-border active:bg-muted/70" : "bg-muted/30 active:bg-muted/50"
        )}
        style={isUnreachable ? { opacity: 0.5 } : undefined}
      >
        <View className={cn(
          "w-10 h-10 rounded-xl items-center justify-center",
          isUnreachable ? "bg-destructive/15" : isActive ? "bg-green-500/20" : "bg-muted"
        )}>
          {isUnreachable ? (
            <WifiOff size={18} color={THEME[theme].destructive} />
          ) : isActive ? (
            <Wifi size={18} color={THEME[theme].foreground} />
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
        {isUnreachable ? (
          <View className="px-2 py-0.5 rounded-full bg-destructive/10">
            <Text className="text-[10px] font-medium text-destructive">Unreachable</Text>
          </View>
        ) : isActive ? (
          <View className="px-2 py-0.5 rounded-full bg-primary/10">
            <Text className="text-[10px] font-medium text-primary">Active</Text>
          </View>
        ) : null}
      </Wrapper>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable className="flex-1 justify-end" onPress={() => setMenuVisible(false)}>
          <View className="bg-black/40 flex-1" />
          <View className="bg-card rounded-t-2xl pb-8 px-6">
            <View className="w-10 h-1 rounded-full bg-muted mx-auto my-3" />

            <View className="flex-row items-start gap-4 mb-6">
              <View className={cn("w-12 h-12 rounded-xl items-center justify-center shrink-0", isUnreachable ? "bg-destructive/15" : isActive ? "bg-green-500/20" : "bg-muted")}>
                {isUnreachable ? (
                  <WifiOff size={20} color={THEME[theme].destructive} />
                ) : isActive ? (
                  <Wifi size={20} color={THEME[theme].foreground} />
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
                {isUnreachable ? (
                  <View className="mt-1 self-start px-2 py-0.5 rounded-full bg-destructive/10">
                    <Text className="text-[10px] font-medium text-destructive">Unreachable</Text>
                  </View>
                ) : isActive ? (
                  <View className="mt-1 self-start px-2 py-0.5 rounded-full bg-primary/10">
                    <Text className="text-[10px] font-medium text-primary">Active</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="h-px bg-border/50 mb-4" />

            <Pressable
              onPress={() => { setMenuVisible(false); onRename() }}
              className="flex-row items-center gap-4 py-3.5 active:bg-muted/50 rounded-xl px-2 -mx-2"
            >
              <View className="w-9 h-9 rounded-lg bg-muted/50 items-center justify-center">
                <Pencil size={18} color={THEME[theme].foreground} />
              </View>
              <Text className="text-sm font-medium text-foreground">Rename connection</Text>
            </Pressable>

            <Pressable
              onPress={() => { setMenuVisible(false); onDelete() }}
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
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const { connections, current, setConnectionHealth } = useConnections()
  const { projects, setProjectForConnection } = useProjects()

  const theme = colorScheme ?? "light"
  const currentConnection = React.useMemo(() => connections.find((c) => c.id === current) ?? null, [connections, current])

  const [searchQuery, setSearchQuery] = React.useState("")
  const [filter, setFilter] = React.useState<FilterType>("all")
  const [sortBy, setSortBy] = React.useState<SortType>("recent")
  const [showFilterMenu, setShowFilterMenu] = React.useState(false)
  const [showSortMenu, setShowSortMenu] = React.useState(false)

  React.useEffect(() => {
    const checkHealth = async () => {
      for (const conn of connections) {
        if (!conn.url || !conn.token) continue
        try {
          const res = await fetch(`${conn.url}/global/health`, {
            method: "GET",
            headers: {
              "Authorization": `Basic ${btoa(`opencode:${conn.token}`)}`
            }
          })
          setConnectionHealth(conn.id, res.ok)
        } catch {
          setConnectionHealth(conn.id, false)
        }
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [connections])

  React.useEffect(() => {
    if (!currentConnection?.url || !currentConnection?.token) return

    getCurrentProject(currentConnection.url, currentConnection.token).then((project) => {
      if (project) {
        setProjectForConnection(currentConnection.id, project)
      }
    })
  }, [currentConnection?.id])

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

  const { removeConnection, updateConnection } = useConnections()

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
                {(["all", "active", "inactive"] as FilterType[]).map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => { setFilter(f); setShowFilterMenu(false) }}
                    className={cn(
                      "px-3 py-1.5 rounded-full",
                      filter === f ? "bg-primary" : "bg-muted/50"
                    )}
                  >
                    <Text className={cn(
                      "text-xs font-medium capitalize",
                      filter === f ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {f}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {showSortMenu && (
              <View className="flex-row gap-1.5 flex-1">
                {([
                  { key: "recent", label: "Recent" },
                  { key: "name", label: "Name" },
                  { key: "status", label: "Status" },
                ] as { key: SortType; label: string }[]).map((s) => (
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

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {filteredConnections.length === 0 ? (
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
        ) : (
          <View className="gap-3 pb-8">
            {filteredConnections.map((c) => {
              const isActive = c.id === current
              const project = projects.find((p) => p.connectionId === c.id)
              return (
                <ConnectionItem
                  key={c.id}
                  connection={c}
                  isActive={isActive}
                  project={project}
                  onPress={() => router.push("/sessions")}
                  onRename={() => handleRename(c.id)}
                  onDelete={() => handleDelete(c.id)}
                />
              )
            })}
          </View>
        )}
      </ScrollView>

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
