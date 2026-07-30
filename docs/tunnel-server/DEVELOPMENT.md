# Development Guide

Local development setup for the CrossCode tunnel server.

## Prerequisites

- Node.js 20+
- pnpm 9.15+
- PostgreSQL database (can be local or remote)
- Git

## Project Structure

```
packages/tunnel-server/
├── src/
│   ├── index.ts           # Entry: HTTP server + WS upgrade handler
│   ├── db.ts              # PostgreSQL connection + user validation
│   ├── ws-handler.ts      # WS lifecycle: auth, heartbeat, registry
│   ├── proxy.ts           # Public HTTP → WS forwarding + streaming
│   ├── registry.ts        # In-memory client registry
│   └── types.ts           # (types are in @crosscode/shared)
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Local Setup

### 1. Clone and Install

```bash
git clone https://github.com/snhsish/crosscode.git
cd crosscode
pnpm install
```

### 2. Configure Environment

Create `packages/tunnel-server/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/crosscode
TUNNEL_DOMAIN=localhost:3100
PORT=3100
NODE_ENV=development
```

**Note**: Use the same database as the web app for local development.

### 3. Build Dependencies

```bash
pnpm --filter @crosscode/shared build
```

### 4. Build Tunnel Server

```bash
pnpm --filter @crosscode/tunnel-server build
```

### 5. Run Locally

```bash
cd packages/tunnel-server
node dist/index.js
```

Expected output:

```
tunnel-server listening on port 3100
```

### 6. Test Health Endpoint

```bash
curl http://localhost:3100/health
# Expected: {"status":"ok"}
```

## Development Workflow

### Watch Mode

```bash
pnpm --filter @crosscode/tunnel-server dev
```

This watches for changes and rebuilds automatically.

### Run with Auto-Restart

Use `nodemon` or similar:

```bash
npm install -g nodemon
cd packages/tunnel-server
nodemon --watch dist --exec node dist/index.js
```

### TypeScript Checking

```bash
cd packages/tunnel-server
npx tsc --noEmit
```

## Testing

### Manual Testing with WebSocket Client

Install a WebSocket client like `wscat`:

```bash
npm install -g wscat
```

Connect to tunnel-server:

```bash
wscat -c ws://localhost:3100/ws
```

Send auth message:

```json
{
  "type": "auth",
  "apiKey": "cc_...",
  "projectId": "test123"
}
```

Expected response:

```json
{
  "type": "auth.ok",
  "tunnelUrl": "http://localhost:3100/t/test123"
}
```

### Testing HTTP Proxy

With a connected client, test the proxy:

```bash
curl http://localhost:3100/t/test123/health
```

This forwards to the connected PC client's local proxy.

### Testing with Real PC Client

1. Start tunnel-server locally:

```bash
cd packages/tunnel-server
node dist/index.js
```

2. Start PC client with custom tunnel URL:

```bash
cd packages/crosscode
CROSSCODE_TUNNEL_WS_URL=ws://localhost:3100/ws node dist/cli.js
```

3. Verify connection in tunnel-server logs

### Testing with Mobile App

1. Start tunnel-server locally
2. Start PC client pointing to local tunnel-server
3. Update mobile app to use local tunnel URL:

```typescript
// In mobile app connection settings
url: "http://<PC_IP>:3100/t/test123"
```

**Note**: Mobile app needs to reach the PC's local network IP.

## Database Setup

### Local PostgreSQL

```bash
# Install PostgreSQL (Ubuntu)
sudo apt install postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE crosscode;
CREATE USER crosscode WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE crosscode TO crosscode;
```

### Using Docker

```bash
docker run -d \
  --name crosscode-db \
  -e POSTGRES_USER=crosscode \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=crosscode \
  -p 5432:5432 \
  postgres:15
