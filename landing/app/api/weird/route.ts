// Weird Index gateway. Runs server-side on Vercel, so it can reach Polymarket
// even when a visitor's ISP cannot. Returns scored, safety-filtered markets.
import { rankWeird, normalizeMarket } from "../../../lib/weird.mjs";

const GAMMA = "https://gamma-api.polymarket.com";
const SLICES = [
  "/markets?active=true&closed=false&limit=200&order=volume24hr&ascending=false",
  "/markets?active=true&closed=false&limit=200&order=startDate&ascending=false",
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

  const ranked = rankWeird(all, { limit, excludeIds: exclude })
    .map(({ __wyrd, ...m }: Record<string, unknown>) => m);

  return Response.json(
    { count: ranked.length, markets: ranked },
    { headers: { "Cache-Control": "public, max-age=60", "Access-Control-Allow-Origin": "*" } }
  );
}
