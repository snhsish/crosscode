# Development

Set up and build the CrossCode monorepo locally.

## Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) >= 9

## Setup

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

## Developing the CLI

```bash
cd packages/crosscode
pnpm dev          # Watch mode
pnpm build        # Build for production
```

## Developing the Mobile App

```bash
cd apps/mobile
pnpm start        # Start Expo dev server
pnpm android      # Run on Android
pnpm ios          # Run on iOS
```

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

See [CONTRIBUTING.md](../CONTRIBUTING.md) for branch naming, commit conventions, and the PR workflow.