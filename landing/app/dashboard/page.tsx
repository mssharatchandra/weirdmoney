"use client";

import { useEffect, useState } from "react";

type Market = {
  id: string;
  question: string;
  url: string;
  yesPct: number | null;
  volume: number;
  weird?: { score: number; breakdown?: { india?: boolean } };
};

function money(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + Math.round(n / 1000) + "k";
  return "$" + Math.round(n);
}

export default function Dashboard() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/weird?limit=10");
        const d = (await r.json()) as { markets: Market[] };
        if (alive) { setMarkets(d.markets || []); setError(false); }
      } catch {
        if (alive) setError(true);
      }
    };
    load();
    const t = setInterval(load, 60_000); // refresh every 60s
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <main className="index-section">
      <div className="section-head">
        <h1>the weird index™</h1>
        <p className="index-explainer">
          live. the strangest things the internet is putting real money on right now.
          polymarket is banned in india — we watch it so you don&apos;t have to.
        </p>
      </div>

      <div className="legend">
        <span><span className="live-dot" /> live · refreshes every 60s</span>
        <span>score = how unhinged · odds = what the money believes</span>
      </div>

      <div className="ticker">
        {error && <div className="error">the feed blinked. it&apos;ll be back.</div>}
        {!markets && !error && <div className="market-row">reading the internet&apos;s weird money…</div>}
        {markets?.map((m, i) => (
          <a key={m.id} className="market-row" href={m.url} target="_blank" rel="noreferrer">
            <span className="rank">{String(i + 1).padStart(2, "0")}</span>
            <span className="score">{m.weird?.score ?? "–"}</span>
            <span className="odds">{m.yesPct == null ? "??%" : m.yesPct + "% YES"}</span>
            <span className="vault-status">{money(m.volume)}</span>
            <span className="market-q">
              {m.weird?.breakdown?.india ? "🇮🇳 " : ""}{m.question}
            </span>
          </a>
        ))}
      </div>

      <div className="final-cta">
        <a className="mega-cta" href="/join">get the weird in your inbox →</a>
        <a className="nav-cta" href="/telegram">or on telegram →</a>
      </div>
    </main>
  );
}
