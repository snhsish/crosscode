import { View, Pressable, ActivityIndicator } from "react-native"
import { Text } from "@/components/ui/text"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RefreshCw, Server, Wifi, Clock } from "lucide-react-native"
import { useTunnelStats } from "@/hooks/useTunnelStats"
import { useColorScheme } from "nativewind"
import { THEME } from "@/lib/theme"
import React from "react"

function formatDuration(connectedAt: string): string {
  const start = new Date(connectedAt).getTime()
  const now = Date.now()
  const diffMs = now - start

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function TunnelUsageCard() {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const { stats, loading, error, refresh } = useTunnelStats()
  const [refreshing, setRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <Card>
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <View>
            <CardTitle>Tunnel Usage</CardTitle>
            <CardDescription>Active tunnel connections</CardDescription>
          </View>
          <Pressable
            onPress={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 rounded-lg active:bg-muted/50"
          >
            {refreshing || loading ? (
              <ActivityIndicator size="small" color={THEME[theme].mutedForeground} />
            ) : (
              <RefreshCw size={18} color={THEME[theme].mutedForeground} />
            )}
          </Pressable>
        </View>
      </CardHeader>
      <CardContent>
        {error ? (
          <View className="items-center py-4">
            <Text className="text-sm text-destructive text-center">{error}</Text>
            <Text className="text-xs text-muted-foreground mt-2">
              Make sure you're connected to a tunnel server
            </Text>
          </View>
        ) : loading && !stats ? (
          <View className="items-center py-4">
            <ActivityIndicator size="large" color={THEME[theme].primary} />
            <Text className="text-sm text-muted-foreground mt-2">Loading stats...</Text>
          </View>
        ) : stats ? (
          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-muted/30 rounded-xl p-3 items-center">
                <Server size={20} color={THEME[theme].primary} />
                <Text className="text-2xl font-bold mt-1">{stats.totalClients}</Text>
                <Text className="text-xs text-muted-foreground">Active Tunnels</Text>
              </View>
              <View className="flex-1 bg-muted/30 rounded-xl p-3 items-center">
                <Wifi size={20} color={THEME[theme].primary} />
                <Text className="text-2xl font-bold mt-1">{stats.totalPendingRequests}</Text>
                <Text className="text-xs text-muted-foreground">Pending Requests</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-muted/30 rounded-xl p-3">
                <Text className="text-xs text-muted-foreground">Bandwidth</Text>
                <Text className="text-base font-bold mt-1">
                  {formatBytes((stats.requestBytes ?? 0) + (stats.responseBytes ?? 0))}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatBytes(stats.requestBytes ?? 0)} up / {formatBytes(stats.responseBytes ?? 0)} down
                </Text>
              </View>
              <View className="flex-1 bg-muted/30 rounded-xl p-3">
                <Text className="text-xs text-muted-foreground">Requests</Text>
                <Text className="text-base font-bold mt-1">{stats.totalRequests ?? 0}</Text>
                <Text className="text-xs text-muted-foreground">
                  {stats.completedRequests ?? 0} completed / {stats.failedRequests ?? 0} failed
                </Text>
              </View>
            </View>

            <View className="bg-muted/30 rounded-xl p-3">
              <Text className="text-xs text-muted-foreground">Average response time</Text>
              <Text className="text-base font-bold mt-1">
                {(stats.completedRequests ?? 0) > 0
                  ? `${Math.round((stats.totalLatencyMs ?? 0) / stats.completedRequests)} ms`
                  : "No completed requests"}
              </Text>
            </View>

            {stats.clients.length > 0 && (
              <View className="gap-2">
                <Text className="text-sm font-medium">Connected Clients</Text>
                {stats.clients.map((client, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between bg-muted/20 rounded-lg p-3"
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-green-500" />
                      <View>
                        <Text className="text-sm font-medium">{client.projectId}</Text>
                        <Text className="text-xs text-muted-foreground">
                          {client.requestCount ?? 0} requests · {formatBytes((client.requestBytes ?? 0) + (client.responseBytes ?? 0))}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Clock size={12} color={THEME[theme].mutedForeground} />
                      <Text className="text-xs text-muted-foreground">
                        {formatDuration(client.connectedAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {stats.clients.length === 0 && (
              <View className="items-center py-4">
                <Text className="text-sm text-muted-foreground">No active tunnels</Text>
              </View>
            )}
          </View>
        ) : null}
      </CardContent>
    </Card>
  )
}
