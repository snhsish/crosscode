# crosscode

## 0.6.9

### Patch Changes

- 89d4fa0: fix(cli): use ensureProjectId for tunnel project id

## 0.6.8

### Patch Changes

- 2edd218: fix(cli): use ensureProjectId for tunnel project id

## 0.6.7

### Patch Changes

- For un-versioned PRs

## 0.6.6

### Patch Changes

- 7d36707: Stabilize the CLI session identity and tunnel URLs so a returning mobile client (e.g. after the PC sleeps or the network drops) can always reconnect instead of being stranded by a freshly generated QR/URL.

  - Persist `sessionToken` (opencode password + QR token) and `projectId` in `~/.crosscode/config.json` so they stay constant across CLI restarts. This makes the managed tunnel URL (`connect.crosscode.site/t/<projectId>`) and the QR token stable.
  - For free, unauthenticated users, use a persistent **named cloudflared tunnel** (`crosscode-<projectId>`) which keeps a fixed `*.cfargotunnel.com` hostname across restarts and reconnects. Falls back to the ephemeral quick tunnel (URL still changes on restart) when `cloudflared tunnel login` hasn't been run.
  - Print the QR code exactly once per identity; tunnel reconnects no longer regenerate it.
  - Auto-restart a dropped named cloudflared tunnel without changing its URL.

## 0.6.5

### Patch Changes

- 8b574ee: Stabilize the CLI session identity and tunnel URLs so a returning mobile client (e.g. after the PC sleeps or the network drops) can always reconnect instead of being stranded by a freshly generated QR/URL.

  - Persist `sessionToken` (opencode password + QR token) and `projectId` in `~/.crosscode/config.json` so they stay constant across CLI restarts. This makes the managed tunnel URL (`connect.crosscode.site/t/<projectId>`) and the QR token stable.
  - For free, unauthenticated users, use a persistent **named cloudflared tunnel** (`crosscode-<projectId>`) which keeps a fixed `*.cfargotunnel.com` hostname across restarts and reconnects. Falls back to the ephemeral quick tunnel (URL still changes on restart) when `cloudflared tunnel login` hasn't been run.
  - Print the QR code exactly once per identity; tunnel reconnects no longer regenerate it.
  - Auto-restart a dropped named cloudflared tunnel without changing its URL.

- CLI: edge cases for Windows

## 0.6.4

### Patch Changes

- Fix Windows dependency detection (false "opencode not found") and add free-tier login tip

## 0.6.3

### Patch Changes

- 7623a1b: Fix CLI default dashboard URL so tier validation hits the correct API endpoint. The previous default (`crosscode.sish.work`) 301-redirected to the homepage, causing `Unexpected token '<'` JSON parse errors and a stuck `free` tier.

## 0.6.2

### Patch Changes

- 7da8c01: Fix CLI crashing with `EADDRINUSE` when running multiple instances (different directories or terminals) by allocating free local ports dynamically instead of hardcoding 4096/4097. Also refresh the cached tier from the server on every run and on `crosscode status`, so an upgraded plan is reflected without re-logging-in.

## 0.6.1

### Patch Changes

- Fix CLI proxy stripping query strings from requests proxied to opencode

  `sanitizeUrlPath` removed everything after `?`, so requests like `GET /file?path=.` arrived at opencode without their params and failed with 400 "Missing key path" schema rejections. This also silently broke message pagination (`?limit=&offset=`) and file search. Query strings are now preserved while path sanitization (traversal and `@` checks) is retained.

## 0.6.0

### Minor Changes

- b6750ef: feat(cli): add git-log and git-commit endpoints for mobile git graph

## 0.5.0

### Minor Changes

- feat: git graph

## 0.4.1

### Patch Changes

- e592f25: fix(crosscode): add shutdown source logging

## 0.4.0

### Minor Changes

- e528a93: Add configurable tunnel WS URL via config.json

## 0.3.8

### Patch Changes

- be6374a: fix: pass --port to opencode serve to ensure correct port binding

## 0.3.7

### Patch Changes

- 2edfb99: Add direct test to opencode and 401 response logging

## 0.3.6

### Patch Changes

- cf9d379: Add detailed header forwarding logs for debugging

## 0.3.5

### Patch Changes

- 2ee5f00: chore: add session token logging to debug auth mismatch

## 0.3.4

### Patch Changes

- efd7fbf: chore: add enhanced logging to debug Authorization header flow

## 0.3.3

### Patch Changes

- 5272927: fix: convert Authorization header to Basic Auth format for opencode

## 0.3.2

### Patch Changes

- ab4d4b9: chore: add debug logging to trace Authorization header flow

## 0.3.1

### Patch Changes

- 5ddbc37: ---

## 0.3.0

### Minor Changes

- aaf4e04: add: help menu

## 0.2.0

### Minor Changes

- 02e7aed: custom tunnel fixes

### Patch Changes

- fix opencode spawning

## 0.2.0-beta.1

### Minor Changes

- custom tunnel fixes

## 1.0.0

### Major Changes

- Added comprehensive CLI documentation with all flags, login flow, tunnel providers, config reference, and created docs/cli.md
