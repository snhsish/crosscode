import WebSocket from "ws"
import http from "http"
import crypto from "crypto"
import type { TunnelC2S, TunnelS2C } from "@crosscode/shared"

const TUNNEL_WS_URL = process.env.CROSSCODE_TUNNEL_WS_URL || "wss://tunnel.sish.work/ws"
const INITIAL_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 30_000
const DEBUG = process.env.CROSSCODE_DEBUG === "1"

interface InFlightRequest {
  req: http.ClientRequest
}

function debug(msg: string, meta?: Record<string, unknown>) {
  if (DEBUG) {
    const ts = new Date().toISOString()
    const extra = meta ? ` ${JSON.stringify(meta)}` : ""
    console.log(`[${ts}] [tunnel-client] ${msg}${extra}`)
  }
}

function censorAuth(val: string | undefined): string {
  if (!val) return "<none>"
  if (val.startsWith("Basic ")) {
    return `Basic ${val.substring(6, 14)}...`
  }
  return `${val.substring(0, 8)}...`
}

export function connectTunnel(
  apiKey: string,
  projectId: string,
  localPort: number,
  tunnelWsUrl: string | undefined,
  onTunnelUrl: (url: string) => void,
  onError: (err: Error) => void,
): () => void {
  let ws: WebSocket | null = null
  let backoff = INITIAL_BACKOFF_MS
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let shuttingDown = false
  const inFlight = new Map<string, InFlightRequest>()
  const wsUrl = tunnelWsUrl || TUNNEL_WS_URL

  function connect() {
    if (shuttingDown) return

    debug("connecting", { url: wsUrl })
    ws = new WebSocket(wsUrl)

    ws.on("open", () => {
      backoff = INITIAL_BACKOFF_MS
      debug("connected, sending auth", { projectId })
      const authMsg: TunnelC2S = { type: "auth", apiKey, projectId }
      ws!.send(JSON.stringify(authMsg))
    })

    ws.on("message", (raw) => {
      let msg: TunnelS2C
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        debug("received invalid JSON")
        return
      }

      switch (msg.type) {
        case "auth.ok":
          debug("auth succeeded", { tunnelUrl: msg.tunnelUrl })
          onTunnelUrl(msg.tunnelUrl)
          break

        case "auth.fail":
          debug("auth failed", { reason: msg.reason })
          onError(new Error(msg.reason))
          shuttingDown = true
          ws?.close()
          break

        case "ping":
          debug("received ping, sending pong")
          if (ws?.readyState === WebSocket.OPEN) {
            const pong: TunnelC2S = { type: "pong" }
            ws.send(JSON.stringify(pong))
          }
          break

        case "request":
          debug("received request", { reqId: msg.reqId, method: msg.method, path: msg.path })
          handleRequest(msg.reqId, msg.method, msg.path, msg.headers, msg.body)
          break
      }
    })

    ws.on("close", (code, reason) => {
      debug("connection closed", { code, reason: reason.toString() })
      abortAllInFlight()
      if (!shuttingDown) scheduleReconnect()
    })

    ws.on("error", (err) => {
      debug("connection error", { error: err.message })
      abortAllInFlight()
      if (!shuttingDown) scheduleReconnect()
    })
  }

  function handleRequest(reqId: string, method: string, path: string, headers: Record<string, string>, body?: string) {
    const bodyBuf = body ? Buffer.from(body, "base64") : null
    const authHeader = headers["authorization"] || headers["Authorization"]

    debug("forwarding request to proxy", {
      reqId,
      method,
      path,
      hasAuth: !!authHeader,
      auth: censorAuth(authHeader),
      headerKeys: Object.keys(headers),
      bodySize: bodyBuf?.length ?? 0,
    })

    const reqHeaders: http.OutgoingHttpHeaders = {}
    for (const [key, value] of Object.entries(headers)) {
      reqHeaders[key] = value
    }
    if (bodyBuf) reqHeaders["content-length"] = bodyBuf.length

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: localPort,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        debug("proxy responded", { reqId, status: res.statusCode })
        const respHeaders: Record<string, string> = {}
        for (const [key, value] of Object.entries(res.headers)) {
          if (value !== undefined) {
            respHeaders[key] = Array.isArray(value) ? value.join(", ") : value
          }
        }

        sendToWs({ type: "response.head", reqId, status: res.statusCode || 200, headers: respHeaders })

        res.on("data", (chunk: Buffer) => {
          sendToWs({ type: "response.chunk", reqId, data: chunk.toString("base64") })
        })

        res.on("end", () => {
          inFlight.delete(reqId)
          sendToWs({ type: "response.end", reqId })
        })

        res.on("error", (err) => {
          inFlight.delete(reqId)
          debug("response error", { reqId, error: err.message })
          sendToWs({ type: "response.error", reqId, message: err.message })
        })
      },
    )

    inFlight.set(reqId, { req })

    req.on("error", (err) => {
      inFlight.delete(reqId)
      debug("request error", { reqId, error: err.message })
      sendToWs({ type: "response.error", reqId, message: err.message })
    })

    if (bodyBuf) req.write(bodyBuf)
    req.end()
  }

  function sendToWs(msg: TunnelC2S) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    } else {
      debug("cannot send, WS not open", { readyState: ws?.readyState, type: msg.type })
    }
  }

  function abortAllInFlight() {
    const count = inFlight.size
    if (count > 0) debug("aborting in-flight requests", { count })
    for (const [reqId, { req }] of inFlight) {
      req.destroy()
      sendToWs({ type: "response.error", reqId, message: "Client reconnecting" })
    }
    inFlight.clear()
  }

  function scheduleReconnect() {
    if (shuttingDown) return
    debug("scheduling reconnect", { backoffMs: backoff })
    reconnectTimer = setTimeout(() => {
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
      connect()
    }, backoff)
  }

  connect()

  return () => {
    shuttingDown = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    abortAllInFlight()
    ws?.close()
  }
}

export function deriveProjectId(): string {
  return crypto.randomBytes(4).toString("hex")
}
