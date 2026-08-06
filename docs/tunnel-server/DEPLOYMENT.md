# Deployment Guide

Complete VPS setup guide for the CrossCode tunnel server.

## Prerequisites

- A VPS with a public IP (e.g., Hetzner CX22: 2 vCPU, 2GB RAM, 20GB SSD)
- Ubuntu 22.04+ or Debian 12+
- Docker + Docker Compose installed
- Caddy installed (for reverse proxy + automatic TLS)
- A domain name (e.g., `tunnel.sish.work`) pointed to the VPS IP

---

## 1. DNS Setup

Add DNS records in your DNS provider:

```
connect.crosscode.site        AAAA  <VPS_IPV6>
*.connect.crosscode.site      AAAA  <VPS_IPV6>
```

**Note**: Wildcard DNS is required for subdomain-based tunnel routing (e.g., `a1b2c3d4.connect.crosscode.site`).

If using Cloudflare proxy, you can also add A records (IPv4) — Cloudflare handles IPv4↔IPv6 translation automatically.

---

## 2. Install Docker (if not already installed)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Verify:

```bash
docker --version
docker compose version
```

---

## 3. Clone the Repo

```bash
git clone https://github.com/snhsish/crosscode.git ~/crosscode
cd ~/crosscode
```

---

## 4. Create the .env File

```bash
mkdir -p ~/crosscode/packages/tunnel-server
```

Create `~/crosscode/packages/tunnel-server/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/crosscode
TUNNEL_DOMAIN=connect.crosscode.site
PORT=3100
NODE_ENV=production
```

**Important**: Use the **same PostgreSQL database** as the web app. The tunnel-server reads the `user` table directly to validate API keys and check tiers.

---

## 5. Configure Caddy

Add this block to your existing Caddyfile (typically at `/etc/caddy/Caddyfile`):

```caddyfile
# Wildcard subdomain for tunnel proxy
*.connect.crosscode.site {
    tls {
        dns cloudflare <CLOUDFLARE_API_TOKEN>
    }

    # Health check on base domain only
    @baseDomain header Host "connect.crosscode.site"
    handle @baseDomain {
        handle /ws {
            reverse_proxy localhost:3100
        }
        handle /health {
            reverse_proxy localhost:3100
        }
        respond 404
    }

    # Tunnel proxy — all other subdomains
    # flush_interval -1 disables buffering for SSE streaming
    handle {
        reverse_proxy localhost:3100 {
            flush_interval -1
        }
    }
}

# Base domain for WebSocket and health
connect.crosscode.site {
    handle /ws {
        reverse_proxy localhost:3100
    }
    handle /health {
        reverse_proxy localhost:3100
    }
}
```

**Note**: The `dns cloudflare` directive requires the `caddy-dns` plugin and a Cloudflare API token with DNS edit permissions. This enables Let's Encrypt to issue a wildcard certificate via DNS-01 challenge.

Reload Caddy:

```bash
sudo systemctl reload caddy
```

Caddy will automatically:
- Obtain a wildcard TLS certificate from Let's Encrypt (via DNS-01 challenge)
- Configure HTTP→HTTPS redirect
- Handle WebSocket upgrades automatically

---

## 6. Deploy the Tunnel Server

### Option A: Automatic Deployment (Recommended)

The GitHub Actions workflow (`deploy-tunnel.yml`) handles this automatically on push to `main`.

**Required GitHub Secrets**:

```bash
SSH_HOST=<VPS_IP>
SSH_USER=<username>
SSH_KEY=<private_key>
```

Push to main:

```bash
git push origin main
```

The workflow will:
1. Build Docker image
2. Push to GHCR
3. SSH into VPS
4. Pull and run the container

### Option B: Manual Deployment

```bash
cd ~/crosscode

docker build -t crosscode-tunnel -f packages/tunnel-server/Dockerfile .

docker stop crosscode-tunnel 2>/dev/null || true
docker rm crosscode-tunnel 2>/dev/null || true

docker run -d \
  --name crosscode-tunnel \
  --restart always \
  -p 3100:3100 \
  --env-file ~/crosscode/packages/tunnel-server/.env \
  crosscode-tunnel
```

---

## 7. Verify Deployment

```bash
# Check container is running
docker ps | grep crosscode-tunnel

# Check health endpoint
curl https://tunnel.sish.work/health
# Expected: {"status":"ok"}

# Check logs
docker logs -f crosscode-tunnel
```

---

## 8. End-to-End Test

1. **Start CLI as paid user**:

```bash
crosscode login
crosscode
```

2. **Verify tunnel URL**: Should be `https://<projectId>.connect.crosscode.site`

3. **Test from mobile**: Scan QR, verify SSE streaming works in real-time

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (same DB as web app) |
| `TUNNEL_DOMAIN` | No | `connect.crosscode.site` | Domain for tunnel URLs (subdomain-based) |
| `PORT` | No | `3100` | Port to listen on |
| `NODE_ENV` | No | — | Set to `production` |

