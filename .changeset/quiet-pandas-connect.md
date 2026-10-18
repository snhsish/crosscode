---
"crosscode": minor
---

Add a browser-based connection page shown by default when the tunnel is ready.
The local-only page (`http://127.0.0.1:<port>/`) displays a scannable QR code
with a download button, the tunnel URL, and the auth token with copy buttons,
so the QR is no longer limited to the terminal. The terminal QR remains as a
fallback for headless environments and via the new `--no-open` flag.
