# CrossCode — PLAN.md

## What is CrossCode?

CrossCode is a free, open-source mobile client for [OpenCode](https://opencode.ai) — the terminal AI coding agent. It lets you control your PC's OpenCode instance from your phone, anywhere in the world, with no shared network required.

Your PC does all the work. Your phone is just the remote.

---

## Monorepo Structure

```
crosscode/
├── apps/
│   ├── mobile/          # React Native + Expo (iOS + Android)
│   └── companion/       # Node.js CLI — `npx crosscode`
├── packages/
│   └── shared/          # Shared types, constants, QR payload schema
├── PLAN.md
├── FEATURES.md
└── README.md
```

---

## Phases

### Phase 1 — Companion CLI (`npx crosscode`)
The CLI that runs on your PC and bootstraps everything.

- [ ] Spawn `opencode serve` as a child process
- [ ] Spawn `cloudflared tunnel --url http://localhost:4096`
- [ ] Parse tunnel URL from cloudflared stderr output
- [ ] Encode connection payload as base64 JSON
- [ ] Render QR code in terminal via `qrcode-terminal`
- [ ] Keep both processes alive, forward logs to terminal
- [ ] Graceful shutdown on `Ctrl+C` (kills both child processes)
- [ ] Auto-detect if `opencode` and `cloudflared` are installed, prompt to install if not

**Connection payload schema:**
```json
{
  "url": "https://abc-xyz.trycloudflare.com",
  "v": 1
}
```

**Usage:**
```bash
npx crosscode
# or
npm install -g crosscode && crosscode
```

---

### Phase 2 — Mobile App (React Native + Expo)

#### 2a — Connection & Onboarding
- [ ] QR code scanner on launch
- [ ] Decode base64 payload, extract URL
- [ ] Test connection to opencode serve
- [ ] Save connection (AsyncStorage)
- [ ] Manual URL entry fallback
- [ ] Multi-server support (save multiple connections)

#### 2b — Core Chat
- [ ] Connect to `opencode serve` HTTP API
- [ ] Real-time streaming responses (SSE)
- [ ] Markdown rendering in chat
- [ ] Code blocks with syntax highlighting
- [ ] Send prompts, receive streamed responses
- [ ] Session list — browse and switch sessions
- [ ] Create new session, select project

#### 2c — Diffs & File Review
- [ ] Inline diff view (green adds, red deletes)
- [ ] Side-by-side diff toggle
- [ ] File tree browser
- [ ] File viewer with syntax highlighting and line numbers

#### 2d — Tool Call Approvals
- [ ] Intercept tool calls (shell commands, file writes, API calls)
- [ ] Display tool call details clearly
- [ ] Approve / Reject buttons
- [ ] Agent waits for response

#### 2e — Preview Deployments
- [ ] Companion CLI spins up a Docker Compose test stack on PC
- [ ] Tunnels the preview port via Cloudflare
- [ ] App shows Preview tab with status (building / ready / failed)
- [ ] "Open Preview" button launches URL in in-app browser
- [ ] Build logs streamed to app in real-time
- [ ] Stop/restart preview from app

#### 2f — Push Notifications
- [ ] Companion plugin registers with Expo push service
- [ ] Notify on: session complete, tool approval needed, agent errored
- [ ] Deep link from notification into the relevant session

#### 2g — Polish
- [ ] Biometric lock (Face ID / fingerprint)
- [ ] Theme support — Catppuccin, Dracula, Tokyo Night, Nord, Gruvbox
- [ ] Voice input (speak your prompt)
- [ ] Quick prompts — saved templates, one-tap fire
- [ ] Android home screen widget (session status)
- [ ] Git panel — branch, staged files, recent commits
- [ ] Log streaming view (raw terminal output)
- [ ] Session sharing — generate shareable link
- [ ] Snapshot/rollback — one tap `/undo`

---

### Phase 3 — Release
- [ ] Publish `crosscode` to npm
- [ ] Publish mobile app to Google Play (open testing)
- [ ] Publish mobile app to App Store
- [ ] GitHub repo with MIT license
- [ ] README with setup GIF
- [ ] awesome-opencode submission

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile | React Native + Expo | iOS + Android from one codebase |
| Navigation | Expo Router | File-based, familiar |
| State | Zustand | Lightweight, no boilerplate |
| Styling | NativeWind (Tailwind) | Fast, consistent |
| QR Scanner | expo-camera + expo-barcode-scanner | Native, reliable |
| Notifications | Expo Notifications | Cross-platform push |
| Companion CLI | Node.js | `npx`-able, no install friction |
| Tunnel | Cloudflare Tunnel (free) | No account needed for quick tunnels |
| Monorepo | pnpm workspaces | Fast, simple |

---

## OpenCode Server API

CrossCode communicates with `opencode serve` via its HTTP API:

- `GET /session` — list sessions
- `POST /session` — create session
- `GET /session/:id/message` — SSE stream for messages
- `POST /session/:id/message` — send prompt
- `POST /session/:id/tool/:toolId/response` — approve/reject tool call

*(Verify against opencode docs as API stabilizes)*

---

## Non-Goals (v1)

- Running models on the phone
- Being a standalone agent (CrossCode is always a remote for a PC instance)
- Web dashboard (mobile only for now)