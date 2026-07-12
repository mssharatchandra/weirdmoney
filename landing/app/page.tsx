"use client";

import { FormEvent, useState } from "react";

const lockedBets = [
  { rank: "01", odds: "??%", volume: "$???,???", score: "99" },
  { rank: "02", odds: "??%", volume: "$??,???", score: "97" },
  { rank: "03", odds: "??%", volume: "$???,???", score: "94" },
  { rank: "04", odds: "??%", volume: "$??,???", score: "91" },
  { rank: "05", odds: "??%", volume: "$???,???", score: "88" },
  { rank: "06", odds: "??%", volume: "$??,???", score: "85" },
  { rank: "07", odds: "??%", volume: "$??,???", score: "83" },
  { rank: "08", odds: "??%", volume: "$??,???", score: "80" },
  { rank: "09", odds: "??%", volume: "$??,???", score: "77" },
  { rank: "10", odds: "??%", volume: "$??,???", score: "74" },
];

function SignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "prelaunch" }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "could not join");
      setStatus("success");
      setMessage("you’re in. the weird will find you.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "something went sideways");
    }
  }

  return (
    <div className="signup-wrap" id="join">
      <form className="signup-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          required
          disabled={status === "loading"}
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "joining…" : "get the first drop"}
        </button>
      </form>
      <p className={`form-note ${status}`} aria-live="polite">
        {message || "one email when the vault opens. no tips. no spam. just strange money."}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <nav className="nav-shell" aria-label="Main navigation">
        <a className="wordmark" href="#top" aria-label="WYRD home">
          <span className="sigil">◉</span> WYRD
        </a>
        <div className="nav-meta">
          <span className="live-dot" /> scanning the timeline
        </div>
        <a className="nav-cta" href="/dashboard">open the weird index →</a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-noise" aria-hidden="true" />
        <div className="eyebrow"><span>PRE-LAUNCH TRANSMISSION</span><span>BLR / INTERNET</span></div>
        <h1>
          THE INTERNET&apos;S
          <span>WEIRD MONEY.</span>
        </h1>
        <div className="hero-bottom">
          <p className="hero-copy">
            an autonomous cultural desk hunting the strangest things people are putting actual money on—then reporting back in fluent internet.
          </p>
          <SignupForm />
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>ODDS</span><span>MEMES</span><span>REGRETS</span>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          <span>NO BETTING TIPS</span><b>◆</b><span>ONLY OBSERVATIONS</span><b>◆</b><span>THE NUMBERS ARE THE JOKE</span><b>◆</b><span>WEIRD ≠ DARK</span><b>◆</b>
          <span>NO BETTING TIPS</span><b>◆</b><span>ONLY OBSERVATIONS</span><b>◆</b><span>THE NUMBERS ARE THE JOKE</span><b>◆</b><span>WEIRD ≠ DARK</span><b>◆</b>
        </div>
      </div>

      <section className="index-section">
        <div className="section-head">
          <div>
            <p className="kicker">LIVE NOW</p>
            <h2>THE WEIRD<br />INDEX™</h2>
          </div>
          <div className="index-explainer">
            <p>ten markets. ranked by absurdity, money on the line, and how badly they have broken containment.</p>
            <div className="legend"><span>● CULTURAL HEAT</span><span>● MONEY VELOCITY</span><span>● PREMISE DAMAGE</span></div>
          </div>
        </div>

        <div className="vault" aria-label="Preview of the live top ten markets">
          <div className="vault-bar">
            <span>WYRD TERMINAL / PUBLIC FEED</span>
            <span className="vault-status">● LIVE INDEX ONLINE</span>
          </div>
          <div className="market-header">
            <span>#</span><span>MARKET</span><span>ODDS</span><span>VOLUME</span><span>WYRD</span>
          </div>
          {lockedBets.map((bet, index) => (
            <div className="market-row" key={bet.rank} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}>
              <span className="rank">{bet.rank}</span>
              <span className="redacted">
                <i style={{ width: `${72 - index * 3}%` }} />
                <em>classified cultural event</em>
              </span>
              <span className="odds">{bet.odds}</span>
              <span>{bet.volume}</span>
              <span className="score"><b>{bet.score}</b>/100</span>
            </div>
          ))}
          <div className="vault-lock">
            <span className="lock-glyph">⌁</span>
            <p>the odds exist.<br />the top ten are now live.</p>
            <a href="/dashboard">open the weird index →</a>
          </div>
        </div>
      </section>

      <section className="manifesto">
        <div className="manifesto-label">OUR ENTIRE EDITORIAL POLICY</div>
        <blockquote>
          “report the odds.<br />never explain the joke.”
        </blockquote>
        <div className="principles">
          <article><span>01</span><h3>HERMES HUNTS</h3><p>scans public markets for unusual premises, suspiciously large conviction, and things the group chat needs to see.</p></article>
          <article><span>02</span><h3>MEMOLOGY, APPLIED</h3><p>context without content sludge. fluent in internet; allergic to brand voice and borrowed templates.</p></article>
          <article><span>03</span><h3>YOU GET THE DROP</h3><p>the top ten, the funniest line movements, and precisely zero instructions on what to do with your money.</p></article>
        </div>
      </section>

      <section className="final-cta">
        <p className="kicker">DROP 001 IS IMMINENT</p>
        <h2>REAL MONEY.<br /><span>DEEPLY UNREAL BETS.</span></h2>
        <a className="mega-cta" href="#join">GET ON THE LIST <span>↗</span></a>
      </section>

      <footer>
        <div><span className="wordmark"><span className="sigil">◉</span> WYRD</span><p>the internet&apos;s weird money.</p></div>
        <p>commentary and cultural observation only.<br />we don&apos;t bet. we watch.</p>
        <p className="build-note">CURATED BY HERMES<br />BUILT IN BANGALORE</p>
      </footer>
    </main>
  );
}
