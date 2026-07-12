export async function GET() {
  try {
    const base = process.env.WYRD_CONVEX_URL;
    if (!base) return Response.json({ error: "proof ledger unavailable" }, { status: 503 });
    const response = await fetch(`${base}/api/viralStats`, {
      next: { revalidate: 5 },
    });
    const result = await response.json();
    return Response.json(result, {
      status: response.status,
      headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30" },
    });
  } catch {
    return Response.json({ error: "proof ledger unavailable" }, { status: 500 });
  }
}
