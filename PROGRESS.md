# CrossCode — Progress

_Last updated: Jul 10, 2026_

## Companion CLI

- [x] Spawn `opencode serve` + `cloudflared tunnel`
- [x] Parse tunnel URL, render QR code
- [x] Keypress handlers, graceful shutdown
- [x] Dependency auto-detection

## Shared Package

- [x] QR payload encode/decode (custom Base64)
- [x] Shared TypeScript types

## Mobile App

- [x] QR scanner + connection flow
- [x] Health-check, save/switch connections
- [x] API client layer (projects, sessions, messages, agents)
- [x] Zustand stores (7 stores, AsyncStorage persistence)
- [x] Navigation (Expo Router, 3-tab + stack screens)
- [x] UI kit (13 components)
- [x] Chat UI (markdown, agent selector, input, typing indicator)
- [x] Polling-based streaming
- [x] Light/dark theme
- [ ] True SSE streaming (blocked by Cloudflare buffering)
- [ ] Inline diffs / diff view
- [ ] Tool call approvals UI
- [ ] Preview deployments
- [ ] Push notifications
- [ ] Biometric lock
- [ ] Voice input
- [ ] Quick prompts / templates
- [ ] File tree browser
- [ ] Git panel
- [ ] Log streaming
- [ ] Session sharing
- [ ] Snapshot / rollback
- [ ] Additional themes (Catppuccin, Dracula, etc.)
- [ ] Android widget
- [ ] Model picker wired in chat

## Web App

- [ ] Placeholder only — not started

## Release

- [ ] Publish to npm
- [ ] Play Store open testing
- [ ] App Store release

---

## Overall

| Area | Status |
|------|--------|
| Companion CLI | ✅ Done |
| Shared package | ✅ Done |
| Mobile app | 🟡 Mostly done (14/24 items pending) |
| Web app | ❌ Not started |
| Release | ❌ Not started |

