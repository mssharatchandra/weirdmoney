# WYRD — go-live runbook

Everything is built. This is the exact sequence to make it live. Steps marked
**[you]** need your credentials/browser; the rest is done.

## The loop (what's wired)
```
CF Worker /weird  ──►  Hermes wyrd-hunt  ──►  wyrd-post (xurl)  ──►  X @wyrdmoney
   (beats IN block)        (writes voice)      reply#1 = link         │
        ▲                                       broadcast.mjs ────────┼──► Telegram subs
   Polymarket                                   logPost ──► Convex ◄──┘
                              landing (CF Pages) ──► /api/signup ──► Convex
```

## Status
| Piece | State |
|---|---|
| Weird-scoring core | ✅ built + tested |
| CF Worker gateway | ✅ built, bundles clean · needs deploy **[you: Cloudflare]** |
| Convex backend | ✅ built (6 fns + HTTP API) · needs deploy **[you: Convex]** |
| Hermes skills (hunt/post/answer) | ✅ built, registered, scripts tested · need env + xurl/TG **[you]** |
| Landing page | 🟡 Codex-built base in landing/ · needs takeover+wiring (stop Codex first) |

## Go-live sequence

### 1. Deploy the data gateway  **[you: Cloudflare]**
```bash
cd worker
npx wrangler login            # browser
npx wrangler deploy           # prints https://wyrd-gateway.<you>.workers.dev
curl "https://wyrd-gateway.<you>.workers.dev/health"   # {ok:true, upstream:true}
curl "https://wyrd-gateway.<you>.workers.dev/weird?limit=5"   # real weird markets!
```
This is the moment we confirm the India block is beaten. Save the URL.

### 2. Deploy Convex  **[you: Convex]**
```bash
npm i convex
npx convex dev                # browser login; leave running or `npx convex deploy`
# note the .convex.site HTTP URL (see CONVEX_SETUP.md)
curl https://<dep>.convex.site/api/stats     # {signups:0,linked:0,posts:0}
```

### 3. Telegram bot  **[you: BotFather]**
```bash
# @BotFather /newbot -> token ; @userinfobot -> your numeric id
hermes gateway setup          # pick Telegram, paste token + your id
hermes gateway run            # leave running = the bot is live
```

### 4. X / Twitter  **[you: developer.x.com]**
Install + auth xurl OUTSIDE the agent session (secret-safe):
```bash
curl -fsSL https://raw.githubusercontent.com/xdevplatform/xurl/main/install.sh | bash
xurl auth oauth2              # after registering your app creds
xurl auth status             # confirm
```

### 5. Wire the env  **[you: paste values]**
Copy `skills/wyrd/wyrd.env.example` values into `~/.hermes/.env`:
`WYRD_GATEWAY_URL`, `WYRD_CONVEX_URL`, `TELEGRAM_BOT_TOKEN`, `WYRD_SKILL_DIR`, `WYRD_LANDING_URL`.
Then smoke-test the real pipeline:
```bash
WYRD_GATEWAY_URL=... WYRD_CONVEX_URL=... node skills/wyrd/bin/hunt.mjs 5
```

### 6. First post (manual, approval mode)
In Hermes: `/wyrd-hunt` → review 3 drafts → pick → `/wyrd-post`. Confirm the tweet,
the reply-link, the Convex `posts` row, and the Telegram drop.

### 7. Automate
```bash
hermes cron add --name wyrd-loop --schedule "*/35 * * * *" --prompt "run /wyrd-hunt, pick the strongest draft, run /wyrd-post"
hermes cron status
```

### 8. Landing (after Codex stopped)
Take landing/ current state → point its signup at `WYRD_CONVEX_URL/api/signup`,
replace placeholder Weird Index with a live fetch of `WYRD_GATEWAY_URL/weird`,
add TG deeplink success + Datafast snippet, `npx wrangler pages deploy`.
