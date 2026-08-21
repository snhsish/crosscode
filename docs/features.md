# Features

## Companion CLI (`npx crosscode`)

Run this on your PC (current working directory) to bootstrap the entire connection:

- Starts `opencode serve` automatically
- Opens a Cloudflare Tunnel (no account needed), or ngrok with `--ngrok`
- Renders a QR code in your terminal
- Scan from the CrossCode app → connected instantly
- Graceful shutdown on `Ctrl+C`
- Auto-detects missing dependencies and guides installation
- `login` / `logout` / `status` commands for account and API key management
- Paid-tier users get the dedicated CrossCode tunnel automatically (falls back to Cloudflare)

## Mobile App

- **QR Connect**: scan and connect in one tap, no copy-pasting URLs (gallery import supported)
- **Real-time Chat**: prompts from your phone, responses streamed back live with full markdown and syntax-highlighted code blocks; stop streaming mid-response
- **Inline Diffs**: see exactly what the agent changed, per message and per session, with line numbers
- **Tool Call Approvals**: approve or reject every shell command, file write, or API call before it runs on your PC
- **Session Management**: browse, switch, and create sessions; select projects; pick default models
- **Git Panel**: commit graph, branches, and recent commits for your project
- **Voice Input**: dictate prompts with on-device speech recognition
- **Quick Prompts**: saved templates you can fire with one tap (presets + custom)
- **Push Notifications**: get notified when the agent finishes, needs approval, or hits an error — deep links straight into the session
- **Session Sharing**: generate a shareable link to any session
- **Rollback**: revert to any previous message snapshot with one tap
- **Multi-Connection**: save and switch between multiple PCs/servers

## Accounts & Billing

- Email OTP login via the dashboard, QR-based device linking from the CLI
- Free tier: Cloudflare/ngrok tunnels, no account needed
- Paid tiers (Starter / Builder): dedicated low-latency tunnels with stable subdomain URLs
- Upgrade and manage billing from the web portal or the mobile app

## What CrossCode is NOT

- **Not a standalone agent** — it requires a running `opencode serve` on a PC or VPS
- **Not a cloud service for your code** — your code never leaves your machines; servers only relay traffic
- **Open source** — MIT licensed
