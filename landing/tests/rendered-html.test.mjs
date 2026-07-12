import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("contains the complete WYRD launch experience", async () => {
  const [page, layout, css, signupRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/api/signups/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /THE WEIRD/);
  assert.match(page, /get the first drop/i);
  assert.match(page, /LIVE INDEX ONLINE/);
  assert.match(page, /open the weird index/i);
  assert.match(page, /@wrydmoney is posting/i);
  assert.match(page, /watch the bot on X/i);
  assert.match(page, /lockedBets\.map/);
  assert.match(layout, /WYRD — the internet's weird money/);
  assert.match(layout, /og\.png/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(signupRoute, /WYRD_CONVEX_URL/);
  assert.doesNotMatch(page + layout, /codex-preview|Your site is taking shape/);
});

test("ships a measurable viral loop instead of anonymous vanity counters", async () => {
  const [dashboard, proof, actionRoute, jurorToken, schema] = await Promise.all([
    readFile(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/proof/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/viral-action/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/juror-token.ts", import.meta.url), "utf8"),
    readFile(new URL("../../convex/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(dashboard, /weirdness jury/i);
  assert.match(dashboard, /nominate weirdest/i);
  assert.match(dashboard, /referred jurors/i);
  assert.match(proof, /NO DECKS\. NO SCREENSHOTS/i);
  assert.match(actionRoute, /allowedKinds/);
  assert.match(actionRoute, /verifyJurorToken/);
  assert.match(jurorToken, /createHmac/);
  assert.match(schema, /viralActions/);
});
