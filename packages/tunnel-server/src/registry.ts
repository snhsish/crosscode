import type { WebSocket } from "ws"
import { logger } from "./logger.js"

export interface PendingRequest {
  onHead: (status: number, headers: Record<string, string>) => void
  onChunk: (data: Buffer) => void
  onEnd: () => void
  onError: (message: string) => void
}

export interface ClientEntry {
  ws: WebSocket
  userId: string
  connectedAt: Date
  pendingRequests: Map<string, PendingRequest>
  requestCount: number
  completedRequests: number
  failedRequests: number
  requestBytes: number
  responseBytes: number
  totalLatencyMs: number
}

const registry = new Map<string, ClientEntry>()
const lifetimeStats = {
  totalRequests: 0,
  completedRequests: 0,
  failedRequests: 0,
  requestBytes: 0,
  responseBytes: 0,
  totalLatencyMs: 0,
}

export function register(projectId: string, userId: string, ws: WebSocket): ClientEntry {
  const existing = registry.get(projectId)
  if (existing) {
    logger.warn("Replacing existing tunnel client connection", { projectId, existingUserId: existing.userId, pendingRequests: existing.pendingRequests.size })
    existing.ws.close(4001, "Replaced by new connection")
  }

  const entry: ClientEntry = {
    ws,
    userId,
    connectedAt: new Date(),
    pendingRequests: new Map(),
    requestCount: 0,
    completedRequests: 0,
    failedRequests: 0,
    requestBytes: 0,
    responseBytes: 0,
    totalLatencyMs: 0,
  }
  registry.set(projectId, entry)
  logger.info("Tunnel client registered", { projectId, userId, totalClients: registry.size })
  return entry
}

export function deregister(projectId: string): void {
  const entry = registry.get(projectId)
  if (!entry) {
    logger.warn("Attempted to deregister unknown project", { projectId })
    return
  }

  const pendingCount = entry.pendingRequests.size
  for (const [reqId, pending] of entry.pendingRequests) {
    pending.onError("Tunnel client disconnected")
  }
  entry.pendingRequests.clear()
  registry.delete(projectId)
  logger.info("Tunnel client deregistered", { projectId, userId: entry.userId, pendingRequestsFailed: pendingCount, totalClients: registry.size })
}

export function get(projectId: string): ClientEntry | null {
  return registry.get(projectId) ?? null
}

export function addPendingRequest(projectId: string, reqId: string, pending: PendingRequest): void {
  const entry = registry.get(projectId)
  if (!entry) {
    logger.error("Cannot add pending request: client not found", { projectId, reqId })
    throw new Error("Client not found")
  }
  entry.pendingRequests.set(reqId, pending)
  logger.debug("Pending request added", { projectId, reqId, totalPending: entry.pendingRequests.size })
}

export function removePendingRequest(projectId: string, reqId: string): PendingRequest | null {
  const entry = registry.get(projectId)
  if (!entry) {
    logger.warn("Cannot remove pending request: client not found", { projectId, reqId })
    return null
  }
  const pending = entry.pendingRequests.get(reqId) ?? null
  if (pending) entry.pendingRequests.delete(reqId)
  logger.debug("Pending request removed", { projectId, reqId, found: !!pending, remainingPending: entry.pendingRequests.size })
  return pending
}

export function getAllPendingRequests(projectId: string): Map<string, PendingRequest> {
  const entry = registry.get(projectId)
  if (!entry) return new Map()
  return entry.pendingRequests
}

export function countByUserId(userId: string): number {
  let count = 0
  for (const entry of registry.values()) {
    if (entry.userId === userId) count++
  }
  return count
}

export function recordRequestStart(projectId: string): void {
  const entry = registry.get(projectId)
  if (entry) entry.requestCount++
  lifetimeStats.totalRequests++
}

export function recordRequestBytes(projectId: string, bytes: number): void {
  const entry = registry.get(projectId)
  if (entry) entry.requestBytes += bytes
  lifetimeStats.requestBytes += bytes
}

export function recordResponseBytes(projectId: string, bytes: number): void {
  const entry = registry.get(projectId)
  if (entry) entry.responseBytes += bytes
  lifetimeStats.responseBytes += bytes
}

export function recordRequestEnd(projectId: string, durationMs: number, failed: boolean): void {
  const entry = registry.get(projectId)
  if (failed) {
    lifetimeStats.failedRequests++
  } else {
    lifetimeStats.completedRequests++
  }
  lifetimeStats.totalLatencyMs += durationMs
  if (!entry) return
  if (failed) entry.failedRequests++
  else entry.completedRequests++
  entry.totalLatencyMs += durationMs
}

export function getRegistryStats(): {
  totalClients: number
  totalPendingRequests: number
  totalRequests: number
  completedRequests: number
  failedRequests: number
  requestBytes: number
  responseBytes: number
  totalLatencyMs: number
  clients: Array<{
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
  }>
} {
  const clients: Array<{
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
  }> = []
  let totalPendingRequests = 0
  for (const [projectId, entry] of registry) {
    clients.push({
      projectId,
      userId: entry.userId,
      pendingRequests: entry.pendingRequests.size,
      connectedAt: entry.connectedAt.toISOString(),
      requestCount: entry.requestCount,
      completedRequests: entry.completedRequests,
      failedRequests: entry.failedRequests,
      requestBytes: entry.requestBytes,
      responseBytes: entry.responseBytes,
      totalLatencyMs: entry.totalLatencyMs,
    })
    totalPendingRequests += entry.pendingRequests.size
  }
  return {
    totalClients: registry.size,
    totalPendingRequests,
    ...lifetimeStats,
    clients,
  }
}
