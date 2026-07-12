# AGENTS.md — WYRD shared ledger

> Single source of truth for every agent (Claude, Codex, Hermes) working on WYRD.
> **Read this first. Update it after any meaningful change.** Keep it terse and current.
> Last updated: 2026-07-12 by Codex (session: Vercel consolidation).

## What WYRD is
An autonomous agent that hunts the weirdest live Polymarket bets and delivers them
as memes — on X (@wyrdmoney), a live web dashboard, and a Telegram subscription.
Hackathon: Hermes Buildathon, **Virality track**. Positioning: entertainment;
"polymarket is banned in india, we watch it so you don't have to." Distribution IS
the value. Strategy + scope in `plan.md` / `SPEC.md` (SPEC v3 wins on conflict).

## Canonical facts (decisions — do not silently diverge)
- **Canonical URL: the Vercel production URL for now; `wyrd.money` later.**
  Routes: `/` landing · `/dashboard` Weird Index · `/join` signup · `/telegram`
  redirect to bot · `/x` redirect to @wyrdmoney · `/api/*` backend.
- **Hosting: Vercel free tier for the complete web surface.** `landing/` is a standard
  Next.js app. Cloudflare Worker remains an optional later power-up/gateway.
- **Signups + posts store: Convex** (earns +25). ONE source of truth for the 25x
  "signups" metric. Landing signup + Telegram /start both write to Convex.
  NOT Cloudflare D1 (Codex's original starter used D1; we repointed to Convex).
- **Polymarket is DNS+network blocked on Indian ISPs** (confirmed on the dev Mac).
  So: the Mac agent NEVER calls Polymarket directly. It goes through an edge.
  - Production edge: the Vercel app's `/api/weird` route, with the CF Worker
    (`worker/`) retained as an optional fallback/power-up.
  - Dev fallback (no deploy needed): `r.jina.ai` proxy via `skills/wyrd/bin/jina-fetch.mjs`.
- **Hermes runs on Sharat's Mac** (provider openai-codex / gpt-5.6-sol). It is the
  orchestration layer: skills + cron + Telegram gateway. Skills load from
  `skills/` via `skills.external_dirs` in `~/.hermes/config.yaml`.
- **Never**: dark markets (death/tragedy/minors), betting advice, VPN/circumvention
  talk, fabricated numbers. Voice = `skills/wyrd/SOUL.md`.

## Architecture / the one loop
```
Polymarket ──(edge: Vercel /api/weird)────────► scored weird markets
   ▲ blocked in IN                                     │
   │                                     Hermes wyrd-hunt (writes voice)
   │                                                    │
   │                                     wyrd-post ──► X @wyrdmoney (reply#1 = link)
   │                                          │                │
   └── dev only: r.jina.ai                    ├─ broadcast ──► Telegram subscribers
                                              └─ logPost ──► Convex
   Vercel web app ────── /join ─► /api/signups ─► Convex (signups)
                       └ /dashboard ─► /api/weird (live Weird Index)
```

## Contracts (frozen — coordinate before changing)
- **Weird gateway** (`landing/api/weird`; optional `worker/`) → `GET ...?limit=N&exclude=id,id`
  returns `{ count, markets:[{ id, question, url, yesPct, volume, volume24hr, weird:{score,breakdown} }] }`.
- **Convex HTTP** (`https://<dep>.convex.site/api/*`, CORS open):
  `POST /api/signup {email,source}` · `POST /api/linkTelegram {signupId?,tgUserId,tgUsername}`
  `POST /api/logPost {marketId,question,text,format,url,platform}` ·
  `GET /api/recentPosts?limit` · `GET /api/subscribers` · `GET /api/stats`.
- **Scoring** = `packages/core/weird.js` (pure, tested on live data). Shared everywhere.

## Component status
| # | Component | Owner | State |
|---|---|---|---|
| 1 | `packages/core` weird-scoring | Claude | ✅ tuned on live data |
| 2 | `worker/` CF gateway | Claude | ✅ optional fallback; not required for Vercel launch |
| 3 | `convex/` backend | Claude (via subagent) | ✅ built; auth complete, ToS/deploy pending |
| 4 | `skills/wyrd` Hermes skills | Claude | ✅ registered in Hermes; runs live via Jina fallback |
| 5 | `landing/` (Next.js/Vercel) | Codex | ✅ live at `https://wyrd-money.vercel.app` |
| — | Telegram gateway | pending | ⬜ needs BotFather token + `hermes gateway setup` |
| — | X / xurl auth | pending | ⬜ needs dev app; user sets `~/.xurl` outside agent session |
| — | wyrd.money domain | pending | ⬜ optional after launch |

## Env (set in `~/.hermes/.env` for skills; in CF vars for landing)
`WYRD_GATEWAY_URL` `WYRD_CONVEX_URL` `TELEGRAM_BOT_TOKEN` `WYRD_SKILL_DIR`
`WYRD_LANDING_URL` · landing also: `WYRD_TELEGRAM_URL` `WYRD_X_URL`.
See `skills/wyrd/wyrd.env.example`, `landing/.env.example`, and `RUNBOOK.md`.

## Decisions log
- 2026-07-12: chose Cloudflare hosting + Convex store (both power-ups) over Vercel/D1.
- 2026-07-12: absurdity GATES weird score (boring longshots capped) after live-data tuning.
- 2026-07-12: landing `/api/weird` can be the gateway (CF edge reaches Polymarket),
  so a separate worker deploy is optional for the dashboard.
- 2026-07-12: user locked Vercel free-tier hosting for launch; Convex remains the
  shared state layer and the optional CF Worker is retained for later.
- 2026-07-12: Vercel project `wyrd-money` deployed publicly; GitHub connected
  with root directory `landing`; live `/api/weird` smoke test passes.

## Next up
- [x] Validate and deploy `landing/` to Vercel.
- [ ] Set Vercel route env values after Convex + Telegram are live.
- [ ] Deploy Convex and set `WYRD_CONVEX_URL` in Vercel + Hermes.
- [ ] Connect: Telegram gateway, xurl auth, set env, first post, cron loop.
