import { WebSocket } from "ws"
import { validateApiKey } from "./db.js"
import { register, deregister, get, removePendingRequest } from "./registry.js"
import type { TunnelC2S, TunnelS2C } from "@crosscode/shared"
import crypto from "crypto"

const AUTH_TIMEOUT_MS = 10_000
const PING_INTERVAL_MS = 15_000
const MAX_MISSED_PONGS = 3

const TUNNEL_DOMAIN = process.env.TUNNEL_DOMAIN || "tunnel.sish.work"

export function handleWebSocket(ws: WebSocket, req: import("http").IncomingMessage): void {
  let authenticated = false
  let projectId = ""
  let pingInterval: ReturnType<typeof setInterval> | null = null
  let missedPongs = 0

  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      send(ws, { type: "auth.fail", reason: "Authentication timeout" })
      ws.close(4000, "Auth timeout")
    }
  }, AUTH_TIMEOUT_MS)

  ws.on("message", (raw) => {
    let msg: TunnelC2S
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (!authenticated) {
      if (msg.type !== "auth") return
      handleAuth(msg.apiKey, msg.projectId)
      return
    }

    switch (msg.type) {
      case "pong":
        missedPongs = 0
        break

      case "response.head": {
        const entry = get(projectId)
        const pending = entry?.pendingRequests.get(msg.reqId)
        if (pending) pending.onHead(msg.status, msg.headers)
        break
      }

      case "response.chunk": {
        const entry = get(projectId)
        const pending = entry?.pendingRequests.get(msg.reqId)
        if (pending) pending.onChunk(Buffer.from(msg.data, "base64"))
        break
      }

      case "response.end": {
        const pending = removePendingRequest(projectId, msg.reqId)
        if (pending) pending.onEnd()
        break
      }

      case "response.error": {
        const pending = removePendingRequest(projectId, msg.reqId)
        if (pending) pending.onError(msg.message)
        break
      }
    }
  })

  ws.on("close", () => {
    cleanup()
    if (authenticated) {
      deregister(projectId)
    }
  })

  ws.on("error", () => {
    cleanup()
    if (authenticated) {
      deregister(projectId)
    }
  })

  function handleAuth(apiKey: string, projId: string) {
    clearTimeout(authTimeout)

    if (!apiKey || !projId) {
      send(ws, { type: "auth.fail", reason: "Missing apiKey or projectId" })
      ws.close(4000, "Bad auth")
      return
    }

    validateApiKey(apiKey).then((result) => {
      if (!result) {
        send(ws, { type: "auth.fail", reason: "Invalid API key" })
        ws.close(4001, "Invalid API key")
        return
      }

      if (result.tier === "free") {
        send(ws, { type: "auth.fail", reason: "Paid tier required" })
        ws.close(4003, "Paid tier required")
        return
      }

      authenticated = true
      projectId = projId
      register(projectId, result.userId, ws)

      const tunnelUrl = `https://${TUNNEL_DOMAIN}/t/${projectId}`
      send(ws, { type: "auth.ok", tunnelUrl })

      startHeartbeat()
    }).catch(() => {
      send(ws, { type: "auth.fail", reason: "Internal error" })
      ws.close(4002, "Internal error")
    })
  }

  function startHeartbeat() {
    pingInterval = setInterval(() => {
      if (missedPongs >= MAX_MISSED_PONGS) {
        ws.close(4004, "Heartbeat timeout")
        return
      }
      missedPongs++
      send(ws, { type: "ping" })
    }, PING_INTERVAL_MS)
  }

  function cleanup() {
    clearTimeout(authTimeout)
    if (pingInterval) clearInterval(pingInterval)
  }
}

export function generateReqId(): string {
  return crypto.randomUUID()
}

function send(ws: WebSocket, msg: TunnelS2C) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}
