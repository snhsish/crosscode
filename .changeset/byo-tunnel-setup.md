---
"crosscode": minor
---

BYO tunnel setup: logged-out `crosscode` now asks which tunnel to use (CrossCode dedicated, Cloudflared named/quick, ngrok) with live installed/not-found status, configures everything in-CLI, and can remember the choice for instant quick starts. Also removes the `l`/`h` keypress overlay, masks emails in terminal output, adds a Pro upsell for free/BYO runs, and keeps polling the ngrok API until a public URL appears
