"use client";

import { useEffect, useState } from "react";
import type { LiveMarket } from "../../../lib/live-market";

async function visitorId(): Promise<string> {
  const response = await fetch("/api/juror", { cache: "no-store" });
  if (!response.ok) return "";
  const data = (await response.json()) as { id?: string };
  return data.id || "";
}

export default function MarketJury({ market, initialReferrer }: { market: LiveMarket; initialReferrer?: string }) {
  const [nominated, setNominated] = useState(false);
  const [juror, setJuror] = useState("");

  useEffect(() => {
    void visitorId().then((id) => {
      setJuror(id);
      setNominated(localStorage.getItem(`wyrd-nominated:${market.id}`) === "1");
    });
    if (initialReferrer) localStorage.setItem("wyrd-referrer", initialReferrer);
  }, [initialReferrer, market.id]);

  async function nominate() {
    if (!juror || nominated) return;
    setNominated(true);
    localStorage.setItem(`wyrd-nominated:${market.id}`, "1");
    await fetch("/api/viral-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: juror,
        kind: "nominate",
        marketId: market.id,
        question: market.question,
        referrer: initialReferrer || localStorage.getItem("wyrd-referrer") || undefined,
      }),
    }).catch(() => undefined);
  }

  const evidenceUrl = juror
    ? `https://wyrd-money.vercel.app/m/${encodeURIComponent(market.id)}?ref=${encodeURIComponent(juror)}`
    : `https://wyrd-money.vercel.app/m/${encodeURIComponent(market.id)}`;
  const evidenceCopy = `${market.question}\n\nthis has been convicted by the public weirdness jury.`;

  async function recordShare(channel: "x" | "whatsapp" | "native" | "copy") {
    if (!juror) return;
    await fetch("/api/viral-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId: juror,
        kind: "share",
        marketId: market.id,
        question: market.question,
        channel,
        referrer: initialReferrer || localStorage.getItem("wyrd-referrer") || undefined,
      }),
    }).catch(() => undefined);
  }

  async function shareEvidence() {
    if (navigator.share) {
      await navigator.share({ title: "WYRD public evidence", text: evidenceCopy, url: evidenceUrl }).catch(() => undefined);
      await recordShare("native");
      return;
    }
    await navigator.clipboard.writeText(evidenceUrl);
    await recordShare("copy");
  }

  return (
    <div className="share-jury-action">
      <button type="button" onClick={nominate} disabled={!juror || nominated}>
        {nominated ? "CONVICTED OF BEING WEIRD ✓" : "NOMINATE THIS AS THE WEIRDEST →"}
      </button>
      {nominated ? (
        <div className="share-verdict-buttons">
          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(evidenceCopy)}&url=${encodeURIComponent(evidenceUrl)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => recordShare("x")}
          >post verdict on X</a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${evidenceCopy}\n\n${evidenceUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => recordShare("whatsapp")}
          >send to WhatsApp</a>
          <button type="button" onClick={shareEvidence}>share evidence</button>
        </div>
      ) : <a href="/dashboard">inspect the other suspects</a>}
    </div>
  );
}
