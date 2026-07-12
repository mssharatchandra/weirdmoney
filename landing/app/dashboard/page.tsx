"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Market = {
  id: string;
  question: string;
  url: string;
  yesPct: number | null;
  volume: number;
  volume24hr?: number;
  weird?: { score: number; breakdown?: { india?: boolean } };
};

type ViralStats = {
  uniqueJurors: number;
  nominations: number;
  shares: number;
  referredJurors: number;
  topMarkets: Array<{ marketId: string; question: string; nominations: number }>;
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

function marketShareLink(market: Market, juror: string): string {
  return `https://wyrd-money.vercel.app/m/${encodeURIComponent(market.id)}?ref=${encodeURIComponent(juror)}`;
}

function shareUrl(platform: "x" | "telegram" | "whatsapp", market: Market, juror: string): string {
  const dashboard = marketShareLink(market, juror);
  const text = encodeURIComponent(shareCopy(market));
  if (platform === "x") {
    return `https://x.com/intent/post?text=${text}&url=${encodeURIComponent(dashboard)}`;
  }
  if (platform === "whatsapp") {
    return `https://wa.me/?text=${encodeURIComponent(`${shareCopy(market)}\n\n${dashboard}`)}`;
  }
  return `https://t.me/share/url?url=${encodeURIComponent(dashboard)}&text=${text}`;
}

async function getVisitorId(): Promise<string> {
  const response = await fetch("/api/juror", { cache: "no-store" });
  if (!response.ok) return "";
  const data = (await response.json()) as { id?: string };
  return data.id || "";
}

export default function Dashboard() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [juror, setJuror] = useState("");
  const [nominated, setNominated] = useState<Set<string>>(new Set());
  const [viralStats, setViralStats] = useState<ViralStats | null>(null);

  async function loadViralStats() {
    try {
      const response = await fetch("/api/viral-stats");
      if (response.ok) setViralStats((await response.json()) as ViralStats);
    } catch { /* the index still works if the proof counter blinks */ }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referral = params.get("ref");
    void getVisitorId().then((id) => {
      setJuror(id);
      if (referral && referral !== id) localStorage.setItem("wyrd-referrer", referral);
      const stored = new Set<string>();
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key?.startsWith("wyrd-nominated:") && localStorage.getItem(key) === "1") {
          stored.add(key.slice("wyrd-nominated:".length));
        }
      }
      setNominated(stored);
    });
    // Fetch resolves asynchronously; this does not synchronously cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadViralStats();
  }, []);

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

  async function recordAction(
    market: Market,
    kind: "nominate" | "share",
    channel?: "x" | "telegram" | "whatsapp" | "native" | "copy",
  ) {
    if (!juror) return;
    await fetch("/api/viral-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId: juror,
        kind,
        marketId: market.id,
        question: market.question,
        channel,
        referrer: localStorage.getItem("wyrd-referrer") || undefined,
      }),
    }).catch(() => undefined);
  }

  async function nominate(market: Market) {
    if (!juror || nominated.has(market.id)) return;
    setNominated((current) => new Set(current).add(market.id));
    localStorage.setItem(`wyrd-nominated:${market.id}`, "1");
    await recordAction(market, "nominate");
    await loadViralStats();
  }

  return (
    <main className="dashboard-shell">
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <Link className="wordmark" href="/"><span className="sigil">◉</span> WYRD</Link>
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

      <section className="jury-banner" aria-labelledby="jury-title">
        <div>
          <span>NEW / ONE TAP / ACTUAL DEMOCRACY, SOMEHOW</span>
          <h2 id="jury-title">the public<br />weirdness jury</h2>
        </div>
        <p>nominate the market that most convincingly proves we should not have invented probability. your verdict becomes part of the live public record.</p>
        <div className="jury-proof">
          <b>{viralStats?.uniqueJurors ?? "—"}</b>
          <span>unique jurors</span>
          <small>deduped in Convex · no refresh farming</small>
        </div>
      </section>

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
                  <a href={shareUrl("x", market, juror)} onClick={() => recordAction(market, "share", "x")} target="_blank" rel="noreferrer" aria-label={`Share ${market.question} on X`}>share evidence on X</a>
                  <a href={shareUrl("whatsapp", market, juror)} onClick={() => recordAction(market, "share", "whatsapp")} target="_blank" rel="noreferrer" aria-label={`Share ${market.question} on WhatsApp`}>send to WhatsApp</a>
                  <button className="nominate-button" type="button" disabled={!juror || nominated.has(market.id)} onClick={() => nominate(market)}>
                    {nominated.has(market.id) ? "convicted ✓" : "nominate weirdest"}
                  </button>
                  <span className="jury-count">{viralStats?.topMarkets.find((row) => row.marketId === market.id)?.nominations ?? 0} verdicts</span>
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

      <section className="proof-ledger" aria-label="Live verified distribution proof">
        <div><span>PUBLIC PROOF LEDGER</span><b>the numbers judges can actually inspect.</b><Link href="/proof">open judge mode ↗</Link></div>
        <dl>
          <div><dt>UNIQUE JURORS</dt><dd>{viralStats?.uniqueJurors ?? "—"}</dd></div>
          <div><dt>MARKETS NOMINATED</dt><dd>{viralStats?.nominations ?? "—"}</dd></div>
          <div><dt>SHARE INTENTS</dt><dd>{viralStats?.shares ?? "—"}</dd></div>
          <div><dt>REFERRED JURORS</dt><dd>{viralStats?.referredJurors ?? "—"}</dd></div>
        </dl>
        <p>every number is backed by a timestamped, deduplicated Convex event. anonymous pageviews are intentionally excluded.</p>
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
        <Link href="/">back to transmission ↑</Link>
      </footer>
      <a className="telegram-float" href="/telegram" aria-label="Open the WYRD Telegram bot">
        <span>↗</span> Telegram bot
      </a>
    </main>
  );
}
