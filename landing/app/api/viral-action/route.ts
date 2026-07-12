import { JUROR_COOKIE, cookieValue, verifyJurorToken } from "../../../lib/juror-token";

const allowedKinds = new Set(["nominate", "share"]);
const allowedChannels = new Set(["x", "telegram", "whatsapp", "native", "copy"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const verifiedVisitorId = verifyJurorToken(cookieValue(request, JUROR_COOKIE));
    if (!verifiedVisitorId || body.visitorId !== verifiedVisitorId) {
      return Response.json({ error: "unverified jury identity" }, { status: 401 });
    }
    if (
      typeof body.visitorId !== "string" ||
      typeof body.marketId !== "string" ||
      typeof body.question !== "string" ||
      typeof body.kind !== "string" ||
      !allowedKinds.has(body.kind) ||
      (body.channel !== undefined &&
        (typeof body.channel !== "string" || !allowedChannels.has(body.channel)))
    ) {
      return Response.json({ error: "invalid jury action" }, { status: 400 });
    }

    const base = process.env.WYRD_CONVEX_URL;
    if (!base) return Response.json({ error: "jury ledger unavailable" }, { status: 503 });
    const response = await fetch(`${base}/api/viralAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    return Response.json(result, { status: response.status });
  } catch {
    return Response.json({ error: "the jury lost the paperwork" }, { status: 500 });
  }
}
