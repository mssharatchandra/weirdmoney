#!/usr/bin/env node
// Sync canonical scorer (packages/core/weird.js CJS) -> landing/lib/weird.mjs (ESM).
import { readFileSync, writeFileSync } from "node:fs";
const src = readFileSync("packages/core/weird.js", "utf8").replace(/module\.exports = \{[\s\S]*?\};\s*$/m, "");
const header = "// GENERATED COPY of packages/core/weird.js — DO NOT EDIT BY HAND.\n// Re-sync with: node scripts/sync-weird.mjs\n";
const exp = "export { parseMaybeJSON, num, normalizeMarket, weirdScore, rankWeird, isSafe, ABSURD_WORDS, INDIA_WORDS, POP_WORDS };\n";
writeFileSync("landing/lib/weird.mjs", header + src + exp);
console.log("synced landing/lib/weird.mjs");
