import { getDb } from "../../../db";
import { signups } from "../../../db/schema";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; source?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const source = body.source?.trim().slice(0, 40) || "prelaunch";

    if (!emailPattern.test(email)) {
      return Response.json({ error: "enter a real email, mysterious stranger" }, { status: 400 });
    }

    const db = getDb();
    await db.insert(signups).values({ email, source }).onConflictDoNothing();
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected error";
    return Response.json({ error: message.includes("no such table") ? "the vault is still booting. try again shortly." : "the internet blinked. try again." }, { status: 500 });
  }
}
