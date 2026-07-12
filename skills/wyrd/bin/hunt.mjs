#!/usr/bin/env node
// WYRD hunt — fetch the weirdest live markets from the Vercel gateway (which already
// scores + safety-filters them), minus anything we've posted recently, and print
// candidates for the writer. Never calls Polymarket directly (India-blocked).
//
// Env: WYRD_GATEWAY_URL (required)  WYRD_CONVEX_URL (optional, for dedupe)
// Usage: node hunt.mjs [limit]

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const GATEWAY = process.env.WYRD_GATEWAY_URL;
const CONVEX = process.env.WYRD_CONVEX_URL; // e.g. https://<dep>.convex.site
const LINKUP_KEY = process.env.LINKUP_API_KEY;
const limit = parseInt(process.argv[2] || "5", 10);
const __dir = dirname(fileURLToPath(import.meta.url));

// No deployed gateway yet? Fall back to fetching via the Jina proxy + scoring
// locally, so the skill is testable before the CF Worker is live.
function weirdViaJina(lim, exclude) {
  const require = createRequire(import.meta.url);
  const { rankWeird } = require(join(__dir, "../../../packages/core/weird.js"));
  const pull = (path) =>
    JSON.parse(execFileSync("node", [join(__dir, "jina-fetch.mjs"), path], { maxBuffer: 64 * 1024 * 1024 }).toString());
  const pages = [];
  for (let page = 0; page < 6; page++) {
    pages.push(pull(`/markets?limit=100&offset=${page * 100}&order=volume24hr&ascending=false&closed=false&active=true`));
  }
  for (let page = 0; page < 4; page++) {
    pages.push(pull(`/markets?limit=100&offset=${page * 100}&order=startDate&ascending=false&closed=false&active=true`));
  }
  const seen = new Set(); const all = [];
  for (const m of pages.flat()) { const id = String(m.id); if (id && !seen.has(id)) { seen.add(id); all.push(m); } }
  return { markets: rankWeird(all, { limit: lim, excludeIds: exclude }) };
}

async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

function weirdEndpoint(base) {
  const clean = base.replace(/\/$/, "");
  return clean.endsWith("/weird") ? clean : `${clean}/weird`;
}

async function linkupContext(question) {
  if (!LINKUP_KEY) return null;
  const r = await fetch("https://api.linkup.so/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINKUP_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `Find the freshest reliable news or public internet context relevant to this prediction-market question: ${question}`,
      depth: "fast",
      outputType: "searchResults",
      maxResults: 3,
    }),
  });
  if (!r.ok) throw new Error(`Linkup -> ${r.status}`);
  const data = await r.json();
  return (data.results || []).map((item) => ({
    name: item.name,
    url: item.url,
    snippet: item.content || item.snippet || "",
  }));
}

// Pull recently-posted marketIds so we don't repeat (best-effort).
async function recentlyPosted() {
  if (!CONVEX) return [];
  try {
    const { posts = [] } = await getJSON(`${CONVEX}/api/recentPosts?limit=40`);
    return posts.map((p) => String(p.marketId)).filter(Boolean);
  } catch {
    return [];
  }
}

(async () => {
  const exclude = await recentlyPosted();
  let markets;
  if (GATEWAY) {
    const q = new URLSearchParams({ limit: String(limit) });
    if (exclude.length) q.set("exclude", exclude.join(","));
    ({ markets = [] } = await getJSON(`${weirdEndpoint(GATEWAY)}?${q}`));
  } else {
    console.error("(no WYRD_GATEWAY_URL — using Jina dev fallback)");
    ({ markets = [] } = weirdViaJina(limit, exclude));
  }

  if (!markets.length) {
    console.log("no fresh weird markets right now (all recent ones already posted, or gateway empty).");
    process.exit(0);
  }


  // Enrich only the leading candidate to keep the live-news loop cheap and fast.
  // A Linkup failure never fabricates context and never blocks the verified odds.
  if (LINKUP_KEY) {
    try { markets[0].linkup = await linkupContext(markets[0].question); }
    catch (error) { console.error(`(Linkup enrichment skipped: ${error.message})`); }
  }

  // Machine-readable block for the agent to act on.
  console.log("=== WYRD_CANDIDATES_JSON ===");
  console.log(JSON.stringify(
    markets.map((m) => ({
      id: m.id,
      question: m.question,
      yesPct: m.yesPct,
      volume: m.volume,
      volume24hr: m.volume24hr,
      url: m.url,
      weird: m.weird?.score,
      india: !!m.weird?.breakdown?.india,
      linkup: m.linkup || undefined,
    })),
    null, 2
  ));

  // Human summary.
  console.log("\n=== top weird right now ===");
  for (const m of markets) {
    const dollars = "$" + Math.round(m.volume).toLocaleString();
    const odds = m.yesPct == null ? "??%" : m.yesPct + "% YES";
    console.log(`[${String(m.weird?.score).padStart(2)}] ${odds.padEnd(9)} ${dollars.padStart(12)} ${m.weird?.breakdown?.india ? "🇮🇳" : "  "} ${m.question}`);
  }
})().catch((e) => { console.error("hunt failed:", e.message); process.exit(1); });
