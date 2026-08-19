# Features

## Companion CLI (`npx crosscode`)

Run this on your PC (current working directory) to bootstrap the entire connection:

- Starts `opencode serve` automatically
- Opens a Cloudflare Tunnel (no account needed)
- Renders a QR code in your terminal
- Scan from the CrossCode app → connected instantly
- Graceful shutdown on `Ctrl+C`
- Auto-detects missing dependencies and guides installation

## Mobile App

- **QR Connect**: scan and connect in one tap, no copy-pasting URLs
- **Real-time Chat**: prompts from your phone, responses streamed back live with full markdown and code block rendering
- **Inline Diffs**: see exactly what the agent changed before it happens, with expandable side-by-side view
- **Tool Call Approvals**: approve or reject every shell command, file write, or API call before it runs on your PC
- **Session Management**: browse, switch, and create sessions; run multiple sessions simultaneously
- **File Tree Browser**: navigate your project with syntax highlighting and line numbers
- **Push Notifications**: get notified when the agent finishes, needs approval, or hits an error

## What CrossCode is NOT

- **Not a standalone agent** — it requires a running `opencode serve` on a PC or VPS
- **Not a cloud service** — your code never touches CrossCode's servers (there are none)
- **Not paid** — free and open source, MIT licensed, forever