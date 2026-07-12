// Weird Index gateway. Runs server-side on Vercel, so it can reach Polymarket
// even when a visitor's ISP cannot. Returns scored, safety-filtered markets.
import { rankWeird, normalizeMarket } from "../../../lib/weird.mjs";

const GAMMA = "https://gamma-api.polymarket.com";
// Gamma caps a page at 100 records. Scan enough high-volume and newly-created
// pages to find genuinely odd premises instead of filling the index with plain
// sports/politics markets that merely have extreme prices.
const SLICES = [
  ...Array.from({ length: 6 }, (_, page) =>
    `/markets?active=true&closed=false&limit=100&offset=${page * 100}&order=volume24hr&ascending=false`),
  ...Array.from({ length: 4 }, (_, page) =>
    `/markets?active=true&closed=false&limit=100&offset=${page * 100}&order=startDate&ascending=false`),
];

async function fetchDirect(path: string): Promise<unknown[]> {
  const r = await fetch(`${GAMMA}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "wyrd/1.0" },
    next: { revalidate: 60 },
  });
  return r.ok ? ((await r.json()) as unknown[]) : [];
}

// Dev-only: r.jina.ai fetches server-side (outside IN) and escapes " -> \".
async function fetchViaJina(path: string): Promise<unknown[]> {
  const r = await fetch(`https://r.jina.ai/${GAMMA}${path}`, {
    headers: { "X-Return-Format": "text" },
  });
  if (!r.ok) return [];
  let d = (await r.text()).trim();
  const s = d.indexOf("["); if (s > 0) d = d.slice(s);
  const e = d.lastIndexOf("]"); if (e > 0) d = d.slice(0, e + 1);
  // Jina returns EITHER clean JSON OR a fully "-escaped doc. Try clean first;
  // only reverse the escaping (which would corrupt clean nested strings) on failure.
  try { return JSON.parse(d) as unknown[]; }
  catch {
    try { return JSON.parse(d.replace(/\\(["\\])/g, "$1")) as unknown[]; }
    catch { return []; }
  }
}

async function pull(path: string): Promise<unknown[]> {
  try {
    const direct = await fetchDirect(path);
    if (direct.length) return direct;
  } catch { /* blocked locally — fall through */ }
  try { return await fetchViaJina(path); } catch { return []; }
}

function diversityKey(market: Record<string, unknown>): string {
  const q = String(market.question || "").toLowerCase();
  const celebrity = /(kim kardashian|mrbeast|oprah winfrey|elon musk|kanye|taylor swift|drake)/.test(q);
  if (celebrity && /(president|presidential nomination)/.test(q)) return "celebrity-president";
  return q
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/g, "date")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim();
}

function diversify(markets: Record<string, unknown>[], limit: number) {
  const picked: Record<string, unknown>[] = [];
  const used = new Set<string>();
  for (const market of markets) {
    const key = diversityKey(market);
    if (used.has(key)) continue;
    used.add(key);
    picked.push(market);
    if (picked.length === limit) break;
  }
  return picked;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 25);
  const exclude = (url.searchParams.get("exclude") || "").split(",").map((s) => s.trim()).filter(Boolean);

  const slices = await Promise.all(SLICES.map(pull));
  const seen = new Set<string>();
  const all: unknown[] = [];
  for (const arr of slices) {
    for (const m of arr) {
      const id = String((m as { id?: unknown }).id ?? "");
      if (id && !seen.has(id)) { seen.add(id); all.push(m); }
    }
  }

  // The public index doubles as the publish queue. Only admit unambiguous,
  // current Yes/No markets so an odds label can never be mapped to the wrong
  // named outcome and stale active flags cannot leak resolved games.
  const publishable = all
    .map((market) => normalizeMarket(market) as Record<string, unknown>)
    .filter((market) => {
      const outcomes = (market.outcomes || []) as unknown[];
      const binary = outcomes.length === 2
        && String(outcomes[0]).toLowerCase() === "yes"
        && String(outcomes[1]).toLowerCase() === "no";
      const question = String(market.question || "").trim();
      const endDate = market.endDate ? Date.parse(String(market.endDate)) : Number.NaN;
      const current = !Number.isFinite(endDate) || endDate >= Date.now();
      return binary && current && question.length >= 18;
    });

  const candidates = rankWeird(publishable, { limit: Math.max(60, limit * 6), excludeIds: exclude });
  const ranked = diversify(candidates, limit)
    .map(({ __wyrd, ...m }: Record<string, unknown>) => m);

  return Response.json(
    { count: ranked.length, markets: ranked },
    { headers: { "Cache-Control": "public, max-age=60", "Access-Control-Allow-Origin": "*" } }
  );
}
