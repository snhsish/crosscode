---
"crosscode": patch
---

Stabilize the CLI session identity and tunnel URLs so a returning mobile client (e.g. after the PC sleeps or the network drops) can always reconnect instead of being stranded by a freshly generated QR/URL.

- Persist `sessionToken` (opencode password + QR token) and `projectId` in `~/.crosscode/config.json` so they stay constant across CLI restarts. This makes the managed tunnel URL (`connect.crosscode.site/t/<projectId>`) and the QR token stable.
- For free, unauthenticated users, use a persistent **named cloudflared tunnel** (`crosscode-<projectId>`) which keeps a fixed `*.cfargotunnel.com` hostname across restarts and reconnects. Falls back to the ephemeral quick tunnel (URL still changes on restart) when `cloudflared tunnel login` hasn't been run.
- Print the QR code exactly once per identity; tunnel reconnects no longer regenerate it.
- Auto-restart a dropped named cloudflared tunnel without changing its URL.
