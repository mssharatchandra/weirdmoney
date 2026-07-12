---
description: WYRD — the internet's weird money. Skills to hunt the weirdest live Polymarket bets (via the WYRD Cloudflare gateway, which bypasses the India block), write them in WYRD's voice, post to X, and broadcast to Telegram subscribers.
---

# WYRD skill group

Read `SOUL.md` (voice) and `memepool.md` (formats) in this folder before writing
any post. They are the product. The number does the comedy; weird ≠ dark.

Config (set once in `~/.hermes/.env` or export before running):
- `WYRD_GATEWAY_URL`  — deployed CF worker, e.g. https://wyrd-gateway.<you>.workers.dev
- `WYRD_CONVEX_URL`   — Convex HTTP domain, e.g. https://<dep>.convex.site
- `TELEGRAM_BOT_TOKEN` — for broadcasting drops to subscribers

Skills: `wyrd-hunt` (find + write), `wyrd-post` (publish + broadcast), `wyrd-answer` (reply to Telegram questions).
