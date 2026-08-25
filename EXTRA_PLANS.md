# EXTRA_PLANS.md — CrossCode Feature Roadmap (Beyond PLAN.md)

This document captures product ideas that sit **outside** the current
[PLAN.md](../PLAN.md) and would meaningfully improve the CrossCode experience.
PLAN.md covers the core build (CLI, mobile chat, diffs, tool approvals, auth/tunnel
tiers, payments, release). Everything below is additive and assumes PLAN.md's
checked items ship first.

Priorities: **P0** = core gap, ship early · **P1** = high value, low/medium effort ·
**P2** = expansion bet.

---

## Cross-Cutting Pre-Conditions

Before most features below, two structural issues from the current code should be
addressed (they block clean implementation):

1. **No centralized OpenCode API client.** `packages/crosscode` is types-only;
   endpoints are scattered across 10+ `lib/*.ts` files and two screens. Extract a
   small `lib/opencode-client.ts` (fetch + SSE wrappers) so new features don't
   duplicate transport logic.
2. **Custom endpoints live only in the CLI proxy.** `/mobile-event` and `/git-*`
   are injected by `packages/crosscode/src/cli.ts`'s local proxy and are **absent
   on the `--ngrok` path** (which tunnels `opencode serve` directly). Any new
   file/search/export endpoint must be added to the proxy and feature-detected on
   the mobile side (like git via `X-Crosscode-Git`), or ngrok users hit silent gaps.

---

## A. Reliability & Connection Experience

### A1. Offline / Cached History — `P0`
- **What:** Persist sessions, messages, diffs, and git data in the existing
  Zustand + AsyncStorage stores so users can review past work without an active
  tunnel. Wire into `useTunnelStats` and `event-stream` reconnect logic.
- **Why useful:** Phones drop cellular/WiFi constantly; reviewing what the agent
  changed is the #1 use case when away from the PC. Today every screen is live-only
  and blanks out on disconnect.
- **Stack:** `apps/mobile` (stores + `event-stream.ts`).
- **Depends on:** central API client (pre-condition 1).

### A2. Connection-Quality & Latency Badge — `P1`
- **What:** Live RTT (already polled via tunnel `/health`), a reconnect countdown,
  and the active tunnel type (cloudflared / CrossCode / ngrok) shown per connection
  instead of silent spinners.
- **Why useful:** Makes flaky connections legible and reduces "is it broken?"
  support load.
- **Stack:** `apps/mobile` (`useTunnelStats.ts`, `(tabs)/index.tsx`).

### A3. Auto-Respawn `opencode serve` — `P1` (CLI)
- **What:** A watchdog in `cli.ts` that restarts the `opencode serve` child process
  and re-establishes the tunnel if it crashes.
- **Why useful:** "I left the house and it died" is a core reliability gap — the PC
  process is a single point of failure with no recovery today.
- **Stack:** `packages/crosscode/src/cli.ts`.

### A4. Encrypted Secret Storage — `P1`
- **What:** Move the API key and ngrok token out of plaintext
  `~/.crosscode/config.json` into the OS keychain (Node `keytar` or platform
  secretstore).
- **Why useful:** Security and trust win; currently credentials are stored in cleartext.
- **Stack:** `packages/crosscode` (config loader).

---

## B. Chat Productivity

### B1. Edit & Resend / Regenerate — `P0`
- **What:** Long-press a sent message to edit-and-resend, or regenerate the agent's
  reply. Uses existing `POST /session/:id/message` + `/abort`.
- **Why useful:** No way to fix a typo without retyping the whole prompt today.
- **Stack:** `apps/mobile` (chat screen + `messages` store).

### B2. Token Usage & Cost Dashboard — `P1`
- **What:** Per-session token counts, latency, and model cost estimates surfaced in
  the existing `OpencodeStatsCard` (currently thin).
- **Why useful:** Users on paid tiers want to see what they're spending per task.
- **Stack:** `apps/mobile` (stats card + session stats).

### B3. Multi-Model Compare — `P2`
- **What:** Send the same prompt to two models side-by-side.
- **Why useful:** Easy A/B of model quality without leaving the phone.
- **Stack:** `apps/mobile` (model picker + message store).

### B4. TTS Voice Output — `P1`
- **What:** Read streamed responses aloud via `expo-speech` (STT already exists in
  `use-voice-input.ts`).
- **Why useful:** Hands-free review while commuting.
- **Stack:** `apps/mobile` (chat input / message item).

### B5. Selective Step Regeneration — `P2`
- **What:** Rerun a single failed tool call from the phone.
- **Why useful:** Recover from one bad step without restarting the session.
- **Stack:** `apps/mobile` + OpenCode tool API.

---

## C. Code Review & Files

### C1. File-Tree Browser + File Viewer — `P0`
- **What:** Browse the project tree and open files with syntax highlighting. Add a
  new proxy route (e.g. `GET /fs/*`) in `cli.ts` alongside the existing `/git-*`
  handlers, feature-detected on mobile.
- **Why useful:** Directly enables "what did the agent touch / what's in this file"
  review without the laptop. (Listed in PLAN 2c but never started.)
- **Stack:** `packages/crosscode` (proxy) + `apps/mobile` (new `files` screen).
- **Depends on:** pre-condition 2.

