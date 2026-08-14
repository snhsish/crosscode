import { View, Pressable, Alert } from "react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2, FileText, Zap, DollarSign } from "lucide-react-native"
import { useOpencodeStats } from "@/store/opencode-stats.store"
import { useColorScheme } from "nativewind"
import { THEME } from "@/lib/theme"
import React from "react"

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
  return tokens.toString()
}

function formatCost(cost: number): string {
  if (cost >= 1) return `$${cost.toFixed(2)}`
  return `${(cost * 100).toFixed(1)}¢`
}

export function OpencodeStatsCard() {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const projects = useOpencodeStats((s) => s.projects)
  const resetProjectStats = useOpencodeStats((s) => s.resetProjectStats)
  const resetAllStats = useOpencodeStats((s) => s.resetAllStats)

  const allStats = React.useMemo(
    () => Object.values(projects).sort((a, b) => (b.lastResponseAt ?? "").localeCompare(a.lastResponseAt ?? "")),
    [projects]
  )

  const totalResponses = allStats.reduce((sum, p) => sum + p.responseCount, 0)
  const totalInputTokens = allStats.reduce((sum, p) => sum + p.totalInputTokens, 0)
  const totalOutputTokens = allStats.reduce((sum, p) => sum + p.totalOutputTokens, 0)
  const totalCost = allStats.reduce((sum, p) => sum + p.totalCost, 0)

  const handleResetAll = () => {
    Alert.alert(
      "Reset All Stats",
      "This will clear all project statistics. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: resetAllStats,
        },
      ]
    )
  }

  const handleResetProject = (projectId: string, projectName: string) => {
    Alert.alert(
      "Reset Project Stats",
      `Clear statistics for "${projectName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => resetProjectStats(projectId),
        },
      ]
    )
  }

  return (
    <Card>
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <View>
            <CardTitle>Opencode Usage</CardTitle>
            <CardDescription>Per-project token and cost tracking</CardDescription>
          </View>
          {allStats.length > 0 && (
            <Button variant="ghost" size="sm" onPress={handleResetAll}>
              <Trash2 size={16} color={THEME[theme].destructive} />
            </Button>
          )}
        </View>
      </CardHeader>
      <CardContent>
        {allStats.length === 0 ? (
          <View className="items-center py-6">
            <FileText size={32} color={THEME[theme].mutedForeground} />
            <Text className="text-sm text-muted-foreground mt-2">No usage data yet</Text>
            <Text className="text-xs text-muted-foreground mt-1">
              Stats will appear as you use opencode
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-muted/30 rounded-xl p-3 items-center">
                <Zap size={18} color={THEME[theme].primary} />
                <Text className="text-xl font-bold mt-1">{formatTokens(totalInputTokens + totalOutputTokens)}</Text>
                <Text className="text-xs text-muted-foreground">Total Tokens</Text>
              </View>
              <View className="flex-1 bg-muted/30 rounded-xl p-3 items-center">
                <DollarSign size={18} color={THEME[theme].primary} />
                <Text className="text-xl font-bold mt-1">{formatCost(totalCost)}</Text>
                <Text className="text-xs text-muted-foreground">Total Cost</Text>
              </View>
              <View className="flex-1 bg-muted/30 rounded-xl p-3 items-center">
                <FileText size={18} color={THEME[theme].primary} />
                <Text className="text-xl font-bold mt-1">{totalResponses}</Text>
                <Text className="text-xs text-muted-foreground">Responses</Text>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium">By Project</Text>
              {allStats.map((project) => (
                <View
                  key={project.projectId}
                  className="bg-muted/20 rounded-lg p-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium flex-1" numberOfLines={1}>
                      {project.projectName}
                    </Text>
                    <Pressable
                      onPress={() => handleResetProject(project.projectId, project.projectName)}
                      className="p-1"
                    >
                      <Trash2 size={14} color={THEME[theme].destructive} />
                    </Pressable>
                  </View>
                  <View className="flex-row gap-4">
                    <View>
                      <Text className="text-xs text-muted-foreground">Responses</Text>
                      <Text className="text-sm font-medium">{project.responseCount}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted-foreground">Input</Text>
                      <Text className="text-sm font-medium">{formatTokens(project.totalInputTokens)}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted-foreground">Output</Text>
                      <Text className="text-sm font-medium">{formatTokens(project.totalOutputTokens)}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted-foreground">Cost</Text>
                      <Text className="text-sm font-medium">{formatCost(project.totalCost)}</Text>
                    </View>
                  </View>
                  {project.lastResponseAt && (
                    <Text className="text-xs text-muted-foreground mt-2">
                      Last: {new Date(project.lastResponseAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  )
}
