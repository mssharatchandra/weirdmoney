export type LiveMarket = {
  id: string;
  question: string;
  url: string;
  yesPct: number | null;
  volume: number;
  weird?: { score: number };
};

export async function getLiveMarket(id: string): Promise<LiveMarket | null> {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return null;
  try {
    // Shared pages only originate from the current Weird Index. Fetching the
    // safety-filtered feed keeps OG cards under the same editorial rails.
    const response = await fetch("https://wyrd-money.vercel.app/api/weird?limit=25", {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { markets?: LiveMarket[] };
    return data.markets?.find((market) => market.id === id) ?? null;
  } catch {
    return null;
  }
}

export function compactMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}
