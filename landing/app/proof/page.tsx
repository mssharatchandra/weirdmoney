import Link from "next/link";

export const dynamic = "force-dynamic";

type ViralStats = {
  uniqueJurors: number;
  nominations: number;
  shares: number;
  referredJurors: number;
  topMarkets: Array<{ marketId: string; question: string; nominations: number }>;
  updatedAt: number;
};

type CoreStats = { signups: number; linked: number; posts: number };

async function proofData(): Promise<{ viral: ViralStats | null; core: CoreStats | null }> {
  const base = process.env.WYRD_CONVEX_URL;
  if (!base) return { viral: null, core: null };
  try {
    const [viralResponse, coreResponse] = await Promise.all([
      fetch(`${base}/api/viralStats`, { cache: "no-store" }),
      fetch(`${base}/api/stats`, { cache: "no-store" }),
    ]);
    return {
      viral: viralResponse.ok ? await viralResponse.json() : null,
      core: coreResponse.ok ? await coreResponse.json() : null,
    };
  } catch {
    return { viral: null, core: null };
  }
}

export default async function Proof() {
  const { viral, core } = await proofData();
  // Do not add the two populations: a juror may also be a signup. Until those
  // identities are explicitly linked, the conservative verifiable total wins.
  const meaningful = Math.max(core?.signups ?? 0, viral?.uniqueJurors ?? 0);
  const band = meaningful >= 251 ? "L5" : meaningful >= 101 ? "L4" : meaningful >= 26 ? "L3" : meaningful >= 6 ? "L2" : "L1";

  return (
    <main className="proof-page">
      <nav className="dashboard-nav">
        <Link className="wordmark" href="/"><span className="sigil">◉</span> WYRD</Link>
        <div className="dashboard-nav-status"><span className="live-dot" /> judge mode / live data</div>
        <div className="dashboard-nav-links"><a href="/dashboard">product ↗</a></div>
      </nav>
      <header className="proof-hero">
        <span>NO DECKS. NO SCREENSHOTS. NO CREATIVE ACCOUNTING.</span>
        <h1>the live<br /><em>proof ledger.</em></h1>
        <p>public counters read directly from the production Convex deployment. test traffic is not seeded. jury identities are pseudonymous and deduplicated.</p>
      </header>
      <section className="proof-scoreboard">
        <div className="proof-level"><span>CURRENT MEANINGFUL-ACTION BAND</span><b>{band}</b><small>{meaningful} conservative verified people</small></div>
        <div><span>EMAIL / TELEGRAM SIGNUPS</span><b>{core?.signups ?? "—"}</b><small>backend-verified people</small></div>
        <div><span>UNIQUE PUBLIC JURORS</span><b>{viral?.uniqueJurors ?? "—"}</b><small>one browser identity, counted once</small></div>
        <div><span>SHARE INTENTS</span><b>{viral?.shares ?? "—"}</b><small>deduped per market and channel</small></div>
        <div><span>REFERRED JURORS</span><b>{viral?.referredJurors ?? "—"}</b><small>arrived through another juror&apos;s card</small></div>
        <div><span>AUTONOMOUS DROPS</span><b>{core?.posts ?? "—"}</b><small>published and receipt-logged</small></div>
      </section>
      <section className="proof-method">
        <div><span>01</span><h2>What counts</h2><p>An email or Telegram signup, or a person nominating at least one market. Passive pageviews do not enter this total.</p></div>
        <div><span>02</span><h2>How it is deduped</h2><p>Convex enforces one nomination per persistent browser identity and market. Share clicks are unique per channel.</p></div>
        <div><span>03</span><h2>How it compounds</h2><p>Every market has an OG evidence card carrying a referral ID. Referred jurors are measured separately from direct traffic.</p></div>
      </section>
      <section className="proof-thresholds">
        <span>HERMES BUILDATHON / VIRALITY ROOT PARAMETER</span>
        <div><i>L2</i><b>6–25</b><small>real strangers act</small></div>
        <div><i>L3</i><b>26–100</b><small>real volume</small></div>
        <div><i>L4</i><b>101–250</b><small>breakout</small></div>
        <div><i>L5</i><b>251+</b><small>compounding distribution</small></div>
      </section>
      <footer><span>UPDATED {viral ? new Date(viral.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "WHEN THE LEDGER RETURNS"}</span><span>COMMENTARY, NOT FINANCIAL ADVICE.</span><a href="/dashboard">enter the jury →</a></footer>
    </main>
  );
}
