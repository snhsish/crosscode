# CrossCode Tunnel Server

Self-hosted WebSocket relay service for paid CrossCode users. Replaces Cloudflare tunnels with a dedicated, low-latency connection that streams SSE responses in real-time.

## Overview

The tunnel service enables paid users to connect their PC to the CrossCode mobile app through a dedicated VPS-hosted relay, eliminating the buffering issues inherent in Cloudflare tunnels.

### Architecture

```
Mobile App ──HTTPS/SSE──▶ Nginx (443)
                              │
                         ┌────┴────┐
                         │  /t/*   │──▶ tunnel-server (3100) ──▶ PostgreSQL
                         │  /ws    │                                    │
                         └─────────┘                              WebSocket
                                                                       │
                                                                 tunnel-client (PC)
                                                                       │
                                                                 http://127.0.0.1:4097
                                                                 (local proxy)
                                                                       │
                                                                 opencode serve :4096
```

### Key Features

- **Zero-buffering SSE streaming**: Responses stream chunk-by-chunk in real-time
- **Persistent project URLs**: Each project gets a stable 8-char hex ID based on git remote
- **Automatic tier enforcement**: Only paid users can access the tunnel
- **Heartbeat & auto-reconnect**: 15s ping/pong with exponential backoff on disconnect
- **Clean teardown**: In-flight requests abort immediately on disconnect

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Protocol design, security model, and data flow
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — VPS setup, nginx config, DNS, TLS, and deployment
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** — Local development, testing, and debugging

## Quick Start (Users)

For paid users, the tunnel is automatic:

```bash
# Login first
crosscode login

# Then just run crosscode
crosscode
```

The CLI detects your tier and automatically uses the tunnel instead of Cloudflare. If the tunnel fails, it falls back to Cloudflare.

Free users continue using Cloudflare by default.

## Project ID Derivation

Each project gets a stable tunnel URL based on the git remote:

```bash
git remote get-url origin  →  "git@github.com:user/repo.git"
sha256("git@github.com:user/repo.git")  →  first 8 hex chars  →  "a1b2c3d4"
```

Tunnel URL: `https://tunnel.sish.work/t/a1b2c3d4`

Same repo on any machine = same tunnel URL. If no git remote, the current working directory is hashed instead.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (same DB as web app) |
| `TUNNEL_DOMAIN` | No | `tunnel.sish.work` | Domain for tunnel URLs |
| `PORT` | No | `3100` | Port to listen on |
| `NODE_ENV` | No | — | Set to `production` |

## Access Control

| User Type | Tunnel Provider | Behavior |
|-----------|----------------|----------|
| Not logged in | Cloudflare | Default, no auth required |
| Logged in, free tier | Cloudflare | Default, uses API key for auth |
| Logged in, paid tier | CrossCode Tunnel | Automatic, falls back to Cloudflare on failure |
| `--ngrok` flag | ngrok | Explicit override, ignores tier |

## Security

- **API key validation**: Direct database lookup against `user.api_key`
- **Tier enforcement**: Server rejects connections where `tier = 'free'`
- **Project ID obscurity**: 8-hex-char IDs (2^32 space) + opencode session token required
- **Heartbeat timeout**: 3 missed pongs = connection closed
- **Request cleanup**: In-flight requests abort on disconnect, mobile gets 502

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full VPS setup guide.

Quick deployment via GitHub Actions:

```bash
# Push to main triggers automatic deployment
git push origin main
```

The workflow builds the Docker image, pushes to GHCR, and deploys via SSH.

## Local Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for local setup.

Quick start:

```bash
# Install dependencies
pnpm install

# Build tunnel-server
pnpm --filter @crosscode/tunnel-server build

# Run locally
cd packages/tunnel-server
DATABASE_URL=postgresql://... PORT=3100 node dist/index.js
```

## Troubleshooting

**SSE not streaming / buffering**
- Verify nginx has `proxy_buffering off` and `chunked_transfer_encoding off` on `/t/`

**WebSocket disconnects**
- Check `proxy_read_timeout 86400s` is set on `/ws` location

**503 "Tunnel not active"**
- PC client isn't connected. Verify `crosscode` is running.

**401/403 on API key validation**
- Verify `DATABASE_URL` points to same database as web app
- Check user has `tier !== 'free'`

## License

MIT
