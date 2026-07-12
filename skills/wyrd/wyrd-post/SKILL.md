---
name: wyrd-post
description: Publish a chosen WYRD tweet to X (with the market link as reply #1), then log it to Convex and broadcast it to Telegram subscribers. Use after wyrd-hunt picks a winner.
version: 1.0.0
---

# wyrd-post

Publish one approved post everywhere. Inputs you need: the final `text`, the
market `url`, `marketId`, `question`, and the `format` used.

## Steps

1. **Post to X** using the `xurl` skill (official X API CLI). Post the tweet text
   (no link in the body). Capture the returned tweet id.

   ```bash
   xurl -X POST /2/tweets -d '{"text":"<TWEET TEXT>"}'
   ```
   If `xurl auth status` shows no auth, stop and tell the user to authenticate
   `~/.xurl` outside the agent session (never handle X secrets in-session).

2. **Reply #1 = the link.** Reply to the tweet you just posted with the market
   link + the landing page, so link-suppression doesn't hurt reach:

   ```bash
   xurl -X POST /2/tweets -d '{"text":"<MARKET_URL> · see the internet'\''s weird money: <LANDING_URL>","reply":{"in_reply_to_tweet_id":"<TWEET_ID>"}}'
   ```

3. **Log + broadcast.** Record the post to Convex (proof + dedupe) and push it to
   every Telegram subscriber in one call:

   ```bash
   node "$WYRD_SKILL_DIR/../bin/broadcast.mjs" '{"marketId":"<ID>","question":"<Q>","text":"<TWEET TEXT>","url":"<MARKET_URL>","format":"<FORMAT>","platform":"x"}'
   ```

4. **Report** the tweet URL, and the broadcast result (N subscribers reached).

## Notes
- If X posting fails (auth/ratelimit), still run step 3 so the drop reaches
  Telegram subscribers and the post is logged — then report the X failure.
- Keep total posts ≤ ~14/day, jittered. Quality over volume.
