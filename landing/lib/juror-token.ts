import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const JUROR_COOKIE = "wyrd_juror";

function secret(): string | null {
  return process.env.WYRD_ACTION_SECRET || (process.env.NODE_ENV === "development" ? "wyrd-local-development-only" : null);
}

function signature(id: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(id).digest("base64url");
}

export function createJurorToken(): { id: string; token: string } | null {
  const id = randomUUID();
  const signed = signature(id);
  return signed ? { id, token: `${id}.${signed}` } : null;
}

export function verifyJurorToken(token: string | undefined): string | null {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;
  const id = token.slice(0, separator);
  const supplied = token.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const expected = signature(id);
  if (!expected || supplied.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)) ? id : null;
}

export function cookieValue(request: Request, name: string): string | undefined {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}
