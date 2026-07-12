# SPEC.md — WYRD v3 (LOCKED)
### One happy loop. Distribution is the value. Weird is the product. Fun is the point.

> **The loop we ship or die by:**
> Polymarket API → Hermes (on your Mac) finds the weirdest bet → writes it funny → posts to X → link in reply → landing page → signup → "link your Telegram" → WYRD drops the weird bets in their DMs → judge texts the bot live on stage.
>
> Everything not on this line is a stretch goal. Everything on it gets built in order, and each step is independently demoable.

---

## 1. The single happy loop (build order = priority order)

```
 [A] SCOUT+WRITER          [B] X POSTER           [C] LANDING            [D] TELEGRAM
 Hermes skill, Mac    ─▶   Hermes cron, Mac   ─▶  CF Pages + Convex ─▶  Hermes gateway, Mac
 Gamma API → weirdest      posts every ~30min,    signup form +          /start links user,
 market → 3 funny drafts   link in reply #1       "link telegram" btn    subscriber gets drops
        │                       │                      │                      │
   demoable alone          demoable alone         demoable alone        demoable alone
   (print the tweet)       (live account)         (form works)          (judge texts it)
```

**Definition of done (the only one):** a stranger sees a tweet → clicks → lands → signs up → links Telegram → receives the next weird drop in their DMs → all rows visible in Convex. When that works once, everything after is polish and amplification.

## 2. Component A — Scout + Writer (Hermes skill on your Mac)

One Hermes skill, `/wyrd-hunt`:
1. `GET gamma-api.polymarket.com/markets?active=true&closed=false&limit=200&order=volume24hr` (+ a second pull sorted by newest).
2. Score each market 0–100 for weird: absurdity of premise (heaviest) × dollars-on-the-line, + India/cricket/pop-culture recognition bonus, + not already in Convex `posts`.
3. Take the #1, draft **3 tweet options** in the house voice, self-pick the best.
4. Output: final text + market URL. Never fabricates a number — question, price, volume verbatim from the API response.

