# WYRD — Convex Backend Setup

The Convex backend stores email/Telegram **signups** (the headline hackathon
metric) and **posts** that WYRD publishes to X / Telegram. It exposes both a
Convex client API (queries/mutations) and a plain **HTTP API** so the Hermes
agent (curl) and the landing page can call it without the Convex client.

All backend code lives in `convex/`:

| File              | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| `schema.ts`       | `signups` + `posts` tables and their indexes        |
| `signups.ts`      | `createSignup`, `linkTelegram`, `listSubscribers`, `stats` |
| `posts.ts`        | `logPost`, `recentPosts`                             |
| `http.ts`         | HTTP router (`/api/*`) with permissive CORS         |

---

## 1. Install & first-time login

Run these from the repo root (`weirdmoney/`):

```bash
# install the convex package (adds it + a package.json/lockfile at root)
npm i convex

# first-time login + create/link a dev deployment.
# this opens a browser for auth, then generates convex/_generated/* and
# watches your functions. LEAVE IT RUNNING during the hackathon.
npx convex dev
```

On first run `npx convex dev` will:

1. Prompt you to log in via the browser (GitHub/Google).
2. Ask to create a new project — name it `wyrd` (or pick an existing one).
3. Push the schema + functions and generate `convex/_generated/`.
4. Print your deployment URLs (see below) and keep watching for changes.

> `convex/_generated/` is git-ignored (via `.convex/` / generated output) and is
> created by the codegen step above. Until you run `npx convex dev` at least
> once, editor TypeScript will show missing `./_generated/*` imports — that is
> expected and resolves after codegen.

To deploy to **production** later:

```bash
npx convex deploy      # pushes to the prod deployment
```

---

## 2. Where the URLs live

After `npx convex dev` starts, two URLs are printed (also visible in the
dashboard → **Settings**):

- **Client API (queries/mutations):** `https://<deployment>.convex.cloud`
  Used by the Convex JS client. Set in the landing app as
  `NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud`.

- **HTTP API (curl / server / browser):** `https://<deployment>.convex.site`
  This is the base URL for every `/api/*` route in `convex/http.ts`.
  **Note the `.convex.site` domain** — HTTP actions are served there, NOT on
  `.convex.cloud`.

You can also print the current dev deployment URL any time:

```bash
npx convex dashboard        # opens the dashboard (verify signups live here)
npx convex env list         # sanity check env / deployment
```

`<deployment>` is your unique slug, e.g. `handsome-otter-123`.

---

## 3. HTTP API reference

Base URL: `https://<deployment>.convex.site`

| Method | Path                          | Body / Query                                              | Response                          |
| ------ | ----------------------------- | -------------------------------------------------------- | --------------------------------- |
| POST   | `/api/signup`                 | `{ "email": "...", "source"?: "landing\|telegram\|floor" }` | `{ "signupId": "..." }`           |
| POST   | `/api/linkTelegram`           | `{ "signupId"?: "...", "tgUserId": "...", "tgUsername"?: "..." }` | `{ "ok": true }`          |
| POST   | `/api/logPost`                | `{ "marketId","question","text","format","url","platform":"x\|tg" }` | `{ "ok": true }`      |
| GET    | `/api/recentPosts?limit=10`   | `limit` (optional, default 10)                           | `{ "posts": [...] }`              |
| GET    | `/api/subscribers`            | —                                                        | `{ "subscribers": [{tgUserId,tgUsername}] }` |
| GET    | `/api/stats`                  | —                                                        | `{ "signups": n, "linked": n, "posts": n }`  |

All routes send `Access-Control-Allow-Origin: *` and answer `OPTIONS`
preflight, so the landing page browser can call them directly.

`createSignup` dedupes by email (case-insensitive); `linkTelegram` is
idempotent by `tgUserId`.

---

## 4. curl smoke tests

Replace `<deployment>` with your slug.

```bash
# health / demo proof numbers
curl -s https://<deployment>.convex.site/api/stats
# -> {"signups":0,"linked":0,"posts":0}

# create a signup (the metric that matters)
curl -s -X POST https://<deployment>.convex.site/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"floor@wyrd.bet","source":"floor"}'
# -> {"signupId":"j57..."}

# posting the same email again returns the SAME id (dedupe)
curl -s -X POST https://<deployment>.convex.site/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"floor@wyrd.bet"}'

# stats now reflects the new signup
curl -s https://<deployment>.convex.site/api/stats
# -> {"signups":1,"linked":0,"posts":0}
```

Other endpoints:

```bash
# link a Telegram subscriber (idempotent by tgUserId)
curl -s -X POST https://<deployment>.convex.site/api/linkTelegram \
  -H "Content-Type: application/json" \
  -d '{"tgUserId":"12345","tgUsername":"weirdo"}'

# log a post the agent published
curl -s -X POST https://<deployment>.convex.site/api/logPost \
  -H "Content-Type: application/json" \
  -d '{"marketId":"0xabc","question":"Will X happen?","text":"lol weird","format":"meme","url":"https://x.com/...","platform":"x"}'

# latest drops feed for the landing page
curl -s "https://<deployment>.convex.site/api/recentPosts?limit=5"

# subscribers for Telegram broadcast
curl -s https://<deployment>.convex.site/api/subscribers
```

---

## 5. Verify live during the demo

Run `npx convex dashboard`, open the **Data** tab → `signups` table. The row
count is the heavily-weighted metric — it updates in real time as the landing
page and Telegram bot POST to `/api/signup` and `/api/linkTelegram`. The
`/api/stats` endpoint returns the same numbers for the proof minute.
