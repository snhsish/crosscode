# CrossCode

An OpenCode Remote Client CLI Tool.

Connect your mobile device to your local `opencode` server instantly — no shared network, no manual port forwarding.

```bash
npx crosscode
```

or, if using `pnpm`:

```bash
pnpm dlx crosscode
```

You can also install globally (though `npx crosscode@latest` is recommended so you always get the latest version):

```bash
npm i -g crosscode
```

Scan the QR code with the [CrossCode mobile app](https://crosscode.site) to connect.

> Requires `opencode` installed. Tunnel provider (`cloudflared` or `ngrok`) required based on tier.

## How It Works

1. CrossCode starts `opencode serve` locally on port `4096`.
2. It creates a secure tunnel (via Cloudflare, ngrok, or CrossCode's own tunnel server) to expose your local opencode instance.
3. A QR code is generated containing the tunnel URL and a session token.
4. Scan the QR with the CrossCode mobile app to connect and start coding remotely.

## Tunnel Providers

| Provider | Flag | Requirement | Notes |
|---|---|---|---|
| CrossCode Tunnel | _(default when logged in with paid tier)_ | Login required | Dedicated tunnel via `tunnel.sish.work` |
| Cloudflare | `--cloudflared` | `cloudflared` installed | Free, auto-generated `trycloudflare.com` URL |
| ngrok | `--ngrok` | `ngrok` installed + auth token | Free tier available, stable URLs |

If no tunnel flag is given and you're not logged in, CrossCode falls back to `cloudflared`.

## Commands

| Command | Description |
|---|---|
| `crosscode` | Start tunnel (auto-selects provider) |
| `crosscode login` | Authenticate with API key (opens browser) |
| `crosscode logout` | Clear saved authentication |
| `crosscode status` | Show login status and tier |
| `crosscode help` | Show help message |

## Flags

| Flag | Description |
|---|---|
| `--cloudflared` | Force Cloudflare tunnel |
| `--ngrok` | Force ngrok tunnel |
| `--help`, `-h` | Show help message |

## Authentication & Login

CrossCode has a free tier and a paid tier:

- **Free tier** — Uses `cloudflared` tunnel. No login required.
- **Paid tier** — Uses CrossCode's dedicated tunnel server (`tunnel.sish.work`). Login required.

### How to Login

```bash
crosscode login
```

1. Browser opens to `https://crosscode.site/login`.
2. Sign up / log in on the dashboard.
3. Copy the API key shown on the dashboard.
4. Paste the API key in the terminal prompt.

Your credentials are saved to `~/.crosscode/config.json`.

### Check Login Status

```bash
crosscode status
```

### Logout

```bash
crosscode logout
```

## Tunnel Selection Logic

When you run `crosscode` with no flags:

1. If logged in with a paid tier → uses **CrossCode Tunnel** (`tunnel.sish.work`).
2. If `--ngrok` is passed → uses **ngrok**.
3. If `--cloudflared` is passed → uses **cloudflared**.
4. Otherwise → falls back to **cloudflared**.

If the CrossCode tunnel fails or times out, it automatically falls back to `cloudflared`.

## Interactive Controls

While the tunnel is running:

| Key | Action |
|---|---|
| `l` | Toggle log viewer (shows last 20 lines from each service) |
| `Ctrl+C` | Shut down tunnel and exit |

## Configuration

Config is stored at `~/.crosscode/config.json`:

```json
{
  "ngrokToken": "your-ngrok-auth-token",
  "port": 4096,
  "auth": {
    "email": "you@example.com",
    "sessionToken": "your-api-key",
    "tier": "pro"
  }
}
```

| Field | Description |
|---|---|
| `ngrokToken` | Saved ngrok auth token (prompted on first `--ngrok` use) |
| `port` | Local port for `opencode serve` (default: `4096`) |
| `auth.email` | Logged-in email |
| `auth.sessionToken` | API key used for authentication |
| `auth.tier` | Account tier (`free`, `pro`, etc.) |

## Logs

All logs are written to `~/.crosscode/`:

| File | Contents |
|---|---|
| `crosscode.log` | CrossCode CLI logs |
| `cloudflared.log` | Cloudflare tunnel logs |
| `ngrok.log` | ngrok tunnel logs |
| `opencode.log` | opencode serve logs |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `CROSSCODE_WEB_URL` | Web dashboard URL | `https://crosscode.site` |
| `CROSSCODE_AUTH_URL` | Auth API URL | `${CROSSCODE_WEB_URL}/api/auth` |
| `CROSSCODE_TUNNEL_WS_URL` | Tunnel WebSocket URL | `wss://tunnel.sish.work/ws` |

## Prerequisites

- **Node.js** >= 20
- **opencode** — [Install](https://opencode.ai)
- **cloudflared** — [Install](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) (for free tier)
- **ngrok** — [Install](https://ngrok.com/download) (optional, for ngrok tunnel)

## Features

- No shared network required between devices
- No manual configuration of ports or IP addresses
- Automatic tunnel fallback (CrossCode tunnel → cloudflared)
- SSE proxy for real-time streaming through Cloudflare
- Session-based authentication with QR code pairing

## License

MIT License
