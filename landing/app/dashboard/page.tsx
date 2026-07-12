"use client";

import { useEffect, useMemo, useState } from "react";

type Market = {
  id: string;
  question: string;
  url: string;
  yesPct: number | null;
  volume: number;
  volume24hr?: number;
  weird?: { score: number; breakdown?: { india?: boolean } };
};

function money(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "m";
  if (n >= 1_000) return "$" + Math.round(n / 1000) + "k";
  return "$" + Math.round(n);
}

function shareCopy(market: Market): string {
  const odds = market.yesPct == null ? "odds unavailable" : `${market.yesPct}% YES`;
  return `${market.question}\n${odds} · ${money(market.volume)} total volume\n\ncommentary, not financial advice. we don't bet, we watch.`;
}

function shareUrl(platform: "x" | "telegram", market: Market): string {
  const dashboard = "https://wyrd-money.vercel.app/dashboard";
  const text = encodeURIComponent(shareCopy(market));
  if (platform === "x") {
    return `https://x.com/intent/post?text=${text}&url=${encodeURIComponent(dashboard)}`;
  }
  return `https://t.me/share/url?url=${encodeURIComponent(dashboard)}&text=${text}`;
}

export default function Dashboard() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/weird?limit=10");
        if (!response.ok) throw new Error("feed unavailable");
        const data = (await response.json()) as { markets: Market[] };
        if (alive) {
          setMarkets(data.markets || []);
          setUpdatedAt(new Date());
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const totalVolume = useMemo(
    () => markets?.reduce((sum, market) => sum + market.volume, 0) || 0,
    [markets],
  );

  return (
    <main className="dashboard-shell">
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <a className="wordmark" href="/"><span className="sigil">◉</span> WYRD</a>
        <div className="dashboard-nav-status"><span className="live-dot" /> live cultural telemetry</div>
        <div className="dashboard-nav-links">
          <a href="/x">X feed</a>
          <a className="dashboard-nav-primary" href="/telegram">get the bot ↗</a>
        </div>
      </nav>

      <header className="dashboard-hero">
        <div className="dashboard-kicker">
          <span>edition 001 / internet</span>
          <span>{updatedAt ? `updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "establishing signal"}</span>
        </div>
        <div className="dashboard-title-row">
          <h1>the weird<br /><em>index™</em></h1>
          <div className="dashboard-intro">
            <p>ten live markets ranked by premise damage, cultural heat, and the amount of money reality has somehow attracted.</p>
            <span>polymarket is unavailable in india. we watch. you point and laugh.</span>
          </div>
        </div>
        <div className="dashboard-stats" aria-label="Index summary">
          <div><b>{markets?.length ?? "—"}</b><span>live specimens</span></div>
          <div><b>{markets ? money(totalVolume) : "—"}</b><span>combined volume</span></div>
          <div><b>60s</b><span>refresh cycle</span></div>
          <div><b>0</b><span>betting tips</span></div>
        </div>
      </header>

      <section className="market-terminal" aria-labelledby="terminal-title">
        <div className="terminal-head">
          <div>
            <span className="terminal-light" />
            <span id="terminal-title">WYRD PUBLIC TERMINAL</span>
          </div>
          <span>ODDS ARE OBSERVATIONS, NOT TRUTH</span>
        </div>

        {error && <div className="terminal-message error">the feed blinked. holding the last known reality.</div>}
        {!markets && !error && <div className="terminal-message">reading the internet&apos;s weird money…</div>}

        <div className="market-list">
          {markets?.map((market, index) => (
            <article className={`index-card ${index === 0 ? "index-card-featured" : ""}`} key={market.id}>
              <div className="index-rank">{String(index + 1).padStart(2, "0")}</div>
              <div className="index-story">
                <div className="index-tags">
                  {market.weird?.breakdown?.india && <span>india signal</span>}
                  <span>market #{market.id}</span>
                </div>
                <h2>{market.question}</h2>
                <div className="index-actions">
                  <a href={market.url} target="_blank" rel="noreferrer">view source ↗</a>
                  <a href={shareUrl("x", market)} target="_blank" rel="noreferrer" aria-label={`Share ${market.question} on X`}>share on X</a>
                  <a href={shareUrl("telegram", market)} target="_blank" rel="noreferrer" aria-label={`Share ${market.question} on Telegram`}>send to Telegram</a>
                </div>
              </div>
              <div className="index-metric">
                <span>market odds</span>
                <b>{market.yesPct == null ? "—" : market.yesPct + "%"}</b>
                <small>YES</small>
              </div>
              <div className="index-metric">
                <span>total volume</span>
                <b>{money(market.volume)}</b>
                <small>all time</small>
              </div>
              <div className="index-weird">
                <span>WYRD</span>
                <b>{market.weird?.score ?? "—"}</b>
                <small>/100</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="distribution-strip">
        <div>
          <span>HERMES DISTRIBUTION LOOP</span>
          <h2>one strange market.<br />everywhere it needs to be.</h2>
        </div>
        <div className="distribution-flow" aria-label="Publishing workflow">
          <span>01 · hermes curates</span><i>→</i><span>02 · X gets the joke</span><i>→</i><span>03 · Telegram gets the drop</span>
        </div>
        <a className="mega-cta" href="/join">join the next drop <span>↗</span></a>
      </section>

      <footer className="dashboard-footer">
        <span>WYRD / BUILT IN BANGALORE</span>
        <span>commentary, not financial advice.</span>
        <a href="/">back to transmission ↑</a>
      </footer>
      <a className="telegram-float" href="/telegram" aria-label="Open the WYRD Telegram bot">
        <span>↗</span> Telegram bot
      </a>
    </main>
  );
}