---

## Firewall Rules

Ensure these ports are open:

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (redirects to HTTPS) |
| 443 | TCP | HTTPS + WSS |

UFW example:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Monitoring

### Check Logs

```bash
docker logs -f crosscode-tunnel
```

### Check Connected Clients

```bash
docker exec crosscode-tunnel wget -qO- http://localhost:3100/health
```

### Resource Usage

```bash
docker stats crosscode-tunnel
```

---

## Updating

### Automatic (via GitHub Actions)

Push to main triggers automatic deployment.

### Manual

```bash
cd ~/crosscode
git pull origin main

docker build -t crosscode-tunnel -f packages/tunnel-server/Dockerfile .

docker stop crosscode-tunnel
docker rm crosscode-tunnel

docker run -d \
  --name crosscode-tunnel \
  --restart always \
  -p 3100:3100 \
  --env-file ~/crosscode/packages/tunnel-server/.env \
  crosscode-tunnel
```

---

## Troubleshooting

### SSE not streaming / buffering

**Symptom**: Mobile app receives responses in large chunks instead of streaming

**Solution**: Verify Caddy config has `flush_interval -1` on the `/t/*` handler.

```bash
sudo cat /etc/caddy/Caddyfile | grep -A 5 "handle /t/"
```

### WebSocket disconnects frequently

**Symptom**: PC client reconnects every few seconds

**Solution**: Caddy handles WebSocket automatically. Check tunnel-server logs:

```bash
docker logs crosscode-tunnel
```

### 503 "Tunnel not active"

**Symptom**: Mobile gets 503 error

**Solution**: The PC client isn't connected. Check `crosscode` is running on the PC.

```bash
# On PC
crosscode status
```

### 401/403 on API key validation

**Symptom**: Tunnel-server rejects valid API keys

**Solution**: 
1. Verify `DATABASE_URL` points to same database as web app
2. Check user has `tier !== 'free'` in database

```sql
SELECT email, tier, api_key FROM "user" WHERE api_key = 'cc_...';
```

### Container won't start

**Symptom**: Docker container exits immediately

**Solution**: Check logs for errors

```bash
docker logs crosscode-tunnel
```

Common issues:
- Invalid `DATABASE_URL`
- Database not accessible from VPS
- Port 3100 already in use

### High memory usage

**Symptom**: Container uses >1GB RAM

**Solution**: Check for stuck connections or pending requests

```bash
docker exec crosscode-tunnel wget -qO- http://localhost:3100/health
```

Restart if necessary:

```bash
docker restart crosscode-tunnel
```

---

## Backup & Recovery

### Database Backup

The tunnel-server doesn't write to the database, only reads. Backup the database separately (see web app docs).

### Configuration Backup

```bash
# Backup .env file
cp ~/crosscode/packages/tunnel-server/.env ~/crosscode-tunnel.env.backup
```

### Restore

```bash
# Restore .env file
cp ~/crosscode-tunnel.env.backup ~/crosscode/packages/tunnel-server/.env

# Restart container
docker restart crosscode-tunnel
```

---

## Security Hardening

### 1. Restrict Database Access

Ensure the tunnel-server can only read the `user` table:

```sql
CREATE ROLE tunnel_server WITH LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE crosscode TO tunnel_server;
GRANT USAGE ON SCHEMA public TO tunnel_server;
GRANT SELECT ON "user" TO tunnel_server;
```

### 2. Rate Limiting (Future)

Caddy supports rate limiting via plugins or via a separate rate limiter in front:

```caddyfile
tunnel.sish.work {
    # Example with caddy-ratelimit plugin
    rate_limit 100 50
    
    handle /t/* {
        reverse_proxy localhost:3100 {
            flush_interval -1
        }
    }
}
```

### 3. IP Whitelisting (Optional)

Restrict access to specific IPs:

```caddyfile
tunnel.sish.work {
    @blocked not remote_ip 1.2.3.4
    respond @blocked 403
    
    handle /t/* {
        reverse_proxy localhost:3100 {
            flush_interval -1
        }
    }
}
```

---

## Production Checklist

- [ ] DNS AAAA records (wildcard) pointing to VPS IPv6
- [ ] Docker installed and running
- [ ] Caddy installed and configured
- [ ] TLS certificate obtained automatically by Caddy
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] `.env` file created with correct `DATABASE_URL`
- [ ] Container running and healthy
- [ ] Health check endpoint responding
- [ ] End-to-end test passed (PC → VPS → Mobile)
- [ ] GitHub secrets configured for automatic deployment
- [ ] Monitoring in place (logs, resource usage)
- [ ] Backup strategy documented

---

## Support

For issues or questions:
- Check logs: `docker logs crosscode-tunnel`
- Review architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Check development guide: [DEVELOPMENT.md](./DEVELOPMENT.md)
