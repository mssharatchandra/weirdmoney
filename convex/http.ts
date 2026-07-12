import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// Shared OPTIONS preflight handler for all routes.
const preflight = httpAction(async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
});

const http = httpRouter();

// ---- POST /api/signup ----
http.route({
  path: "/api/signup",
  method: "OPTIONS",
  handler: preflight,
});
http.route({
  path: "/api/signup",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: { email?: unknown; source?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }
    if (typeof body.email !== "string" || body.email.trim() === "") {
      return json({ error: "email is required" }, 400);
    }
    const source =
      body.source === "landing" ||
      body.source === "telegram" ||
      body.source === "floor"
        ? body.source
        : undefined;

    const signupId = await ctx.runMutation(api.signups.createSignup, {
      email: body.email,
      source,
    });
    return json({ signupId });
  }),
});

// ---- POST /api/linkTelegram ----
http.route({
  path: "/api/linkTelegram",
  method: "OPTIONS",
  handler: preflight,
});
http.route({
  path: "/api/linkTelegram",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: {
      signupId?: unknown;
      tgUserId?: unknown;
      tgUsername?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }
    if (typeof body.tgUserId !== "string" || body.tgUserId.trim() === "") {
      return json({ error: "tgUserId is required" }, 400);
    }
    await ctx.runMutation(api.signups.linkTelegram, {
      signupId:
        typeof body.signupId === "string"
          ? (body.signupId as Id<"signups">)
          : undefined,
      tgUserId: body.tgUserId,
      tgUsername:
        typeof body.tgUsername === "string" ? body.tgUsername : undefined,
    });
    return json({ ok: true });
  }),
});

// ---- POST /api/logPost ----
http.route({
  path: "/api/logPost",
  method: "OPTIONS",
  handler: preflight,
});
http.route({
  path: "/api/logPost",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }
    const required = ["marketId", "question", "text", "format", "url"] as const;
    for (const key of required) {
      if (typeof body[key] !== "string") {
        return json({ error: `${key} is required` }, 400);
      }
    }
    if (body.platform !== "x" && body.platform !== "tg") {
      return json({ error: "platform must be 'x' or 'tg'" }, 400);
    }
    await ctx.runMutation(api.posts.logPost, {
      marketId: body.marketId as string,
      question: body.question as string,
      text: body.text as string,
      format: body.format as string,
      url: body.url as string,
      platform: body.platform,
    });
    return json({ ok: true });
  }),
});

// ---- GET /api/recentPosts?limit=10 ----
http.route({
  path: "/api/recentPosts",
  method: "OPTIONS",
  handler: preflight,
});
http.route({
  path: "/api/recentPosts",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const raw = url.searchParams.get("limit");
    const parsed = raw !== null ? Number.parseInt(raw, 10) : NaN;
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    const posts = await ctx.runQuery(api.posts.recentPosts, { limit });
    return json({ posts });
  }),
});

// ---- GET /api/subscribers ----
http.route({
  path: "/api/subscribers",
  method: "OPTIONS",
  handler: preflight,
});
http.route({
  path: "/api/subscribers",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const subscribers = await ctx.runQuery(api.signups.listSubscribers, {});
    return json({ subscribers });
  }),
});

// ---- GET /api/stats ----
http.route({
  path: "/api/stats",
  method: "OPTIONS",
  handler: preflight,
});
http.route({
  path: "/api/stats",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const stats = await ctx.runQuery(api.signups.stats, {});
    return json(stats);
  }),
});

// ---- POST /api/viralAction ----
http.route({
  path: "/api/viralAction",
  method: "OPTIONS",
  handler: preflight,
});
http.route({
  path: "/api/viralAction",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }
    if (body.kind !== "nominate" && body.kind !== "share") {
      return json({ error: "invalid action kind" }, 400);
    }
    if (
      typeof body.visitorId !== "string" ||
      typeof body.marketId !== "string" ||
      typeof body.question !== "string"
    ) {
      return json({ error: "visitorId, marketId, and question are required" }, 400);
    }
    const channels = ["x", "telegram", "whatsapp", "native", "copy"] as const;
    const selectedChannel = channels.find((value) => value === body.channel);
    const result = await ctx.runMutation(api.viralActions.record, {
      visitorId: body.visitorId,
      kind: body.kind,
      marketId: body.marketId,
      question: body.question,
      channel: selectedChannel,
      referrer: typeof body.referrer === "string" ? body.referrer : undefined,
    });
    return json(result, result.inserted ? 201 : 200);
  }),
});

// ---- GET /api/viralStats ----
http.route({
  path: "/api/viralStats",
  method: "OPTIONS",
  handler: preflight,
});
http.route({
  path: "/api/viralStats",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const stats = await ctx.runQuery(api.viralActions.publicStats, {});
    return json(stats);
  }),
});

export default http;
