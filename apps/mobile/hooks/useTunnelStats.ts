import { useState, useEffect, useCallback } from "react"

const TUNNEL_SERVER_URL = "https://connect.crosscode.site"

export interface TunnelClient {
  projectId: string
  userId: string
  pendingRequests: number
  connectedAt: string
  requestCount: number
  completedRequests: number
  failedRequests: number
  requestBytes: number
  responseBytes: number
  totalLatencyMs: number
}

export interface TunnelStats {
  status: string
  version: string
  totalClients: number
  totalPendingRequests: number
  totalRequests: number
  completedRequests: number
  failedRequests: number
  requestBytes: number
  responseBytes: number
  totalLatencyMs: number
  clients: TunnelClient[]
}

export function useTunnelStats() {
  const [stats, setStats] = useState<TunnelStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${TUNNEL_SERVER_URL}/health`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}
