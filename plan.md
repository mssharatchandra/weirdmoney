# plan.md — WYRD · "the internet's weird money"
### Hermes Buildathon · Virality Track · v2 (rewritten against the actual handbook)

> **SCOPE LOCK (v3):** pure entertainment play — distribution IS the value. One happy loop: Hermes on the Mac → X bot → landing signups → Telegram subscription. Build order, cut list, and component specs live in `SPEC.md` v3; where this file and SPEC.md disagree, **SPEC.md wins** (notably: Dodo checkout and the automated reply-guy engine are CUT).

> **The one-line pitch:** Polymarket is banned in India. WYRD is an agent that hunts the internet's weirdest bets, posts them in fluent brainrot on X, and lets anyone get them delivered by texting a Telegram bot — running live on Hermes.

---

## 0. READ THIS FIRST — what the handbook changed

The v1 plan optimized for a multi-day Twitter growth run. **Wrong game.** The real game:

1. **It's 8 hours, on the floor.** Kickoff 10:00, build 11:00–~5:00, live 4-min demo at 5:30. No remote work, fresh build only, submit at `growthx.club/hermes-buildathon/submit` before the window closes.
2. **The scoring math (Virality, 164 base + uncapped overflow):**

   | Parameter | Weight | Max | What L5 takes |
   |---|---|---|---|
   | Impressions | 1x | 4 | 5k–7.5k weighted |
   | Reactions/comments | 2x | 8 | 51–100 |
   | Amplification quality | 3x | 12 | notable (10k+) reshares, PH, press |
   | **Visitors to product** | **10x** | **40** | 251–1,000 uniques, verified dashboard |
   | **Signups / meaningful actions** | **25x** | **100** | 101–250 signups, verified in live DB. Overflow: +25 pts per 50 signups past 1k |

   **Translation: a viral tweet is worth 4 points. A signup funnel is worth 140+.** The bot is not the product — the bot is the *distribution engine* for a product people can visit and sign up for. Tweets exist to push clicks; clicks exist to become signups.