**Voice (`SOUL.md`, write it together in 20 min, it's the whole moat):** WYRD is a nature documentarian for degens — watches the internet gamble on reality and is calmly, deeply unwell about it. lowercase. dry. the number does the comedy. never explains the joke. ≤1 emoji, no hashtags. Loves the bettors like Attenborough loves a confused penguin.

**Seed formats (hand-write ~8 in `memepool.md`, agent rotates, no repeats back-to-back):** deadpan stat drop ("there is currently $340,000 riding on whether a bird lands on the pope. YES is at 12%.") · "brother is NOT ___" · incredulous repetition ("4%. four percent.") · POV/greentext mini-story · fake-formal register clash ("per my last email, $214,000 is riding on a bird") · "they're betting on EVERYTHING 😭" · poll-mirror · daily top-5 thread (hour 5-6, the follow driver).

**Hard rails (in the skill prompt, non-negotiable):** no death/assassination/tragedy/health-of-real-people/minors markets — weird ≠ dark · no betting tips, no "bet now", no VPN talk, ever · report odds, never root for outcomes · bio disclaimer: "commentary, not financial advice. we don't bet, we watch."

## 3. Component B — X poster (Hermes cron on your Mac)

- `@wyrdmoney` (warmed up pre-event). Hermes cron every ~30 min jittered: run `/wyrd-hunt` → post → **reply #1 = polymarket link + landing link** → log to Convex `posts`.
- Posting path: X API free tier (500 posts/mo, plenty). Fallback: Hermes browser automation on x.com.
- **Approval gate hours 1–4:** drafts land in a private Telegram channel, you tap ✅ (10 sec). Hour 4+: full auto — and "it earned autonomy at 3pm" is a stage line.
- First post out by **12:00**. Target 10–14 posts total. Sniping, not spam.
- Manual amplification is a human job, not a bot job: both personal accounts quote-tweet, drop the best post in Discords/WhatsApp groups, walk the floor. (Auto reply-guy engine: **CUT** — X prohibits unsolicited automated replies, and it's off the happy loop. If a banger moment appears under @Polymarket or a cricket account, quote-tweet it *by hand* in the voice.)

## 4. Component C — Landing page (Cloudflare Pages + Convex)

One dark, funny screen — the page itself should be screenshotable:
1. **Header:** *WYRD — the internet's weird money.* Subline: *"polymarket is banned in india. we watch it so you don't have to."*
2. **THE WEIRD INDEX™:** live top-5 weirdest markets right now (question · YES% · $volume · "🧠 97/100 unhinged" badge). CF Worker caches Gamma 60s. This is why visitors stay and share.
3. **Signup:** one email field → Convex `signups`. Success state immediately shows: **"now get them in your DMs → "** button = `t.me/<bot>?start=<signupId>` (this is the Telegram link-through).
4. Latest @wyrdmoney posts embedded (static embeds, no API).

**Non-negotiables:** Datafast snippet in the FIRST deploy · read-only analytics link saved for mentors · OG image so the URL unfurls pretty in group chats.

**Convex schema (hour 1):**
```ts
signups: { email?, tgUserId?, tgUsername?, source: "landing"|"telegram"|"floor",
           linkedAt?, createdAt }
posts:   { marketId, question, text, format, url, postedAt }
```
Signups sorted by `createdAt` on the Convex dashboard = your entire proof minute.

## 5. Component D — Telegram bot (Hermes gateway on your Mac)

- `/start <signupId>` → links tgUserId to the landing signup row (or creates a fresh signup with `source: "telegram"`), replies in voice: *"welcome to the internet's weird money. the weird finds YOU now."*
- **The subscription:** every time the X cron posts, the same content (slightly longer, links inline) broadcasts to all linked subscribers. That's the product: weird bets, delivered.
- `/weird` → top-3 weirdest right now, on demand.
- Free text ("what are the odds on the pope thing?") → live Gamma search, in-voice answer.
- Dark question → in-character refusal: *"we don't do death markets. weird ≠ dark. here's a guy betting $50k on cheese instead."* ← the demo edge case.
- **ElevenLabs stretch (+25, only after the loop closes):** `/brief` returns a 60-sec voice-note "degen brief" of the top 3 — best demo moment if there's time.

## 6. Hermes-on-your-Mac layout (the orchestration layer, and the eligibility proof)

```
~/.hermes/
  SOUL.md                    # WYRD persona
  skills/wyrd-hunt/          # scout+judge+writer
  skills/wyrd-post/          # post to X + log to Convex + broadcast to TG subs
  skills/wyrd-answer/        # telegram free-text market lookups
  config.yaml                # provider: openai-api, model: gpt-5.6-sol, mcp/skills dirs
project repo/
  CLAUDE.md (or .hermes.md)  # ONE project file — Hermes reads the first it finds
  memepool.md                # formats + heat, agent-consulted each post
  landing/                   # CF Pages site
  convex/                    # schema + functions
```
- Gateway (`hermes gateway`) runs in one terminal all day = the Telegram bot. Cron runs the posting loop. **Keep every session — receipts are eligibility.**
- Windows teammate: WSL2 Hermes as backup brain only; their real jobs are the X account, approval taps, amplification, floor signups, and demo rehearsal.

## 7. Power-ups (only ones on or beside the loop)
| Partner | How | Status |
|---|---|---|
| **Cloudflare** | landing on Pages + Worker caching Gamma | on the loop, +25 |
| **Convex** | signups + posts = the whole backend | on the loop, +25 |
| **LinkUp** | Writer pulls one line of live context per market ("why is this trending") | 20 min, +25 |
| **Wispr Flow** | dictate all day, screenshot stats | free, +25 |
| **ElevenLabs** | `/brief` voice note | stretch, +25 |
| ~~Dodo~~ | ~~checkout~~ | **CUT** — off the loop |

## 8. Hour-by-hour (8-hour floor, loop-first)
| Hour | You (Mac, Hermes) | Teammate |
|---|---|---|
| 1 | Convex schema · landing live w/ Datafast + signup | SOUL.md + memepool.md together (first 20 min) · X account final prep |
| 2 | `/wyrd-hunt` working · **first post by 12:00** (manual paste is fine) | approval channel · personal-account build-in-public thread |
| 3 | posting cron live · reply #1 links · TG `/start` linking → Convex | amplify post #1–3 in communities · tap approvals |
| 4 | **broadcast to subscribers = LOOP CLOSED** · `/weird` + free-text | walk the floor: get builders through the full loop (their signups are real signups) |
| 5 | flip to auto · ElevenLabs `/brief` if green · LinkUp garnish | top-5 thread posts · more floor + group-chat distribution |
| 6 | freeze · pre-login proof surfaces (Convex, Datafast, X analytics, TG) | rehearse 4-min demo ×2 · record backup run · **SUBMIT early** |

## 9. The 4-minute demo
- **0:00–0:20** — "polymarket is banned in india. WYRD is the agent that watches the internet's weirdest money and delivers it as memes. it's been posting on its own since noon."
- **0:20–2:00** — live: judge texts the bot from their phone → `/weird` answers instantly → the edge case: ask it a dark one, it refuses in character → the Hermes cron fires a real post on the projector → the post arrives in a subscriber's Telegram on a second phone. Full loop, on stage, no humans.
- **2:00–3:00** — proof, in weight order: **Convex signups sorted by created_at** → Datafast uniques + t.co referrers matching post times → X analytics → power-up receipts.
- **3:00–4:00** — Q&A. Weakest number = signups; answer cold: "N signups, M linked to Telegram, ratio inside the anti-spoof caps (visitors ≤10% of impressions, signups ≤50% of visitors), and here's the floor-vs-landing source split in the table."

## 10. Cut list (said out loud so nobody builds them)
Financial analysis & signals positioning · Dodo checkout · automated reply-guy · Reddit trend-scout cron (hand-curate memepool instead) · analyst feedback cron (check X analytics by hand at hours 3/5) · LinkedIn/IG mirrors (manual only if a post pops) · anything anyone starts with "wouldn't it be cool if".
