// WYRD data gateway — Cloudflare Worker.
// Runs on Cloudflare's edge (outside India) so it can reach Polymarket,
// which is DNS + network blocked on Indian ISPs. The Mac agent and the
// landing page call THIS worker; nothing local ever touches Polymarket.
//
// Routes:
//   GET /weird?limit=5&exclude=id1,id2   -> scored, safety-filtered top markets
//   GET /markets?limit=200               -> normalized raw feed
//   GET /health                          -> ok + upstream reachability
//
// Response is cached at the edge for 60s (cf cacheTtl) to stay well under
// any Polymarket rate limit even with a 30-min posting loop + live ticker.

import { rankWeird, normalizeMarket } from "../../packages/core/weird.js";

const GAMMA = "https://gamma-api.polymarket.com";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...extra },
  });
}

async function fetchMarkets(limit = 200) {
  // Pull two slices: highest 24h volume (what's hot) + newest (fresh weird).
  const common =
    "active=true&closed=false&archived=false&limit=" + Math.min(limit, 500);
  const urls = [
    `${GAMMA}/markets?${common}&order=volume24hr&ascending=false`,
    `${GAMMA}/markets?${common}&order=startDate&ascending=false`,
  ];
  const results = await Promise.all(
    urls.map((u) =>
      fetch(u, {
        headers: { Accept: "application/json", "User-Agent": "wyrd/1.0" },
        cf: { cacheTtl: 60, cacheEverything: true },
      })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
    )
  );
  // Merge + dedupe by id.
  const seen = new Set();
  const merged = [];
  for (const arr of results) {
    for (const m of Array.isArray(arr) ? arr : []) {
      const id = String(m.id ?? m.conditionId ?? m.slug ?? "");
      if (id && !seen.has(id)) {
        seen.add(id);
        merged.push(m);
      }
    }
  }
  return merged;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    try {
      if (url.pathname === "/health") {
        const ms = await fetchMarkets(5);
        return json({ ok: true, upstream: ms.length > 0, sample: ms.length });
      }

      if (url.pathname === "/weird") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "5", 10), 25);
        const exclude = (url.searchParams.get("exclude") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const raw = await fetchMarkets(200);
        const ranked = rankWeird(raw, { limit, excludeIds: exclude });
        // Strip internal marker before returning.
        const clean = ranked.map(({ __wyrd, ...m }) => m);
        return json(
          { count: clean.length, markets: clean },
          200,
          { "Cache-Control": "public, max-age=60" }
        );
      }

      if (url.pathname === "/markets") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);
        const raw = await fetchMarkets(limit);
        const clean = raw.map(normalizeMarket).map(({ __wyrd, ...m }) => m);
        return json({ count: clean.length, markets: clean });
      }

      return json({ error: "not found", routes: ["/weird", "/markets", "/health"] }, 404);
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, 500);
    }
  },
};
