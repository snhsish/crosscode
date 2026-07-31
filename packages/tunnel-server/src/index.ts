import http from "http"
import { WebSocketServer } from "ws"
import { handleWebSocket } from "./ws-handler.js"
import { handleProxy } from "./proxy.js"

const PORT = parseInt(process.env.PORT || "3100", 10)
const VERSION = "0.2.0"

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ status: "ok", version: VERSION }))
    return
  }

  if (req.url?.startsWith("/t/")) {
    handleProxy(req, res)
    return
  }

  res.writeHead(404, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ error: "Not found" }))
})

const wss = new WebSocketServer({ noServer: true })

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleWebSocket(ws, req)
    })
  } else {
    socket.destroy()
  }
})

const shutdown = () => {
  console.log("Shutting down tunnel-server...")
  wss.clients.forEach((ws) => ws.close(1001, "Server shutting down"))
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 5000)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

server.listen(PORT, "0.0.0.0", () => {
  console.log(`tunnel-server v${VERSION} listening on port ${PORT}`)
})
