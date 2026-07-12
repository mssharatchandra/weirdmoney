# AGENTS.md — WYRD shared ledger

> Single source of truth for every agent (Claude, Codex, Hermes) working on WYRD.
> **Read this first. Update it after any meaningful change.** Keep it terse and current.
> Last updated: 2026-07-12 by Codex (session: demo wiring).

## What WYRD is
An autonomous agent that hunts the weirdest live Polymarket bets and delivers them
as memes — on X (@wrydmoney), a live web dashboard, and a Telegram subscription.
Hackathon: Hermes Buildathon, **Virality track**. Positioning: entertainment;
"polymarket is banned in india, we watch it so you don't have to." Distribution IS
the value. Strategy + scope in `plan.md` / `SPEC.md` (SPEC v3 wins on conflict).

## Canonical facts (decisions — do not silently diverge)
- **Canonical URL: the Vercel production URL for now; `wyrd.money` later.**
  Routes: `/` landing · `/dashboard` Weird Index · `/join` signup · `/telegram`
  redirect to bot · `/x` redirect to @wrydmoney · `/api/*` backend.
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
   │                                     wyrd-post ──► X @wrydmoney (reply#1 = link)
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
| 3 | `convex/` backend | Claude + Codex | ✅ production at `hip-squirrel-523`; Vercel connected |
| 4 | `skills/wyrd` Hermes skills | Claude | ✅ registered in Hermes; runs live via Jina fallback |
| 5 | `landing/` (Next.js/Vercel) | Codex | ✅ live; editorial top-10 dashboard + share actions |
| — | Telegram | Codex | ✅ public webhook active at `/api/telegram`; `/start` writes Convex |
| — | X publishing | Codex | ✅ first 10 approved drops live with source replies + Convex receipts |
| — | Unified publisher | Codex | ✅ guarded preview/publish path for X → Convex → Telegram |
| — | Linkup context | Codex | ✅ integrated; 429/no-credit falls back to audited market-only mode |
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
- 2026-07-12: Vercel Web Analytics enabled and instrumented for visitor proof.
- 2026-07-12: production signup write verified end-to-end through Vercel → Convex;
  smoke row removed afterward. Zero rows currently means no real signup yet.
- 2026-07-12: public Weird Index restricted to current, explicit Yes/No markets;
  ambiguous named-outcome and stale rows cannot enter the publish queue.
- 2026-07-12: first ten dashboard-aligned X drops published from `@wrydmoney`;
  Telegram broadcasts correctly reported zero recipients because linked count is zero.

## Next up
- [x] Validate and deploy `landing/` to Vercel.
- [x] Set Vercel route env values for Convex, Telegram, and X.
- [x] Deploy Convex and set `WYRD_CONVEX_URL` in Vercel + Hermes.
- [x] Connect Telegram gateway and verify X OAuth identity.
- [ ] Add `LINKUP_API_KEY`, approve/publish first three posts, then schedule cron loop.
