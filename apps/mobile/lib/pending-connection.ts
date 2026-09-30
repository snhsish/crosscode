type PendingConnection = {
  url: string
  token: string
}

let pending: PendingConnection | null = null

export function setPendingConnection(conn: PendingConnection): void {
  pending = conn
}

export function consumePendingConnection(): PendingConnection | null {
  const current = pending
  pending = null
  return current
}

export function peekPendingConnection(): PendingConnection | null {
  return pending
}
