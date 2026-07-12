// WYRD weird-scoring core — pure functions, no network, no deps.
// Shared by the Cloudflare Worker (data gateway) and the Hermes skills.
// A "market" here is a raw Polymarket Gamma API market object.

// Gamma returns some fields as JSON-encoded strings ("[\"Yes\",\"No\"]").
function parseMaybeJSON(v, fallback) {
  if (v == null) return fallback;
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

function num(v) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

// Normalize a raw Gamma market into the shape WYRD uses everywhere.
// Idempotent: an already-normalized market (has yesPct) is returned as-is.
function normalizeMarket(m) {
  if (m && m.__wyrd) return m;
  const outcomes = parseMaybeJSON(m.outcomes, []);
  const prices = parseMaybeJSON(m.outcomePrices, []).map(num);
  // YES price: first outcome named "Yes", else first outcome.
  let yesIdx = outcomes.findIndex((o) => String(o).toLowerCase() === "yes");
  if (yesIdx < 0) yesIdx = 0;
  const yesPrice = prices[yesIdx] != null ? prices[yesIdx] : null;
  return {
    __wyrd: true,
    id: String(m.id ?? m.conditionId ?? m.slug ?? ""),
    slug: m.slug ?? "",
    question: m.question ?? m.title ?? "",
    url: m.slug ? `https://polymarket.com/market/${m.slug}` : "https://polymarket.com",
    outcomes,
    yesPrice, // 0..1 or null
    yesPct: yesPrice == null ? null : Math.round(yesPrice * 100),
    volume: num(m.volume),
    volume24hr: num(m.volume24hr),
    liquidity: num(m.liquidity),
    endDate: m.endDate ?? null,
    closed: !!m.closed,
    active: m.active !== false,
  };
}

// --- Weirdness heuristics -------------------------------------------------
// The joke is "$X riding on [absurd thing]". Score rewards: absurd premise,
// big money on absurdity, extreme/longshot odds, and India/pop recognizability.

const ABSURD_WORDS = [
  "alien", "ufo", "bigfoot", "loch ness", "god", "jesus", "pope", "antichrist",
  "time travel", "simulation", "zombie", "ghost", "psychic", "curse",
  "banana", "cheese", "pizza", "hot dog", "taco", "burrito", "nugget",
  "kiss", "divorce", "dating", "breakup", "engaged", "baby", "pregnant",
  "tweet", "say the word", "on stream", "livestream", "emoji", "meme",
  "cat", "dog", "bird", "penguin", "monkey", "shark", "dolphin", "goat",
  "haircut", "cry", "laugh", "fight", "beef", "diss", "roast",
  "flat earth", "conspiracy", "lizard", "illuminati", "reptilian",
  "wed", "marry", "cheat", "arrested", "jail", "streak", "naked",
  "mustache", "beard", "weight", "height", "name their", "rename",
];

const INDIA_WORDS = [
  "india", "modi", "rahul", "bjp", "congress", "rupee", "rbi", "sensex",
  "nifty", "bollywood", "cricket", "ipl", "kohli", "rohit", "bumrah",
  "dhoni", "ambani", "adani", "delhi", "mumbai", "bcci",
  // note: NOT generic "world cup" — FIFA isn't India-relevant. Cricket words above.
];

const POP_WORDS = [
  "taylor swift", "elon", "musk", "kanye", "ye", "drake", "mrbeast",
  "messi", "ronaldo", "gta", "netflix", "spotify", "kardashian", "kim k",
  "openai", "chatgpt", "nvidia", "oprah", "rock", "dwayne", "beyonce",
  "grimes", "zuckerberg", "bezos", "andrew tate", "logan paul", "jake paul",
];

// "[celebrity/entertainer] running for high office" is peak-weird even at $0 absurd
// keyword hits (e.g. "Kim Kardashian for President"). Detect the collision.
const OFFICE_WORDS = ["president", "prime minister", "governor", "mayor", "senate", "congress", "nobel", "pope", "knighted"];

// Word-boundary matching so "dog" doesn't hit "Dogecoin" or "cat" hit "category".
// Multi-word phrases ("loch ness") are matched as substrings (they're specific).
function hits(text, words) {
  let n = 0;
  for (const w of words) {
    if (w.includes(" ")) { if (text.includes(w)) n++; continue; }
    const re = new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (re.test(text)) n++;
  }
  return n;
}

// Returns { score:0..100, breakdown:{...} } for a NORMALIZED market.
function weirdScore(nm) {
  const q = (nm.question || "").toLowerCase();

  // 1) Absurdity of premise (0..40) — the heaviest lever.
  let absurdHits = hits(q, ABSURD_WORDS);
  // celebrity + high office = absurd collision ("Kim Kardashian for President").
  // office words use substring match so "presidential" counts as "president".
  const popHitsForOffice = hits(q, POP_WORDS);
  const officeHit = OFFICE_WORDS.some((w) => q.includes(w));
  if (popHitsForOffice > 0 && officeHit) absurdHits += 2;
  const absurdity = Math.min(40, absurdHits * 16);

  // 2) Money on the line (0..22) — log-scaled; $ is what upgrades a joke.
  const money = nm.volume > 0 ? Math.min(22, Math.log10(nm.volume + 1) * 4.2) : 0;

  // 3) Longshot drama (0..18) — extreme odds are funnier ("3% YES, $2M in").
  //    Peaks near 0% and 100%, min at 50/50.
  let longshot = 0;
  if (nm.yesPrice != null) {
    const edge = Math.abs(nm.yesPrice - 0.5); // 0..0.5
    longshot = Math.round((edge / 0.5) * 18);
  }

  // 4) Live heat (0..8) — 24h volume means people are actively betting now.
  const heat = nm.volume24hr > 0 ? Math.min(8, Math.log10(nm.volume24hr + 1) * 2) : 0;

  // 5) Recognizability bonus (0..12) — India lane weighted highest.
  const indiaBonus = Math.min(12, hits(q, INDIA_WORDS) * 12);
  const popBonus = Math.min(6, hits(q, POP_WORDS) * 6);
  const recognizability = Math.min(12, indiaBonus + popBonus);

  // Weirdness is the primary axis. Money/longshot/heat are AMPLIFIERS of a weird
  // premise, not weird on their own — a boring expensive longshot is not weird.
  // So when there's no absurd hook AND nothing recognizable, cap hard.
  const hasHook = absurdity > 0;
  const attention = money + longshot + heat; // 0..48
  let raw;
  if (hasHook) {
    raw = absurdity + recognizability + attention; // full credit
  } else if (recognizability > 0) {
    // recognizable but not absurd (e.g. a big cricket/celeb market): mild credit
    raw = recognizability + attention * 0.45;
  } else {
    // just an expensive bet — mildly interesting at most
    raw = Math.min(28, attention * 0.5);
  }
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    breakdown: {
      absurdity: Math.round(absurdity),
      money: Math.round(money),
      longshot,
      heat: Math.round(heat),
      recognizability: Math.round(recognizability),
      india: indiaBonus > 0,
    },
  };
}

