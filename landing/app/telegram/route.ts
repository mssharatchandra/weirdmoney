// /telegram -> the WYRD Telegram bot.
export function GET(): Response {
  const url = process.env.WYRD_TELEGRAM_URL || "https://t.me/wyrdmoneybot";
  return Response.redirect(url, 302);
}
