# Architecture

## Wire Protocol

Communication between tunnel-client (PC) and tunnel-server (VPS) uses JSON-framed WebSocket messages.

### Client → Server Messages

```typescript
type TunnelC2S =
  | { type: "auth"; apiKey: string; projectId: string }
  | { type: "pong" }
  | { type: "response.head"; reqId: string; status: number; headers: Record<string, string> }
  | { type: "response.chunk"; reqId: string; data: string }   // base64
  | { type: "response.end"; reqId: string }
  | { type: "response.error"; reqId: string; message: string }
```

### Server → Client Messages

```typescript
type TunnelS2C =
  | { type: "ping" }
  | { type: "auth.ok"; tunnelUrl: string }
  | { type: "auth.fail"; reason: string }
  | { type: "request"; reqId: string; method: string; path: string; headers: Record<string, string>; body?: string }
```

### Protocol Flow

#### 1. Authentication

```
PC (tunnel-client)                    VPS (tunnel-server)
        │                                      │
        │──── { type: "auth",                  │
        │      apiKey: "cc_...",               │
        │      projectId: "a1b2c3d4" } ──────▶│
        │                                      │  Validate API key
        │                                      │  Check tier !== "free"
        │                                      │  Register in registry
        │◀──── { type: "auth.ok",              │
        │      tunnelUrl: "https://..." } ─────│
        │                                      │
```

#### 2. Request Forwarding

```
Mobile App              VPS (tunnel-server)           PC (tunnel-client)        opencode serve
    │                           │                              │                      │
    │── POST /t/a1b2c3d4/... ──▶│                              │                      │
    │                           │── { type: "request",         │                      │
    │                           │     reqId: "uuid",           │                      │
    │                           │     method: "POST",          │                      │
    │                           │     path: "/session",        │                      │
    │                           │     headers: {...},          │                      │
    │                           │     body: "base64..." } ────▶│                      │
    │                           │                              │── POST /session ────▶│
    │                           │                              │◀── 200 OK ──────────│
    │                           │◀── { type: "response.head",  │                      │
    │                           │     reqId: "uuid",           │                      │
    │                           │     status: 200,             │                      │
    │                           │     headers: {...} } ────────│                      │
    │◀── 200 OK ────────────────│                              │                      │
    │                           │◀── { type: "response.chunk", │                      │
    │◀── chunk (base64 decoded) │     reqId: "uuid",           │                      │
    │   (streaming)             │     data: "base64..." } ────▶│                      │
    │                           │                              │                      │
    │                           │◀── { type: "response.end",   │                      │
    │◀── end ───────────────────│     reqId: "uuid" } ────────▶│                      │
    │                           │                              │                      │
```

#### 3. Heartbeat

```
PC (tunnel-client)                    VPS (tunnel-server)
        │                                      │
        │◀──── { type: "ping" } ──────────────│  (every 15s)
        │──── { type: "pong" } ──────────────▶│
        │                                      │
        │  (if 3 pings missed, connection      │
        │   is closed with code 4004)          │
```

## Data Flow

### Request Lifecycle

1. **Mobile App** sends HTTP request to `https://tunnel.sish.work/t/{projectId}/...`
2. **Nginx** forwards to `tunnel-server` on port 3100 with `proxy_buffering off`
3. **tunnel-server** looks up `projectId` in registry
4. **tunnel-server** generates `reqId` (UUID), sends `request` message over WS
5. **tunnel-client** receives message, makes HTTP request to `http://127.0.0.1:4097{path}`
6. **tunnel-client** streams response back:
   - `response.head` with status + headers
   - `response.chunk` for each data chunk (base64 encoded)
   - `response.end` when complete
7. **tunnel-server** writes each chunk immediately to HTTP response (zero buffering)
8. **Mobile App** receives streamed response in real-time

### SSE Streaming

For SSE endpoints (e.g., `GET /event`):

1. Mobile requests `POST /t/{projectId}/mobile-event` (existing workaround)
2. tunnel-server forwards to PC's local proxy
3. Local proxy opens `GET /event` to opencode
4. opencode streams SSE events
5. Each SSE event is forwarded as a `response.chunk` over WS
6. tunnel-server writes each chunk immediately to HTTP response
7. Mobile receives SSE events in real-time

