# WYRD — Vercel go-live runbook

The web product now ships as one standard Next.js application from `landing/`:

```
Vercel /api/weird ─► Hermes wyrd-hunt ─► X @wrydmoney
          │                  └──────────► Telegram subscribers
          └─ /dashboard

Vercel /join ─► /api/signups ─► Convex ◄─ Telegram /start + Hermes post log
```

## Public routes

- `/` — pre-launch landing page
- `/dashboard` — live Weird Index
- `/join` — email signup
- `/telegram` — public redirect to the Telegram bot
- `/x` — public redirect to @wrydmoney
- `/api/weird` — scored, safety-filtered Polymarket gateway
- `/api/signups` — signup proxy to Convex
- `/api/telegram` — narrow Telegram webhook for public `/start` + safe lookups

## 1. Convex login and deployment

From the repository root:

```bash
npm install
npx convex dev --once
npx convex deploy
```

The first command that needs authentication opens a browser/device login. After
deployment, copy the HTTP Actions URL ending in `.convex.site`; this is
`WYRD_CONVEX_URL`.

## 2. Vercel login and deployment

From `landing/`:

```bash
npx vercel login
npx vercel --prod
```

Set the Vercel project root to `landing` when importing the GitHub repository, or
deploy directly while inside `landing/`.

Production environment variables:

```text
WYRD_CONVEX_URL=https://<deployment>.convex.site
WYRD_TELEGRAM_URL=https://t.me/<bot_username>
WYRD_X_URL=https://x.com/wrydmoney
```

No Polymarket key is required. The public Gamma API is read-only.

## 3. Telegram

1. Create the bot through `@BotFather` using `/newbot`.
2. Save the token in `~/.hermes/.env` for outbound broadcasts and as a sensitive
   Vercel variable for the narrow public webhook; never commit it.
3. Set `TELEGRAM_WEBHOOK_SECRET` in Vercel and register `/api/telegram` with
   Telegram. Keep the terminal-capable Hermes gateway pairing-gated.
4. Put the public `https://t.me/<bot_username>` URL in Vercel as
   `WYRD_TELEGRAM_URL`.

## 4. X

The web app only needs the public account URL. Hermes posting needs a separate X
developer app and OAuth authorization through `xurl`; keep those credentials in
the local Hermes environment, not in Vercel.

## 5. Hermes environment

Set these locally in `~/.hermes/.env`:

```text
WYRD_GATEWAY_URL=https://<vercel-production-url>/api/weird
WYRD_CONVEX_URL=https://<deployment>.convex.site
WYRD_LANDING_URL=https://<vercel-production-url>
TELEGRAM_BOT_TOKEN=<secret>
WYRD_SKILL_DIR=/absolute/path/to/weirdmoney/skills/wyrd
```

## 6. Smoke test

```bash
curl https://<vercel-production-url>/api/weird?limit=3
curl https://<deployment>.convex.site/api/stats
```

Then complete one real loop: signup → Convex row → Telegram link → Hermes hunt →
X post → post logged in Convex.