### C2. Side-by-Side Diff — `P1`
- **What:** Toggle inline ↔ split view in the existing `diff.tsx`.
- **Why useful:** Large refactors are far easier to read split. (In PLAN 2c.)
- **Stack:** `apps/mobile` (`lib/diff.ts`, `diff.tsx`).

### C3. Apply/Send File Edits From Phone — `P2`
- **What:** Minor edits typed on the phone pushed as a file-write tool response;
  closes the review-and-commit loop without the laptop.
- **Why useful:** Small fixes from anywhere.
- **Stack:** `apps/mobile` + OpenCode tool API.

---

## D. Sessions & Knowledge

### D1. Global Search Across Sessions — `P1`
- **What:** Search box querying all sessions on a connection (server-side
  `/session/:id/message` is already paginated). Today search is per-session only.
- **Why useful:** Finding "that fix from last week" across dozens of sessions.
- **Stack:** `apps/mobile` (sessions store + search UI).

### D2. Session Export — `P1`
- **What:** Export a session as Markdown/JSON for pasting into issues/PRs.
  Complements the existing share link (which requires a live tunnel).
- **Why useful:** Offline, portable record of agent work.
- **Stack:** `apps/mobile` (share modal extension).

### D3. Activity Timeline Across Sessions — `P2`
- **What:** Chronological feed of agent actions/commits for a connection —
  "what did my agents do today."
- **Why useful:** At-a-glance oversight of multiple autonomous runs.
- **Stack:** `apps/mobile` + git/event data.

### D4. Per-Connection Profiles — `P1`
- **What:** Different default model/agent/quick-prompts per saved server (the
  multi-connection store already exists).
- **Why useful:** Different machines/projects want different defaults.
- **Stack:** `apps/mobile` (connection store).

---

## E. Platform Expansion

### E1. Web Client — `P2` (reconsiders a v1 Non-Goal)
- **What:** A lightweight read-only/basic-chat web client (browser/desktop)
  reusing the tunnel + `/mobile-event` SSE shim.
- **Why useful:** Many users want laptop-without-terminal access. PLAN.md lists
  "web chat interface" as a Non-Goal for v1 — this is a deliberate reconsideration.
- **Stack:** `apps/web` (new chat route reusing tunnel-server proxy).

### E2. Tablet / iPad Split Layout — `P1`
- **What:** Two-pane (sessions | chat) via Expo Router responsive layout.
- **Why useful:** Cheap win given current components; much better on large screens.
- **Stack:** `apps/mobile` (Expo Router layouts).

### E3. Watch Approval — `P2`
- **What:** Apple Watch / WearOS quick approve/reject for tool calls + completion
  pings.
- **Why useful:** Highest "wow" for the core safety feature — approve a shell
  command from your wrist.
- **Stack:** Native watch modules + Expo push.

### E4. Android Home-Screen Widget — `P1` (in PLAN 2g)
- **What:** Session status / quick "open" glance widget.
- **Why useful:** One-tap return to an active session.
- **Stack:** `apps/mobile` (native widget module).

---

## F. Account / CLI / Tunnel Polish

### F1. Native In-App Payments — `P1` (in PLAN 3c)
- **What:** Replace "opens browser" with an in-app checkout (Dodo mobile SDK /
  `expo-in-app-purchases`).
- **Why useful:** Frictionless upgrade inside the app.
- **Stack:** `apps/mobile` + `packages/shared/plans.ts`.

### F2. `past_due` Grace Handling — `P1` (in PLAN 3c)
- **What:** Soft-degrade paid tunnels instead of hard cut-off; notify in app.
- **Why useful:** Avoids angry churn on a failed card swipe.
- **Stack:** `packages/tunnel-server` (tier logic) + `apps/web` (webhook).

### F3. Self-Hostable Tunnel for Free/Community — `P2`
- **What:** `crosscode --tunnel-url wss://my.server/ws` points the CLI at a
  user-run `packages/tunnel-server`.
- **Why useful:** Expands the self-host story beyond the paid tier.
- **Stack:** `packages/crosscode` (tunnel-client) + `packages/tunnel-server`.

### F4. CLI Self-Update — `P2`
- **What:** `crosscode update` (npm dist-tag check) since `npx` isn't always fresh.
- **Why useful:** Keeps the PC side current without manual steps.
- **Stack:** `packages/crosscode`.

### F5. Extra Themes — `P1` (in PLAN 2g)
- **What:** Catppuccin / Dracula / Tokyo Night / Nord palettes (theme system exists,
  light/dark only today).
- **Why useful:** Personalization; cheap config addition.
- **Stack:** `apps/mobile` (theme config).

### F6. Biometric Lock — `P1` (in PLAN 2g)
- **What:** Add `expo-local-authentication` (currently a missing dependency) to gate
  app open / sensitive actions.
- **Why useful:** Protects agent access on a lost phone.
- **Stack:** `apps/mobile` (add dependency + settings gate).

---

## Suggested Sequencing

- **Quick wins (reuse existing stores/components, low risk):**
  A2, B4, C2, D2, D4, E2, F5, F6
- **High-value core (fills real gaps):**
  A1, A3, A4, B1, C1, D1
- **Expansion bets:**
  E1, E3, B3, C3, F3, F4

## Open Questions for Maintainers
1. Is reconsidering the web-client Non-Goal (E1) acceptable for v2?
2. Should ngrok users be nudged toward the proxy path so custom endpoints work,
   or is feature-detected degradation acceptable?
3. Priority call: reliability cluster (A) vs. chat-productivity cluster (B) first?
