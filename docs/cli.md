# CrossCode CLI Reference

## Installation

```bash
npm install -g crosscode
# or
pnpm add -g crosscode
# or run directly
npx crosscode
```

## Usage

```
crosscode [command] [options]
```

## Commands

### `crosscode` (default)

Starts `opencode serve`, creates a tunnel, and displays a QR code for the mobile app.

```bash
crosscode
crosscode --cloudflared
crosscode --ngrok
```

**Tunnel selection:**

| Condition | Tunnel Used |
|---|---|
| Logged in with paid tier | CrossCode Tunnel (`tunnel.sish.work`) |
| `--ngrok` flag | ngrok |
| `--cloudflared` flag | cloudflared |
| No flag, not logged in | cloudflared (fallback) |
| CrossCode tunnel fails | cloudflared (automatic fallback) |

### `crosscode login`

Authenticates with the CrossCode API.

```bash
crosscode login
```

1. Opens browser to `https://crosscode.sish.work/login`
2. Log in on the dashboard and copy the API key
3. Paste the API key in the terminal

Credentials are saved to `~/.crosscode/config.json`.

### `crosscode logout`

Clears saved authentication.

```bash
crosscode logout
```

### `crosscode status`

Shows current login status and tier.

```bash
crosscode status
```

Output when logged in:
```
Logged in as user@example.com
Tier: pro
```

Output when not logged in:
```
Not logged in (using cloudflared tunnel)
```

### `crosscode help`

Displays help message with all commands and options.

```bash
crosscode help
crosscode --help
crosscode -h
```

## Options

| Flag | Description |
|---|---|
| `--cloudflared` | Force Cloudflare tunnel (`cloudflared` binary required) |
| `--ngrok` | Force ngrok tunnel (`ngrok` binary + auth token required) |
| `--help`, `-h` | Show help message |

## Interactive Controls

While the tunnel is running:

| Key | Action |
|---|---|
| `l` | Toggle log viewer — shows last 20 lines from crosscode, tunnel, and opencode logs |
| `Ctrl+C` | Graceful shutdown — kills all child processes and exits |

## Configuration

Config file: `~/.crosscode/config.json`

```json
{
  "ngrokToken": "string — ngrok auth token (saved on first use)",
  "port": "number — local opencode port (default: 4096)",
  "auth": {
    "email": "string — logged-in email",
    "sessionToken": "string — API key",
    "tier": "string — account tier (free, pro, etc.)"
  }
}
```

## Log Files

All logs are stored in `~/.crosscode/`:

| File | Description |
|---|---|
| `crosscode.log` | CLI startup, dependency checks, tunnel events |
| `cloudflared.log` | Cloudflare tunnel output |
| `ngrok.log` | ngrok tunnel output |
| `opencode.log` | `opencode serve` stdout/stderr |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CROSSCODE_WEB_URL` | `https://crosscode.sish.work` | Web dashboard base URL |
| `CROSSCODE_AUTH_URL` | `${CROSSCODE_WEB_URL}/api/auth` | Authentication API URL |
| `CROSSCODE_TUNNEL_WS_URL` | `wss://tunnel.sish.work/ws` | Tunnel server WebSocket URL |

## Prerequisites

| Tool | Required When | Install |
|---|---|---|
| `opencode` | Always | [opencode.ai](https://opencode.ai) |
| `cloudflared` | Free tier / fallback | [Cloudflare docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) |
| `ngrok` | `--ngrok` flag | [ngrok.com](https://ngrok.com/download) |

## Examples

```bash
crosscode                        Start with auto-selected tunnel
crosscode --ngrok                Start with ngrok tunnel
crosscode --cloudflared          Start with Cloudflare tunnel
crosscode login                  Authenticate for paid tier
crosscode status                 Check login status
crosscode logout                 Clear credentials
```