// Rank normalized markets by weird score, filtering junk + safety.
function rankWeird(markets, { limit = 5, excludeIds = [] } = {}) {
  const excluded = new Set(excludeIds.map(String));
  return markets
    .map((m) => normalizeMarket(m))
    .filter((nm) => nm.question && !nm.closed && nm.active)
    .filter((nm) => nm.volume >= 1000) // skip dust markets
    .filter((nm) => isSafe(nm)) // hard safety rail
    .filter((nm) => !excluded.has(nm.id))
    .map((nm) => ({ ...nm, weird: weirdScore(nm) }))
    .sort((a, b) => b.weird.score - a.weird.score)
    .slice(0, limit);
}

// --- Safety rail ----------------------------------------------------------
// weird != dark. Never surface markets about death/tragedy/minors/etc.
const BANNED = [
  "die", "dies", "death", "dead", "kill", "killed", "assassinat",
  "suicide", "shooting", "shooter", "massacre", "terror", "bomb",
  "war crime", "genocide", "hostage", "kidnap", "rape", "abuse",
  "child", "minor", "teen", "underage", "overdose", "hospitalized",
  "cancer", "illness", "coma", "nuclear strike", "casualt",
];
function isSafe(nm) {
  const q = (nm.question || "").toLowerCase();
  return !BANNED.some((w) => q.includes(w));
}

module.exports = {
  parseMaybeJSON, num, normalizeMarket, weirdScore, rankWeird, isSafe,
  ABSURD_WORDS, INDIA_WORDS, POP_WORDS,
};
