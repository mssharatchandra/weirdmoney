// Signup endpoint — proxies to Convex, the single source of truth shared by
// the web app and Telegram bot.

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function convexBase(): string | null {
  // WYRD_CONVEX_URL = https://<deployment>.convex.site
  return process.env.WYRD_CONVEX_URL || null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; source?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const source = body.source?.trim().slice(0, 40) || "landing";

    if (!emailPattern.test(email)) {
      return Response.json({ error: "enter a real email, mysterious stranger" }, { status: 400 });
    }

    const base = convexBase();
    if (!base) {
      return Response.json({ error: "the vault is still booting. try again shortly." }, { status: 503 });
    }

    const r = await fetch(`${base}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    if (!r.ok) {
      return Response.json({ error: "the internet blinked. try again." }, { status: 502 });
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "the internet blinked. try again." }, { status: 500 });
  }
}
