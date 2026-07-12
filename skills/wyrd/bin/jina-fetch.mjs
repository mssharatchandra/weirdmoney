#!/usr/bin/env node
// DEV-ONLY fallback: fetch Polymarket via Jina reader (r.jina.ai fetches
// server-side from outside India, so it bypasses the local block for testing).
// Production uses the CF Worker gateway instead. Prints clean JSON array.
// Usage: node jina-fetch.mjs [gammaPath]   e.g. "/markets?limit=40&order=volume24hr&ascending=false&closed=false&active=true"

const path = process.argv[2] ||
  "/markets?limit=60&order=volume24hr&ascending=false&closed=false&active=true";
const target = `https://gamma-api.polymarket.com${path}`;

const r = await fetch(`https://r.jina.ai/${target}`, {
  headers: { "X-Return-Format": "text", Accept: "application/json" },
});
if (!r.ok) { console.error("jina fetch failed:", r.status); process.exit(1); }
let d = (await r.text()).trim();

// Jina text-mode escapes the whole doc: every " -> \" and every \ -> \\.
// Structural chars ([ ] { } : ,) stay literal. Reverse with ONE left-to-right
// pass so nested-escaped fields (outcomes: "[\"Yes\",\"No\"]") survive intact.
const start = d.indexOf("[");
if (start > 0) d = d.slice(start);
const end = d.lastIndexOf("]");
if (end > 0) d = d.slice(0, end + 1); // drop jina's trailing footer text
d = d.replace(/\\(["\\])/g, "$1");

let markets;
try { markets = JSON.parse(d); }
catch (e) { console.error("parse failed:", e.message); process.exit(1); }
process.stdout.write(JSON.stringify(markets));
