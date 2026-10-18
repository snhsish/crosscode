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

1. Opens browser to `https://crosscode.site/login`
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
| `--no-open` | Don't auto-open the connection page in a browser |
| `--no-qr` | Skip QR graphic, print URL only (useful when piping output) |
| `--small-qr` | Compact QR graphic with smaller quiet zone (same scannable full-cell rendering) |
| `--help`, `-h` | Show help message |

## Connection Page

When the tunnel is ready, CrossCode starts a local-only page at
`http://127.0.0.1:<port>/` and opens it in your browser. The page shows a
scannable QR code (with a download button), the tunnel URL, and the auth token
(hidden by default, with copy buttons). You can close the browser tab once your
app is connected — keep the terminal running.

The page is bound to loopback only, so the auth token is never reachable through
the tunnel. In headless environments (SSH, Docker, `--no-open`, or when no
browser is available) CrossCode prints the QR code in the terminal instead.

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
  "opencodeBin": "string — opencode executable to run, e.g. \"opencode-v2\" (default: \"opencode\")",
  "auth": {
    "email": "string — logged-in email",
    "sessionToken": "string — API key",
    "tier": "string — account tier (free, pro, etc.)"
  }
}
```

Set `"opencodeBin": "opencode-v2"` if v2 lives under a different command on
your machine. Crosscode detects the server version from `$bin --version` and
uses the matching flags and API paths automatically.

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
| `CROSSCODE_OPENCODE_BIN` | `opencode` | Opencode executable to run (overrides `opencodeBin` in config) |
| `CROSSCODE_WEB_URL` | `https://crosscode.site` | Web dashboard base URL |
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
