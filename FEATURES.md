# CrossCode — FEATURES.md

## Core Philosophy

> Your PC does the work. Your phone is the remote.

CrossCode never runs models on your phone. It connects to your existing `opencode serve` instance and gives you full control from anywhere — mobile data, different WiFi, across the world.

---

## Companion CLI

### `npx crosscode`
Zero-install bootstrap. Run this on your PC to start everything.

- Starts `opencode serve` automatically
- Starts a Cloudflare Tunnel (no account needed)
- Parses the tunnel URL and encodes it as a base64 JSON payload
- Renders a QR code directly in your terminal
- Scan from CrossCode app → connected instantly
- Graceful shutdown on `Ctrl+C`
- Auto-detects missing dependencies (`opencode`, `cloudflared`) and guides installation

---

## Mobile App

### QR Connect
Scan the QR from your terminal and connect in one tap. No copy-pasting URLs. No manual config. Works over mobile data, any network.

### Real-time Streaming Chat
Prompts sent from your phone, responses streamed back live. Feels like using opencode on your PC — just on a 6-inch screen. Full markdown and code block rendering with syntax highlighting.

### Inline Diffs
See exactly what the agent changed on your PC — before it happens. Green for additions, red for deletions. Tap to expand a side-by-side view for careful review.

### Tool Call Approvals
Every shell command, file write, or API call the agent wants to make shows up on your phone first. You approve or reject. The agent waits. Nothing happens on your PC without your say-so.

### Preview Deployments
Tell the agent to spin up a test environment. CrossCode tunnels the preview port and shows you a live URL. Tap "Open Preview" to test your deployment in the in-app browser — directly on your phone. Build logs stream in real-time. Stop or restart the preview without touching your PC.

### Session Management
Browse all your active and past opencode sessions. Switch between them, start new ones, pick up where you left off. Running a frontend and backend session simultaneously? Both visible, both controllable.

### File Tree Browser
Navigate your project's file tree from your phone. Open any file with syntax highlighting and line numbers. It's a read-only window into your codebase — useful for reviewing what the agent is looking at.

### Push Notifications
Get notified when:
- The agent finishes a task
- A tool approval is waiting for you
- The agent hits an error and needs guidance

Tap the notification to deep-link directly into the session.

### Git Panel
See the current branch, staged files, and recent commits. Useful for keeping track of what the agent has committed during a long session.

### Log Streaming
Raw terminal output from your opencode session, streamed to your phone. Useful when watching a deployment run or debugging a failing command.

### Voice Input
Speak your prompt instead of typing. Useful when you're away from a desk and don't want to peck at a keyboard.

### Quick Prompts
Save frequently used prompts as templates. One tap to fire them. Example: "Run tests and fix any failures", "Summarize what you've done so far", "Commit with a conventional commit message".

### Snapshot / Rollback
One tap to send `/undo` to the agent — reverts the last changeset on your PC. No need to open a terminal.

### Session Sharing
Generate a shareable link to the current session for team collab or debugging with a colleague.

### Multi-Server
Save multiple opencode connections — your PC, your VPS, a teammate's machine. Switch between them from the app.

### Biometric Lock
Face ID or fingerprint required to open the app and optionally before sending each prompt. Nothing leaves your phone without confirmation.

### Themes
Ships with the themes you already use:
- Catppuccin Mocha
- Dracula
- Tokyo Night
- Nord
- Gruvbox Dark

### Android Home Screen Widget
Glanceable widget showing current session name, agent status (idle / running / waiting for approval), and a quick-approve button.

---

## What CrossCode is NOT

- Not a standalone agent — it requires a running `opencode serve` on a PC or VPS
- Not a cloud service — your code never touches CrossCode's servers (there are none)
- Not paid — free and open source, MIT licensed, forever