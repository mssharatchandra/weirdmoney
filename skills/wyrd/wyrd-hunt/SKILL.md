---
name: wyrd-hunt
description: Find the weirdest live Polymarket market right now and write 3 tweet drafts in WYRD's voice. Use when it's time to post, or when asked to find weird bets.
version: 1.0.0
---

# wyrd-hunt

Find the single weirdest bettable market right now and draft posts about it.

## Steps

1. **Read the voice.** Read `../SOUL.md` and `../memepool.md` in the WYRD skill
   folder. These define how WYRD writes and which formats to use. Do not skip this.

2. **Hunt.** Run the hunt script (it calls the WYRD gateway, which already scores
   and safety-filters markets, and excludes ones we posted recently):

   ```bash
   node "$WYRD_SKILL_DIR/../bin/hunt.mjs" 5
   ```
   (`WYRD_SKILL_DIR` = this skill's directory. If unset, use the absolute path to
   `skills/wyrd/bin/hunt.mjs`.) It prints `WYRD_CANDIDATES_JSON` (machine block)
   and a human summary. If it says no fresh markets, stop and report that.

3. **Pick one.** Take the top candidate by weird score. If its `question` is at
   all dark (death, tragedy, illness, minors, real people's misfortune), SKIP it
   and take the next — the gateway filters most of this but you are the last gate.

4. **Write 3 drafts.** Using SOUL.md voice and TWO different memepool formats
   (never the same format twice in a row across sessions if you can tell), write
   3 candidate tweets for the chosen market. Rules:
   - every number (%, $) must come verbatim from the candidate JSON. Never invent.
   - lowercase, dry, ≤1 emoji, no hashtags, the number lands the joke.
   - keep the tweet itself link-free (the link goes in reply #1 at post time).
   - if the market has the `india` flag, strongly prefer the india/cricket angle.

5. **Output** the chosen `marketId`, `url`, `question`, the numbers used, and the
   3 drafts clearly labeled with their format. Then hand off:
   - during the approval window: present the 3 to the human and wait for a pick.
   - in auto mode: pick the strongest yourself and call `wyrd-post`.

## Never
Never post advice, never tell anyone to bet, never explain the joke, never
fabricate a number, never touch a dark market.
