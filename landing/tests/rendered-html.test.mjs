import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("contains the complete WYRD pre-launch experience", async () => {
  const [page, layout, css, schema] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /THE WEIRD/);
  assert.match(page, /get the first drop/i);
  assert.match(page, /ENCRYPTED UNTIL DROP 001/);
  assert.match(page, /lockedBets\.map/);
  assert.match(layout, /WYRD — the internet's weird money/);
  assert.match(layout, /og\.png/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(schema, /signups_email_idx/);
  assert.doesNotMatch(page + layout, /codex-preview|Your site is taking shape/);
});
