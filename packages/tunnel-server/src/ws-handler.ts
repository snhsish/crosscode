import { WebSocket } from "ws"
import { validateApiKey } from "./db.js"
import { register, deregister, get, removePendingRequest, countByUserId } from "./registry.js"
import type { TunnelC2S, TunnelS2C } from "@crosscode/shared"
import crypto from "crypto"
import { logger } from "./logger.js"

const AUTH_TIMEOUT_MS = 10_000
const PING_INTERVAL_MS = 15_000
const MAX_MISSED_PONGS = 3

const TUNNEL_DOMAIN = process.env.TUNNEL_DOMAIN || "connect.crosscode.site"
const TUNNEL_URL_MODE = process.env.TUNNEL_URL_MODE || "path"

export function handleWebSocket(ws: WebSocket, req: import("http").IncomingMessage): void {
  const remoteAddr = req.socket.remoteAddress || "unknown"
  logger.info("WebSocket connection opened", { remoteAddr })

  let authenticated = false
  let projectId = ""
  let pingInterval: ReturnType<typeof setInterval> | null = null
  let missedPongs = 0

  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      logger.warn("WebSocket auth timeout", { remoteAddr })
      send(ws, { type: "auth.fail", reason: "Authentication timeout" })
      ws.close(4000, "Auth timeout")
    }
  }, AUTH_TIMEOUT_MS)

  ws.on("message", (raw) => {
    let msg: TunnelC2S
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      logger.warn("WebSocket received invalid JSON", { remoteAddr, raw: raw.toString().substring(0, 200) })
      return
    }

    if (!authenticated) {
      if (msg.type !== "auth") {
        logger.warn("WebSocket sent non-auth message before authentication", { remoteAddr, type: msg.type })
        return
      }
      handleAuth(msg.apiKey, msg.projectId)
      return
    }

    switch (msg.type) {
      case "pong":
        missedPongs = 0
        logger.debug("Received pong", { projectId, remoteAddr })
        break

      case "response.head": {
        const entry = get(projectId)
        const pending = entry?.pendingRequests.get(msg.reqId)
        if (pending) {
          logger.debug("Response head received", { projectId, reqId: msg.reqId, status: msg.status })
          pending.onHead(msg.status, msg.headers)
        } else {
          logger.warn("Response head for unknown reqId", { projectId, reqId: msg.reqId })
        }
        break
      }

      case "response.chunk": {
        const entry = get(projectId)
        const pending = entry?.pendingRequests.get(msg.reqId)
        if (pending) {
          pending.onChunk(Buffer.from(msg.data, "base64"))
        } else {
          logger.warn("Response chunk for unknown reqId", { projectId, reqId: msg.reqId })
        }
        break
      }

      case "response.end": {
        const pending = removePendingRequest(projectId, msg.reqId)
        if (pending) {
          logger.debug("Response end received", { projectId, reqId: msg.reqId })
          pending.onEnd()
        } else {
          logger.warn("Response end for unknown reqId", { projectId, reqId: msg.reqId })
        }
        break
      }

      case "response.error": {
        const pending = removePendingRequest(projectId, msg.reqId)
        if (pending) {
          logger.warn("Response error from tunnel client", { projectId, reqId: msg.reqId, error: msg.message })
          pending.onError(msg.message)
        } else {
          logger.warn("Response error for unknown reqId", { projectId, reqId: msg.reqId })
        }
        break
      }

      default:
        logger.warn("Unknown message type from tunnel client", { projectId, type: (msg as any).type })
    }
  })

  ws.on("close", (code, reason) => {
    cleanup()
    logger.info("WebSocket connection closed", { projectId, remoteAddr, code, reason: reason.toString() })
    if (authenticated) {
      deregister(projectId)
    }
  })

  ws.on("error", (err) => {
    logger.error("WebSocket error", { projectId, remoteAddr, error: err.message })
    cleanup()
    if (authenticated) {
      deregister(projectId)
    }
  })

  function handleAuth(apiKey: string, projId: string) {
    clearTimeout(authTimeout)
    logger.info("Auth attempt", { projectId: projId, remoteAddr, apiKeyPrefix: apiKey?.substring(0, 8) + "..." })

    if (!apiKey || !projId) {
      logger.warn("Auth failed: missing apiKey or projectId", { projectId: projId, remoteAddr, hasApiKey: !!apiKey })
      send(ws, { type: "auth.fail", reason: "Missing apiKey or projectId" })
      ws.close(4000, "Bad auth")
      return
    }

    validateApiKey(apiKey).then((result) => {
      if (!result) {
        logger.warn("Auth failed: invalid API key", { projectId: projId, remoteAddr })
        send(ws, { type: "auth.fail", reason: "Invalid API key" })
        ws.close(4001, "Invalid API key")
        return
      }

      const activeTunnels = countByUserId(result.userId)
      if (result.tier === "free" && activeTunnels >= 1) {
        logger.warn("Auth failed: free tier tunnel limit reached", { projectId: projId, userId: result.userId, activeTunnels })
        send(ws, { type: "auth.fail", reason: "Free plan allows only 1 active custom tunnel. Upgrade for more." })
        ws.close(4003, "Tunnel limit reached")
        return
      }

      authenticated = true
      projectId = projId
      register(projectId, result.userId, ws)

      const tunnelUrl = TUNNEL_URL_MODE === "subdomain"
        ? `https://${projectId}.${TUNNEL_DOMAIN}`
        : `https://${TUNNEL_DOMAIN}/t/${projectId}`
      send(ws, { type: "auth.ok", tunnelUrl })
      logger.info("Auth successful", { projectId, userId: result.userId, tunnelUrl })

      startHeartbeat()
    }).catch((err) => {
      logger.error("Auth failed: internal error", { projectId: projId, remoteAddr, error: err instanceof Error ? err.message : String(err) })
      send(ws, { type: "auth.fail", reason: "Internal error" })
      ws.close(4002, "Internal error")
    })
  }

  function startHeartbeat() {
    pingInterval = setInterval(() => {
      if (missedPongs >= MAX_MISSED_PONGS) {
        logger.warn("Heartbeat timeout, closing connection", { projectId, missedPongs })
        ws.close(4004, "Heartbeat timeout")
        return
      }
      missedPongs++
      logger.debug("Sending ping", { projectId, missedPongs })
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
  } else {
    logger.warn("Cannot send message: WebSocket not open", { readyState: ws.readyState, msgType: msg.type })
  }
}
