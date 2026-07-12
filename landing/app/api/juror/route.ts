import { JUROR_COOKIE, cookieValue, createJurorToken, verifyJurorToken } from "../../../lib/juror-token";

export async function GET(request: Request) {
  const current = verifyJurorToken(cookieValue(request, JUROR_COOKIE));
  if (current) return Response.json({ id: current });

  const created = createJurorToken();
  if (!created) return Response.json({ error: "jury identity unavailable" }, { status: 503 });
  return Response.json(
    { id: created.id },
    {
      headers: {
        "Set-Cookie": `${JUROR_COOKIE}=${encodeURIComponent(created.token)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`,
        "Cache-Control": "no-store",
      },
    },
  );
}
