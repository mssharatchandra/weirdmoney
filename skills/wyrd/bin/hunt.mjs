#!/usr/bin/env node
// WYRD hunt — fetch the weirdest live markets from the CF gateway (which already
// scores + safety-filters them), minus anything we've posted recently, and print
// candidates for the writer. Never calls Polymarket directly (India-blocked).
//
// Env: WYRD_GATEWAY_URL (required)  WYRD_CONVEX_URL (optional, for dedupe)
// Usage: node hunt.mjs [limit]

const GATEWAY = process.env.WYRD_GATEWAY_URL;
const CONVEX = process.env.WYRD_CONVEX_URL; // e.g. https://<dep>.convex.site
const limit = parseInt(process.argv[2] || "5", 10);

if (!GATEWAY) {
  console.error("ERROR: set WYRD_GATEWAY_URL to your deployed CF worker (e.g. https://wyrd-gateway.<you>.workers.dev)");
  process.exit(1);
}

async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
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
  const q = new URLSearchParams({ limit: String(limit) });
  if (exclude.length) q.set("exclude", exclude.join(","));
  const { markets = [] } = await getJSON(`${GATEWAY}/weird?${q}`);

  if (!markets.length) {
    console.log("no fresh weird markets right now (all recent ones already posted, or gateway empty).");
    process.exit(0);
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
