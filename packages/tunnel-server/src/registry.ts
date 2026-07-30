import type { WebSocket } from "ws"

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
}

const registry = new Map<string, ClientEntry>()

export function register(projectId: string, userId: string, ws: WebSocket): ClientEntry {
  const existing = registry.get(projectId)
  if (existing) {
    existing.ws.close(4001, "Replaced by new connection")
  }

  const entry: ClientEntry = {
    ws,
    userId,
    connectedAt: new Date(),
    pendingRequests: new Map(),
  }
  registry.set(projectId, entry)
  return entry
}

export function deregister(projectId: string): void {
  const entry = registry.get(projectId)
  if (!entry) return

  for (const [reqId, pending] of entry.pendingRequests) {
    pending.onError("Tunnel client disconnected")
  }
  entry.pendingRequests.clear()
  registry.delete(projectId)
}

export function get(projectId: string): ClientEntry | null {
  return registry.get(projectId) ?? null
}

export function addPendingRequest(projectId: string, reqId: string, pending: PendingRequest): void {
  const entry = registry.get(projectId)
  if (!entry) throw new Error("Client not found")
  entry.pendingRequests.set(reqId, pending)
}

export function removePendingRequest(projectId: string, reqId: string): PendingRequest | null {
  const entry = registry.get(projectId)
  if (!entry) return null
  const pending = entry.pendingRequests.get(reqId) ?? null
  if (pending) entry.pendingRequests.delete(reqId)
  return pending
}

export function getAllPendingRequests(projectId: string): Map<string, PendingRequest> {
  const entry = registry.get(projectId)
  if (!entry) return new Map()
  return entry.pendingRequests
}