```

### Schema Setup

The tunnel-server only reads from the `user` table. Ensure the web app schema is set up:

```bash
cd apps/web
pnpm db:push
```

### Test Data

Create a test user with paid tier:

```sql
INSERT INTO "user" (id, name, email, email_verified, tier, api_key, created_at, updated_at)
VALUES (
  'test-user-id',
  'Test User',
  'test@example.com',
  true,
  'pro',
  'cc_test1234567890abcdef1234567890abcdef1234567890abcdef',
  NOW(),
  NOW()
);
```

## Debugging

### Enable Debug Logs

Set `NODE_ENV=development` for verbose logging.

### Inspect WebSocket Messages

Add logging in `ws-handler.ts`:

```typescript
ws.on("message", (raw) => {
  console.log("WS message:", raw.toString())
  // ... rest of handler
})
```

### Inspect HTTP Requests

Add logging in `proxy.ts`:

```typescript
export function handleProxy(req: IncomingMessage, res: ServerResponse): void {
  console.log("HTTP request:", req.method, req.url)
  // ... rest of handler
}
```

### Database Query Logging

Enable query logging in `db.ts`:

```typescript
const sql = postgres(process.env.DATABASE_URL!, {
  debug: (connection, query, params) => {
    console.log("DB query:", query, params)
  }
})
```

## Common Issues

### Port Already in Use

```bash
# Check what's using port 3100
lsof -i :3100

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3101 node dist/index.js
```

### Database Connection Failed

```bash
# Test database connection
psql postgresql://user:password@localhost:5432/crosscode

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### TypeScript Errors

```bash
# Clear build cache
rm -rf packages/tunnel-server/dist
rm -rf node_modules/.cache

# Rebuild
pnpm --filter @crosscode/tunnel-server build
```

### WebSocket Connection Refused

Check:
1. Tunnel-server is running
2. Port 3100 is open
3. Firewall allows WebSocket connections
4. Client is using correct URL (`ws://` not `wss://` for local)

## Docker Development

### Build Image

```bash
docker build -t crosscode-tunnel-dev -f packages/tunnel-server/Dockerfile .
```

### Run Container

```bash
docker run -d \
  --name crosscode-tunnel-dev \
  -p 3100:3100 \
  --env-file packages/tunnel-server/.env \
  crosscode-tunnel-dev
```

### View Logs

```bash
docker logs -f crosscode-tunnel-dev
```

### Shell into Container

```bash
docker exec -it crosscode-tunnel-dev sh
```

## Testing Edge Cases

### Connection Timeout

Test auth timeout by delaying the auth message:

```bash
wscat -c ws://localhost:3100/ws
# Wait 10+ seconds without sending auth
# Expected: Connection closed with code 4000
```

### Heartbeat Timeout

Test heartbeat by not responding to pings:

```bash
wscat -c ws://localhost:3100/ws
# Send auth, then don't respond to pings
# Expected: Connection closed after 45s (3 missed pongs)
```

### Multiple Clients Same Project

Test last-connect-wins:

```bash
# Terminal 1
wscat -c ws://localhost:3100/ws
# Auth with projectId "test123"

# Terminal 2
wscat -c ws://localhost:3100/ws
# Auth with same projectId "test123"

# Expected: Terminal 1 connection closed with code 4001
```

### Invalid API Key

```bash
wscat -c ws://localhost:3100/ws
# Send auth with invalid API key
# Expected: Connection closed with code 4001
```

### Free Tier User

```bash
wscat -c ws://localhost:3100/ws
# Send auth with API key for user with tier="free"
# Expected: Connection closed with code 4003
```

## Performance Testing

### Load Testing

Use `autocannon` or similar:

```bash
npm install -g autocannon

# Test health endpoint
autocannon -c 100 -d 10 http://localhost:3100/health
```

### Memory Profiling

```bash
node --inspect dist/index.js
```

Open Chrome DevTools → Node.js → Memory

### CPU Profiling

```bash
node --prof dist/index.js
node --prof-process isolate-*.log > profile.txt
```

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- No comments unless necessary
- Use ESM imports

### Pull Request Checklist

- [ ] Code builds without errors
- [ ] TypeScript passes `tsc --noEmit`
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Documentation updated
- [ ] No sensitive data in commits

### Running Tests (Future)

```bash
pnpm --filter @crosscode/tunnel-server test
```

## Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Main README](./README.md)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Node.js Streams](https://nodejs.org/api/stream.html)
