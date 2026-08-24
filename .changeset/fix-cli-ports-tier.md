---
"crosscode": patch
---

Fix CLI crashing with `EADDRINUSE` when running multiple instances (different directories or terminals) by allocating free local ports dynamically instead of hardcoding 4096/4097. Also refresh the cached tier from the server on every run and on `crosscode status`, so an upgraded plan is reflected without re-logging-in.
