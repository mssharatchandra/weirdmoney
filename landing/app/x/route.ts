// /x -> the WYRD X (Twitter) account.
export function GET(): Response {
  const url = process.env.WYRD_X_URL || "https://x.com/wrydmoney";
  return Response.redirect(url, 302);
}
