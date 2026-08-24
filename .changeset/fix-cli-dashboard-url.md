---
"crosscode": patch
---

Fix CLI default dashboard URL so tier validation hits the correct API endpoint. The previous default (`crosscode.sish.work`) 301-redirected to the homepage, causing `Unexpected token '<'` JSON parse errors and a stuck `free` tier.
