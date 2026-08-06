import http from "http"
import { WebSocketServer } from "ws"
import { handleWebSocket } from "./ws-handler.js"
import { handleProxy } from "./proxy.js"
import { logger } from "./logger.js"
import { getRegistryStats } from "./registry.js"

const PORT = parseInt(process.env.PORT || "3100", 10)
const VERSION = "0.2.0"

logger.info("Starting tunnel-server", { version: VERSION, port: PORT, nodeEnv: process.env.NODE_ENV, tunnelDomain: process.env.TUNNEL_DOMAIN || "tunnel.sish.work" })

const TUNNEL_DOMAIN = process.env.TUNNEL_DOMAIN || "tunnel.sish.work"

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    const stats = getRegistryStats()
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ status: "ok", version: VERSION, ...stats }))
    return
  }

  if (req.url?.startsWith("/t/")) {
    handleProxy(req, res)
    return
  }

  const host = req.headers.host || ""
  const subdomainMatch = host.match(/^([a-f0-9]+)\.(.+)$/i)
  if (subdomainMatch && subdomainMatch[2] === TUNNEL_DOMAIN) {
    const projectId = subdomainMatch[1]
    handleProxy(req, res, projectId)
    return
  }

  logger.debug("404 Not found", { url: req.url, method: req.method })
  res.writeHead(404, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ error: "Not found" }))
})

server.on("error", (err) => {
  logger.error("HTTP server error", { error: err.message, stack: err.stack })
})

const wss = new WebSocketServer({ noServer: true })

wss.on("connection", (ws, req) => {
  logger.debug("WebSocketServer connection event", { remoteAddr: req.socket.remoteAddress })
})

wss.on("error", (err) => {
  logger.error("WebSocketServer error", { error: err.message })
})

server.on("upgrade", (req, socket, head) => {
  logger.debug("Upgrade request", { url: req.url, remoteAddr: req.socket.remoteAddress })
  if (req.url === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleWebSocket(ws, req)
    })
  } else {
    logger.warn("Invalid WebSocket path, destroying socket", { url: req.url })
    socket.destroy()
  }
})

const shutdown = () => {
  logger.info("Shutting down tunnel-server...")
  const stats = getRegistryStats()
  logger.info("Current registry stats on shutdown", stats)
  wss.clients.forEach((ws) => ws.close(1001, "Server shutting down"))
  server.close(() => {
    logger.info("HTTP server closed, exiting")
    process.exit(0)
  })
  setTimeout(() => {
    logger.error("Forced shutdown after timeout")
    process.exit(1)
  }, 5000)
}

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM")
  shutdown()
})
process.on("SIGINT", () => {
  logger.info("Received SIGINT")
  shutdown()
})

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack })
  process.exit(1)
})

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason: reason instanceof Error ? reason.message : String(reason) })
})

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`tunnel-server v${VERSION} listening on port ${PORT}`)
})
