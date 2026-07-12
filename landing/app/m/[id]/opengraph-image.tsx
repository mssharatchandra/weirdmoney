import { ImageResponse } from "next/og";
import { compactMoney, getLiveMarket } from "../../../lib/live-market";

export const alt = "A live market sentenced by the WYRD public weirdness jury";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = await getLiveMarket(id);
  const question = market?.question ?? "THIS MARKET ESCAPED CONTAINMENT";
  const odds = market?.yesPct == null ? "—" : `${market.yesPct}%`;
  const volume = market ? compactMoney(market.volume) : "—";
  const score = market?.weird?.score ?? "?";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a0a08", color: "#f2efdf", padding: "44px 52px", fontFamily: "Arial, sans-serif", border: "18px solid #d7ff3f" }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#d7ff3f", fontSize: 20, letterSpacing: 3, fontWeight: 800 }}>
        <span>WYRD / PUBLIC EVIDENCE</span><span>CASE #{id}</span>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "22px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 940 }}>
          <span style={{ color: "#ff4f24", fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>REAL MONEY. DEEPLY UNREAL PREMISE.</span>
          <div style={{ fontSize: question.length > 105 ? 47 : 58, lineHeight: 1.02, letterSpacing: -2.5, fontWeight: 900, marginTop: 20 }}>{question}</div>
        </div>
      </div>
      <div style={{ display: "flex", borderTop: "2px solid #48483f", paddingTop: 22, gap: 58, alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#85847a", fontSize: 16 }}>THE CROWD SAYS</span><b style={{ fontSize: 44 }}>{odds} YES</b></div>
        <div style={{ display: "flex", flexDirection: "column" }}><span style={{ color: "#85847a", fontSize: 16 }}>MONEY INVOLVED</span><b style={{ fontSize: 44 }}>{volume}</b></div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: "auto", background: "#ff4f24", color: "#0a0a08", padding: "14px 22px" }}><span style={{ fontSize: 15, fontWeight: 800 }}>WYRD VERDICT</span><b style={{ fontSize: 52 }}>{score}/100</b></div>
      </div>
    </div>,
    size,
  );
}
