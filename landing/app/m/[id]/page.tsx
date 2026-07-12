import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { compactMoney, getLiveMarket } from "../../../lib/live-market";
import MarketJury from "./market-jury";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ref?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const market = await getLiveMarket(id);
  if (!market) return { title: "This market escaped the WYRD Index" };
  const odds = market.yesPct == null ? "odds unknown" : `${market.yesPct}% YES`;
  const description = `${odds} · ${compactMoney(market.volume)} on the line · judged WYRD ${market.weird?.score ?? "?"}/100`;
  return {
    title: `${market.question} — WYRD`,
    description,
    openGraph: {
      title: market.question,
      description,
      type: "website",
      images: [{ url: `/m/${id}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: market.question,
      description,
      images: [`/m/${id}/opengraph-image`],
    },
  };
}

export default async function SharedMarket({ params, searchParams }: Props) {
  const { id } = await params;
  const { ref } = await searchParams;
  const market = await getLiveMarket(id);
  if (!market) notFound();

  return (
    <main className="share-page">
      <nav className="dashboard-nav">
        <Link className="wordmark" href="/"><span className="sigil">◉</span> WYRD</Link>
        <div className="dashboard-nav-status"><span className="live-dot" /> evidence of collective decline</div>
        <div className="dashboard-nav-links"><a href="/dashboard">full index ↗</a></div>
      </nav>
      <section className="share-card-shell">
        <div className="share-card-kicker"><span>EXHIBIT #{market.id}</span><span>THE PUBLIC WEIRDNESS JURY</span></div>
        <p className="share-eyebrow">someone sent you financial evidence of internet poisoning</p>
        <h1>{market.question}</h1>
        <div className="share-market-metrics">
          <div><span>THE CROWD SAYS</span><b>{market.yesPct ?? "—"}%</b><small>YES</small></div>
          <div><span>REAL MONEY INVOLVED</span><b>{compactMoney(market.volume)}</b><small>TOTAL VOLUME</small></div>
          <div><span>WYRD VERDICT</span><b>{market.weird?.score ?? "—"}</b><small>/100</small></div>
        </div>
        <MarketJury market={market} initialReferrer={ref} />
        <p className="share-disclaimer">commentary, not financial advice. WYRD does not take positions. it takes screenshots.</p>
      </section>
    </main>
  );
}
