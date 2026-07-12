import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("contains the complete WYRD pre-launch experience", async () => {
  const [page, layout, css, signupRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/api/signups/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /THE WEIRD/);
  assert.match(page, /get the first drop/i);
  assert.match(page, /ENCRYPTED UNTIL DROP 001/);
  assert.match(page, /lockedBets\.map/);
  assert.match(layout, /WYRD — the internet's weird money/);
  assert.match(layout, /og\.png/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(signupRoute, /WYRD_CONVEX_URL/);
  assert.doesNotMatch(page + layout, /codex-preview|Your site is taking shape/);
});