3. **Hermes is mandatory** (Nous Research's `hermes-agent`; no Hermes, no score). Two qualifying modes — **we do BOTH**:
   - *Coding partner:* build everything in Hermes sessions, keep receipts (mentors scroll your session history).
   - *Base harness:* end users interact with Hermes — our Telegram bot IS a Hermes gateway. The handbook's own gold-standard example ("judge texts TutorBot from her phone, memory recalls her, a cron fires while everyone watches") is literally our architecture.
4. **Power-ups: flat +25 per partner, no cap, mentor must see it working.** All six = +150 — nearly a whole extra track. We're taking 5, maybe 6.
5. **Anti-spoof:** visitors must be ≤10% of weighted impressions; signups ≤50% of visitors. Numbers verified in the live DB — friends/teammates struck, spoofs zero the parameter. **Analytics with read-only mentor access (Datafast recommended) or visitors caps at L2.**
6. Ads count at 25%. Platform doesn't matter (X = LinkedIn = IG). Cross-track bonus capped at 50.

---

## 1. The product (what actually gets scored)

**WYRD** — three connected surfaces, one loop:

```
X account (@wyrdmoney)          wyrd landing page              WYRD Telegram bot
"the internet's weird money"    (Cloudflare Pages/Workers)     (Hermes gateway)
POSTS weird Polymarket bets ──▶ link in reply #1 ──▶ VISITORS ──▶ SIGNUPS:
in meme voice, all day          Datafast analytics      │   1) email → Convex table
                                live odds ticker        │   2) "Text WYRD" → Telegram
                                "get tomorrow's         │      /start = meaningful action,
                                 weirdest bets first"   ▼      logged to Convex
                                                 25x PARAMETER
```

- **The X bot** (runs as a Hermes cron/loop on your Mac): every ~30 min → pull Polymarket Gamma API → score weirdness → write post in house voice → post → **market link + wyrd page link in reply #1**.
- **The landing page**: dark, degen-clean, one screen. Live "weirdest bets right now" ticker (pulled from Gamma), one field: *"get the internet's weirdest money in your inbox / on Telegram."* Signup writes to **Convex**. **Datafast snippet installed in the first deploy, not hour 6** (the rubric explicitly roasts teams that install analytics late).
- **The Telegram bot** (Hermes gateway, judges can text it from their own phones): `/start` → onboards, logs signup to Convex → answers "what's the weirdest bet today?", "what are the odds on X?" live, uses memory ("you asked about the alien market yesterday — YES moved 3 points"). This is the **meaningful action** machine AND the base-harness proof AND the demo.

**Why this wins the room:** every other virality team will demo a share-card generator. We demo an autonomous agent that has been *publicly posting all day while we built it*, a judge texting it live, and a Convex table of strangers filling up in real time.

**India angle stays the narrative spine:** "Polymarket is geo-blocked here. 1.4B people's only window into the internet's weirdest money is this feed." Forbidden fruit + FOMO = the share hook, and the room full of Indian builders is audience zero.

---

## 2. Access checklist

### 🔴 BEFORE the event (setup is allowed pre-event; product code is not)
| # | Task | Who | Notes |
|---|---|---|---|
| 1 | Install Hermes on both machines | Both | `curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh \| bash`. **Windows teammate: Hermes needs WSL2 — install & test WSL2 + Hermes the night before, non-negotiable.** |
| 2 | LLM access | You | OpenAI recommended: key in `~/.hermes/.env`, and in config `provider: "openai-api"`, model `gpt-5.6-sol` (exact ids — common failure per handbook). If you gave your org ID at registration you already have **$200 credits + Codex Pro**. Fallback: OpenRouter $10. |
| 3 | Port your Claude setup into Hermes | You | Hermes reads repo `CLAUDE.md` natively (order: `.hermes.md` > `AGENTS.md` > `CLAUDE.md` — keep ONE). Point `skills.external_dirs` at `~/.claude/skills`. Run the handbook's port-prompt before 10 AM. |
| 4 | Telegram bot | Teammate | @BotFather `/newbot` → token; numeric user IDs via @userinfobot; `hermes gateway setup`. Verify a DM answers. |
| 5 | X account `@wyrdmoney` | Teammate | Real phone number, bio: *"the internet's weird money. commentary, not financial advice."* Post 2–3 warm-up posts from it days before. **Both of you also prep your personal accounts** — early amplification comes from the room + your own networks. |
| 6 | X API free tier application | You | 500 posts/mo write-only — plenty. Fallback: Hermes browser automation posting via x.com (Nous Portal has managed browser tools if wiring is painful). |
| 7 | Accounts, dormant until 11 AM | Both | Cloudflare, Convex, Datafast, LinkUp (redeem $50, code `HERMES`), ElevenLabs (Discord redemption), Wispr Flow (link), Dodo (code in email). Claim every perk — most are tied to registered email and can't be reissued. |
| 8 | Verify Polymarket APIs raw | Teammate | `https://gamma-api.polymarket.com/markets?active=true&limit=100` (no auth) + CLOB `/prices-history`. Save sample responses to read on the floor. |

### 🟢 Free / no signup
Polymarket Gamma API (all markets, prices, volume — public, read-only, no geo-block on API) · CLOB API (price history → "the line just moved" posts). **No Polymarket account, wallet, or trading — ever.** We're commentary, like a sports page covering odds. Keeps us clean legally and per the India framing.

---

## 3. Power-up plan (+125–150 — do not skip, this is ~an extra track)

| Partner | +25 when | Our integration | Effort |
|---|---|---|---|
| **Cloudflare** | hosting/Workers doing real work | Landing page on CF Pages + a Worker proxying/caching Gamma API for the live ticker | Low |
| **Convex** | stores real product state | Signups table + posted-markets log + engagement metrics. It's our whole backend | Low |
| **LinkUp** | live search doing real work | The Writer calls LinkUp per market for live context ("why is this trending?") → posts reference real news, not just odds | Low |
| **Wispr Flow** | 500+ words dictated during event | Dictate prompts/copy all day, screenshot stats. Free points | Trivial |
| **ElevenLabs** | voice doing real work | Telegram bot replies with a **voice note**: "WYRD's 60-second degen brief" — unhinged sports-commentator read of today's top-3 weird markets. Also the demo's best moment | Medium |
| ~~Dodo~~ | ~~live checkout~~ | **CUT in v3** — off the happy loop. Revisit only if everything else is done and rehearsed | — |

---

## 4. The content engine (compressed for 8 hours)

**Weirdness score** (Judge prompt): absurdity of premise × money-on-the-line (the joke IS "$340k riding on whether a bird lands on the pope") + price drama (moved >10 pts/24h) + cultural heat (LinkUp check) + **India resonance bonus** (cricket, Bollywood, elections — the room retweets what the room recognizes) + freshness vs. `posted` table in Convex.

**Formats** (Writer rotates): ① deadpan stat drop ② "the market gives your team 4%. four percent." rage-bait ③ line-movement thriller ("somebody knows something 👀") ④ X poll mirroring the market → reveal gap ⑤ the forbidden-fruit special: *"this market is illegal for you to touch. here's what the internet is betting anyway →"* ⑥ hour-6 mega-thread: "top 5 most unhinged bets on the internet right now 🧵" (the follow + signup driver).

**Voice rules** (`style.md`, Hermes memory): lowercase, dry, numbers do the comedy, never explain the joke, ≤1 emoji, no hashtags, links in reply #1 only. **Hard rails:** no death/assassination/tragedy/minor-related markets — weird ≠ dark; every number verbatim from API; bio disclaimer "commentary, not financial advice. we don't bet, we watch."

**Cadence:** first post by **12:00**, then every ~30 min. Impressions need hours to compound and mentors check trajectory at judging — the earlier the account is alive, the better every number upstream of signups looks. Aim 10–14 posts total; sniping > spam.

---

## 5. The 8-hour run of show

**10:00–11:00 · Kickoff.** Register track = Virality. Confirm rule interpretation with a mentor early: "X bot + landing + Telegram agent, signups in Convex — anything borderline?" (Honest flags survive; hidden ones DQ.)

**Hour 1 (11–12) · Skeleton + first post.** *You (Hermes session #1):* landing page → CF Pages, Convex schema (`signups`, `posts`, `markets`), **Datafast installed in first deploy**, read-only dashboard link saved for mentors. *Teammate (Hermes session #2):* scout+judge+writer pipeline against Gamma API; **first post out by 12:00, link in reply.** Announce build-in-public thread from personal accounts at 11:15 (the handbook's own examples reward the hour-3 build-thread pattern).

**Hour 2–3 (12–2) · The loop + the bot.** Posting cron live in Hermes (every 30 min, jittered). Telegram bot on the gateway: `/start` → Convex signup, "weirdest today" answer working. LinkUp wired into Writer. Landing ticker live via CF Worker. **Walk the floor: get 10 builders to text the bot** — floor signups are real signups, and mentors watching builds is part of trust.

**Hour 4–5 (2–4) · Amplify + voice.** ElevenLabs degen-brief voice notes in Telegram. Hour-6 mega-thread drafted. Personal-account quote-tweets, drop links in relevant Discords/WhatsApp groups/communities (direct-share traffic is a *defense* if CTR looks high — keep receipts). DM 3–5 mid-size meme/finance accounts with the single funniest post — one 10k+ reshare = L4/L5 amplification (3x) and a traffic spike. Wispr running all day; screenshot stats now.

**Hour 6 (4–5) · Harden + Dodo stretch.** Mega-thread posts at peak IST. If green: Dodo ₹99 checkout. Freeze features. Rehearse demo twice, **record a clean backup run** (handbook demands it). Pre-login every proof surface: Convex dashboard, Datafast, X analytics, Telegram.

**~5:00 · SUBMIT** the live URL at growthx.club/hermes-buildathon/submit. **Not at 5:29.**

**5:30 · Demo (2:00 live + 1:00 proof + 1:00 Q&A):**
- 0:00–0:20 — "Polymarket is banned in India. WYRD is the agent that smuggles the internet's weirdest money into your feed — it's been posting autonomously since noon."
- 0:20–2:00 — Judge texts the Telegram bot from *their* phone → instant weird-market answer + ElevenLabs voice brief (happy path). Edge case: ask it something dark ("odds on X dying?") → it refuses in voice. Then the Hermes cron fires a post live on the projector.
- 2:00–3:00 — Proof minute, in weight order: **Convex signups table sorted by `created_at`** → Datafast uniques + referrers (t.co spikes matching post times) → X analytics totals → Wispr/power-up receipts.
- 3:00–4:00 — Q&A. Weakest number will be signups-vs-visitors ratio — know the funnel math cold (impressions ×≤10% → visitors ×≤50% → signups; ours must sit inside both).

---

## 6. Team split (2 people, 8 hours)

| | **You (Mac)** | **Teammate (Windows/WSL2)** |
|---|---|---|
| Own | Hermes harness: gateway, cron, Convex, CF, landing page, demo rig | Content engine: scout/judge/writer prompts, X account, style.md, posting |
| Hours 1–3 | Infra + Telegram bot | Pipeline + first posts |
| Hours 4–6 | ElevenLabs, Dodo stretch, proof surfaces | Amplification: threads, DMs, communities, floor-walking for signups |
| Always | Keep every Hermes session — those receipts ARE eligibility | Wispr dictation running |

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| X API approval not landed | Hermes browser automation on x.com from minute one; platform-agnostic scoring means LinkedIn/IG mirrors count identically — post everywhere |
| WSL2/Hermes breaks on Windows | Tested night before; worst case teammate drives content from Mac's second Hermes session while Windows does accounts/amplification |
| Anti-spoof flags | Never share bare links without a trackable story; keep direct-share receipts (Discord/WhatsApp screenshots) as the "verifiable direct-share source" defense |
| New X account throttled | Warm-up posts pre-event, ≤14 posts, jittered timing; personal accounts mirror everything (all platforms count) |
| Bot posts something dark | Blocklist in Judge prompt + teammate eyeballs every post in Telegram approval channel until hour 4, then auto |
| Demo wifi dies | Backup recording + narrate ("this is where the cron fires") — handbook explicitly scores recovery |

## 8. Name — locked
**WYRD** (Old English for *fate*, pronounced "weird"). A fate-market bot; the pun is the brand. `@wyrdmoney` · wyrd.money or wyrd.pages.dev · tagline: *"the internet's weird money."* Fallbacks: Oddments, Freakonomy.

## 9. Score target (sanity math)
Realistic day: impressions ~3k (L4=3) + reactions ~30 (L4=6) + one notable reshare (L4=9) + 150 visitors (L3=20) + **60 signups incl. floor Telegram starts (L3=50)** + power-ups ×5 (125) ≈ **213 before overflow** — with the heaviest parameter (signups) being the one the floor itself can feed. Every extra 50 signups past caps keeps paying. That's the whole strategy: **the tweets are the top of the funnel; the floor and the funnel are the score.**
