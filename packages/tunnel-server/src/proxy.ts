import type { IncomingMessage, ServerResponse } from "http"
import { get, addPendingRequest } from "./registry.js"
import { generateReqId } from "./ws-handler.js"
import type { TunnelS2C } from "@crosscode/shared"
import type { WebSocket } from "ws"

export function handleProxy(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url || ""
  const match = url.match(/^\/t\/([a-f0-9]+)(\/.*)?$/)

  if (!match) {
    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Not found" }))
    return
  }

  const projectId = match[1]
  const path = match[2] || "/"

  const entry = get(projectId)
  if (!entry) {
    res.writeHead(503, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Tunnel not active" }))
    return
  }

  const reqId = generateReqId()

  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (value && key.toLowerCase() !== "host" && key.toLowerCase() !== "connection") {
      headers[key] = Array.isArray(value) ? value.join(", ") : value
    }
  }

  const bodyChunks: Buffer[] = []
  req.on("data", (chunk) => bodyChunks.push(chunk))
  req.on("end", () => {
    const body = bodyChunks.length > 0
      ? Buffer.concat(bodyChunks).toString("base64")
      : undefined

    let headSent = false

    addPendingRequest(projectId, reqId, {
      onHead(status, respHeaders) {
        headSent = true
        const safeHeaders: Record<string, string> = { ...respHeaders }
        delete safeHeaders["connection"]
        delete safeHeaders["keep-alive"]
        delete safeHeaders["transfer-encoding"]
        res.writeHead(status, safeHeaders)
      },
      onChunk(data) {
        if (!headSent) {
          res.writeHead(200, { "Content-Type": "application/octet-stream" })
          headSent = true
        }
        res.write(data)
      },
      onEnd() {
        if (!headSent) {
          res.writeHead(200)
        }
        res.end()
      },
      onError(message) {
        if (!headSent) {
          res.writeHead(502, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: message }))
        } else {
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

    sendToClient(entry.ws, msg)
  })

  req.on("error", () => {
    res.writeHead(500)
    res.end("Internal error")
  })

  res.on("close", () => {
    const entry = get(projectId)
    if (entry) {
      entry.pendingRequests.delete(reqId)
    }
  })
}

function sendToClient(ws: WebSocket, msg: TunnelS2C) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}
