# CrossCode

CrossCode is a free, open-source mobile client for [OpenCode](https://opencode.ai) - the terminal AI coding agent. It lets you control your PC's OpenCode instance from your phone, anywhere in the world, with no shared network required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/crosscode)](https://www.npmjs.com/package/crosscode)
[![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

## What is CrossCode?

CrossCode connects your phone to a running `opencode serve` instance on your PC or VPS through a Cloudflare Tunnel. Your code never touches CrossCode's servers - there are none. Everything runs locally on your machine.

- **Zero config**: `npx crosscode` starts everything and shows a QR code
- **Scan to connect**: open the app, scan the QR, you're in
- **Works anywhere**: mobile data, different WiFi, across the world
- **Full control**: chat, approve tool calls, review diffs, manage sessions

## Features

### Companion CLI (`npx crosscode`)

Run this on your PC (current working directory) to bootstrap the entire connection:

- Starts `opencode serve` automatically
- Opens a Cloudflare Tunnel (no account needed)
- Renders a QR code in your terminal
- Scan from the CrossCode app → connected instantly
- Graceful shutdown on `Ctrl+C`
- Auto-detects missing dependencies and guides installation

### Mobile App

- **QR Connect**: scan and connect in one tap, no copy-pasting URLs
- **Real-time Chat**: prompts from your phone, responses streamed back live with full markdown and code block rendering
- **Inline Diffs**: see exactly what the agent changed before it happens, with expandable side-by-side view
- **Tool Call Approvals**: approve or reject every shell command, file write, or API call before it runs on your PC
- **Session Management**: browse, switch, and create sessions; run multiple sessions simultaneously
- **File Tree Browser**: navigate your project with syntax highlighting and line numbers
- **Push Notifications**: get notified when the agent finishes, needs approval, or hits an error

## Quick Start

### 1. Install prerequisites

Make sure you have [OpenCode](https://opencode.ai) and [Cloudflare tunnel](https://developers.cloudflare.com/tunnel) installed on your PC:

```bash
# Install opencode and cloudflared (if not already installed)
# See https://opencode.ai and https://developers.cloudflare.com/tunnel for installation instructions
```

### 2. Start the companion CLI

```bash
npx crosscode
```

This will:
1. Start `opencode serve` on your PC
2. Open a Cloudflare Tunnel
3. Display a QR code in your terminal

### 3. Connect from your phone

1. Install the CrossCode app (iOS / Android)
2. Open the app and scan the QR code
3. You're connected: start chatting with your AI agent

## Monorepo Structure

```
crosscode/
├── apps/
│   ├── mobile/          # React Native + Expo (iOS + Android)
│   └── web/             # Website
├── packages/
│   ├── crosscode/       # Companion CLI: `npx crosscode`
│   └── shared/          # Shared types, constants, QR payload schema
└── README.md
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) >= 9

### Setup

```bash
# Clone the repo
git clone https://github.com/snhsish/crosscode.git
cd crosscode

# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Build everything
pnpm build

# Run linter
pnpm lint
```

### Developing the CLI

```bash
cd packages/crosscode
pnpm dev          # Watch mode
pnpm build        # Build for production
```

### Developing the Mobile App

```bash
cd apps/mobile
pnpm start        # Start Expo dev server
pnpm android      # Run on Android
pnpm ios          # Run on iOS
```

## What CrossCode is NOT

- **Not a standalone agent** — it requires a running `opencode serve` on a PC or VPS
- **Not a cloud service** — your code never touches CrossCode's servers (there are none)
- **Not paid** — free and open source, MIT licensed, forever

## Tech Stack

| Layer | Choice |
|---|---|
| Mobile | React Native + Expo |
| Navigation | Expo Router |
| State | Zustand |
| Styling | NativeWind (Tailwind) |
| Companion CLI | Node.js |
| Tunnel | Cloudflare Tunnel |
| Monorepo | pnpm workspaces + Turborepo |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

CrossCode is licensed under the [MIT License](LICENSE).
