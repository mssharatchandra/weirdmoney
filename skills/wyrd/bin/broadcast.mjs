#!/usr/bin/env node
// WYRD broadcast — log a post to Convex and push it to every Telegram subscriber.
// Called after a tweet goes out (or standalone to drop to TG). Reads the post
// payload as JSON from argv[2] or stdin.
//
// Env: WYRD_CONVEX_URL (required, https://<dep>.convex.site)
//      TELEGRAM_BOT_TOKEN (required for the TG broadcast)
// Payload: { marketId, question, text, url, format, platform? }
//   text = the exact copy to send; url = market link.

const CONVEX = process.env.WYRD_CONVEX_URL;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!CONVEX) { console.error("ERROR: set WYRD_CONVEX_URL"); process.exit(1); }

async function readPayload() {
  if (process.argv[2]) return JSON.parse(process.argv[2]);
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function post(path, body) {
  const r = await fetch(`${CONVEX}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${await r.text()}`);
  return r.json();
}
async function getJSON(path) {
  const r = await fetch(`${CONVEX}${path}`);
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

(async () => {
  const p = await readPayload();
  if (!p.text || !p.marketId) { console.error("payload needs at least { marketId, text }"); process.exit(1); }

  // 1) log the post (proof + dedupe source of truth)
  await post("/api/logPost", {
    marketId: String(p.marketId),
    question: p.question || "",
    text: p.text,
    format: p.format || "unknown",
    url: p.url || "",
    platform: p.platform || "x",
  });
  console.log("logged post to convex.");

  // 2) broadcast to telegram subscribers
  if (!TG_TOKEN) { console.log("no TELEGRAM_BOT_TOKEN set — skipped TG broadcast."); return; }
  const { subscribers = [] } = await getJSON("/api/subscribers");
  const tgText = p.url ? `${p.text}\n\n→ ${p.url}` : p.text;
  let sent = 0, failed = 0;
  for (const s of subscribers) {
    if (!s.tgUserId) continue;
    try {
      const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: s.tgUserId, text: tgText, disable_web_page_preview: false }),
      });
      if (r.ok) sent++; else failed++;
    } catch { failed++; }
    await new Promise((r) => setTimeout(r, 40)); // gentle on TG rate limits
  }
  console.log(`broadcast to telegram: ${sent} sent, ${failed} failed, of ${subscribers.length} subs.`);
})().catch((e) => { console.error("broadcast failed:", e.message); process.exit(1); });
