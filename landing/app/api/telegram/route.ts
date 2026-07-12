type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number };
    from?: { id?: number; username?: string };
  };
};

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("telegram token missing");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!response.ok) throw new Error(`telegram send failed: ${response.status}`);
}

async function linkSubscriber(userId: number, username?: string) {
  const convex = process.env.WYRD_CONVEX_URL;
  if (!convex) throw new Error("convex URL missing");
  const response = await fetch(`${convex}/api/linkTelegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tgUserId: String(userId),
      tgUsername: username ? `@${username}` : undefined,
    }),
  });
  if (!response.ok) throw new Error(`subscriber link failed: ${response.status}`);
}

export async function POST(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const supplied = request.headers.get("x-telegram-bot-api-secret-token");
  if (!expected || supplied !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;
    const chatId = message?.chat?.id;
    const userId = message?.from?.id;
    const text = message?.text?.trim().toLowerCase() || "";
    if (!chatId || !userId) return Response.json({ ok: true });

    if (text.startsWith("/start")) {
      await linkSubscriber(userId, message?.from?.username);
      await sendMessage(
        chatId,
        "welcome to the internet's weird money. the weird finds you now.\n\ncommentary, not financial advice. we don't bet, we watch.\n\nhttps://wyrd-money.vercel.app/dashboard",
      );
      return Response.json({ ok: true });
    }

    if (text.includes("weird") || text.includes("today")) {
      const origin = new URL(request.url).origin;
      const response = await fetch(`${origin}/api/weird?limit=3`);
      const data = (await response.json()) as {
        markets?: Array<{ question: string; yesPct: number | null; volume: number }>;
      };
      const lines = (data.markets || []).map((market, index) => {
        const odds = market.yesPct == null ? "odds unavailable" : `${market.yesPct}% YES`;
        const volume = `$${Math.round(market.volume).toLocaleString("en-US")} total volume`;
        return `${index + 1}. ${market.question}\n${odds} · ${volume}`;
      });
      await sendMessage(chatId, `${lines.join("\n\n")}\n\nwe report the market. we don't tell you what to do with it.`);
      return Response.json({ ok: true });
    }

    await sendMessage(chatId, "ask me “what's weird today?” or wait for the next drop.");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("telegram webhook failed", error);
    // A 200 prevents Telegram from hammering retries while an upstream is down.
    return Response.json({ ok: false });
  }
}
