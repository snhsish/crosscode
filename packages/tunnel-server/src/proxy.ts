import type { IncomingMessage, ServerResponse } from "http"
import { get, addPendingRequest } from "./registry.js"
import { generateReqId } from "./ws-handler.js"
import type { TunnelS2C } from "@crosscode/shared"
import type { WebSocket } from "ws"
import { logger } from "./logger.js"

export function handleProxy(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url || "/"
  const method = req.method || "GET"
  const startTime = Date.now()

  logger.debug("Incoming proxy request", { method, url, host: req.headers.host })

  const host = req.headers.host || ""
  const match = host.match(/^([a-f0-9]+)\./)

  if (!match) {
    logger.warn("Invalid tunnel subdomain format", { host })
    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Not found" }))
    return
  }

  const projectId = match[1]
  const path = url

  const entry = get(projectId)
  if (!entry) {
    logger.warn("Tunnel not active for project", { projectId, path, method })
    res.writeHead(503, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Tunnel not active" }))
    return
  }

  const reqId = generateReqId()
  const hasAuth = !!req.headers["authorization"]
  const authValue = req.headers["authorization"]
  logger.info("Proxy request started", { projectId, reqId, method, path, userId: entry.userId, hasAuth, authValue: authValue ? authValue.substring(0, 30) + "..." : "none" })

  const headers: Record<string, string> = {}
  const hopByHopHeaders = ["host", "connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-authenticate", "proxy-authorization", "te", "trailer"]
  for (const [key, value] of Object.entries(req.headers)) {
    if (value && !hopByHopHeaders.includes(key.toLowerCase())) {
      headers[key] = Array.isArray(value) ? value.join(", ") : value
    }
  }
  logger.info("Headers forwarded to tunnel client", { projectId, reqId, headerKeys: Object.keys(headers) })

  const bodyChunks: Buffer[] = []
  req.on("data", (chunk) => bodyChunks.push(chunk))
  req.on("end", () => {
    const body = bodyChunks.length > 0
      ? Buffer.concat(bodyChunks).toString("base64")
      : undefined

    if (body) {
      logger.debug("Request body received", { projectId, reqId, bodySize: body.length })
    }

    let headSent = false
    let responseStatus = 0

    addPendingRequest(projectId, reqId, {
      onHead(status, respHeaders) {
        headSent = true
        responseStatus = status
        const safeHeaders: Record<string, string> = { ...respHeaders }
        delete safeHeaders["connection"]
        delete safeHeaders["keep-alive"]
        delete safeHeaders["transfer-encoding"]
        logger.debug("Sending response head", { projectId, reqId, status })
        res.writeHead(status, safeHeaders)
      },
      onChunk(data) {
        if (!headSent) {
          logger.warn("Response chunk before head, sending 200", { projectId, reqId })
          res.writeHead(200, { "Content-Type": "application/octet-stream" })
          headSent = true
          responseStatus = 200
        }
        res.write(data)
      },
      onEnd() {
        if (!headSent) {
          logger.warn("Response end before head, sending 200", { projectId, reqId })
          res.writeHead(200)
          responseStatus = 200
        }
        res.end()
        const duration = Date.now() - startTime
        logger.info("Proxy request completed", { projectId, reqId, method, path, status: responseStatus, duration })
      },
      onError(message) {
        const duration = Date.now() - startTime
        if (!headSent) {
          logger.error("Proxy request error (before head)", { projectId, reqId, method, path, error: message, duration })
          res.writeHead(502, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: message }))
        } else {
          logger.error("Proxy request error (after head sent)", { projectId, reqId, method, path, status: responseStatus, error: message, duration })
          res.destroy()
        }
      },
    })

    const msg: TunnelS2C = {
      type: "request",
      reqId,
      method: req.method || "GET",
      path,
      headers,
      body,
    }

    sendToClient(entry.ws, msg, projectId, reqId)
  })

  req.on("error", (err) => {
    const duration = Date.now() - startTime
    logger.error("Request stream error", { projectId, reqId, error: err.message, duration })
    res.writeHead(500)
    res.end("Internal error")
  })

  res.on("close", () => {
    const duration = Date.now() - startTime
    const entry = get(projectId)
    if (entry) {
      const wasPending = entry.pendingRequests.delete(reqId)
      if (wasPending) {
        logger.warn("Response closed before completion", { projectId, reqId, method, path, duration })
      }
    }
  })
}

function sendToClient(ws: WebSocket, msg: TunnelS2C, projectId: string, reqId: string) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg))
    logger.debug("Request forwarded to tunnel client", { projectId, reqId })
  } else {
    logger.error("Cannot forward request: WebSocket not open", { projectId, reqId, readyState: ws.readyState })
  }
}