**Future optimization**: Mobile can use direct `GET /t/{projectId}/event` for native SSE (no POST workaround needed).

## Registry

In-memory map: `Map<projectId, ClientEntry>`

```typescript
interface ClientEntry {
  ws: WebSocket
  userId: string
  connectedAt: Date
  pendingRequests: Map<string, PendingRequest>
}

interface PendingRequest {
  onHead: (status: number, headers: Record<string, string>) => void
  onChunk: (data: Buffer) => void
  onEnd: () => void
  onError: (message: string) => void
}
```

### Behavior

- **Single client per project**: Last connect wins; old WS gets closed with error frame
- **Request tracking**: Each in-flight request is tracked by `reqId`
- **Cleanup on disconnect**: All pending requests get `onError("Tunnel client disconnected")`

## Security Model

### Authentication

- **API key validation**: Direct database lookup against `user.api_key` column
- **Tier enforcement**: Server rejects connections where `tier = 'free'`
- **Auth timeout**: 10 seconds to authenticate, then connection closed

### Authorization

- **Project ID obscurity**: 8-hex-char IDs (2^32 space) make guessing impractical
- **Opencode session token**: Required for any useful action (Basic auth)
- **Database isolation**: Tunnel-server only reads `user` table, no write access

### Connection Security

- **Heartbeat**: 15s ping interval, 3 missed pongs = connection closed
- **Graceful shutdown**: SIGTERM closes all WS with goodbye frame, drains in-flight
- **Request cleanup**: In-flight requests abort immediately on disconnect

### Network Security

- **TLS termination**: Nginx handles HTTPS/WSS
- **Firewall**: Only ports 22, 80, 443 exposed
- **Rate limiting**: Not implemented yet (future enhancement)

## Error Handling

### Client-Side Errors

| Error | Behavior |
|-------|----------|
| Auth timeout | Connection closed with code 4000 |
| Invalid API key | Connection closed with code 4001 |
| Free tier user | Connection closed with code 4003 |
| Heartbeat timeout | Connection closed with code 4004 |
| Replaced by new connection | Connection closed with code 4001 |

### Server-Side Errors

| Error | HTTP Status | Response |
|-------|-------------|----------|
| Project not found | 503 | `{ "error": "Tunnel not active" }` |
| Invalid path format | 404 | `{ "error": "Not found" }` |
| opencode unreachable | 502 | `{ "error": "Bad Gateway" }` |
| Request error | 502 | `{ "error": "<message>" }` |

### Client Auto-Reconnect

```
Initial backoff: 1s
Multiplier: 2x
Max backoff: 30s
```

On reconnect:
1. Re-authenticate with same `apiKey` + `projectId`
2. All in-flight requests from previous connection are aborted
3. Mobile clients receive 502 for those requests

## Performance Characteristics

### Latency

- **WebSocket overhead**: ~1-2ms per message (JSON serialization)
- **Base64 encoding**: ~33% size increase, but negligible for text-heavy SSE
- **Chunk size**: No explicit limit; depends on opencode response chunks

### Throughput

- **Concurrent requests**: Limited by Node.js event loop (thousands)
- **Memory**: ~1KB per pending request (headers + tracking)
- **CPU**: Minimal (JSON parsing, base64 encoding)

### Scalability

- **Single instance**: Handles thousands of concurrent connections
- **Horizontal scaling**: Not implemented (would require shared registry)
- **Database load**: One query per connection (API key validation)

## Monitoring

### Health Check

```bash
curl https://tunnel.sish.work/health
# Response: { "status": "ok" }
```

### Logs

```bash
docker logs -f crosscode-tunnel
```

### Metrics (Future)

- Connected clients count
- Active requests count
- Request latency (p50, p95, p99)
- Error rates
- Bandwidth usage

## Future Enhancements

1. **Rate limiting**: Per-user request quotas
2. **Metrics**: Prometheus metrics endpoint
3. **Horizontal scaling**: Redis-backed shared registry
4. **Connection pooling**: Reuse WS connections for multiple projects
5. **Compression**: gzip/base64 compression for large payloads
6. **Native SSE**: Direct GET support without POST workaround
7. **WebSocket compression**: permessage-deflate for reduced bandwidth
