import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const channel = v.union(
  v.literal("x"),
  v.literal("telegram"),
  v.literal("whatsapp"),
  v.literal("native"),
  v.literal("copy"),
);

export const record = mutation({
  args: {
    visitorId: v.string(),
    kind: v.union(v.literal("nominate"), v.literal("share")),
    marketId: v.string(),
    question: v.string(),
    channel: v.optional(channel),
    referrer: v.optional(v.string()),
  },
  returns: v.object({ inserted: v.boolean() }),
  handler: async (ctx, args) => {
    const visitorId = args.visitorId.trim().slice(0, 80);
    const marketId = args.marketId.trim().slice(0, 100);
    const question = args.question.trim().slice(0, 400);
    if (!visitorId || !marketId || !question) return { inserted: false };

    // A nomination is one meaningful action per person and market. Shares are
    // deduped per channel so button mashing cannot inflate the public proof.
    const actionKey = args.kind === "nominate"
      ? `nominate:${marketId}`
      : `share:${marketId}:${args.channel ?? "native"}`;
    const existing = await ctx.db
      .query("viralActions")
      .withIndex("by_visitor_action", (q) =>
        q.eq("visitorId", visitorId).eq("actionKey", actionKey),
      )
      .first();
    if (existing) return { inserted: false };

    await ctx.db.insert("viralActions", {
      visitorId,
      actionKey,
      kind: args.kind,
      marketId,
      question,
      channel: args.channel,
      referrer:
        args.referrer && args.referrer !== visitorId
          ? args.referrer.trim().slice(0, 80)
          : undefined,
      createdAt: Date.now(),
    });
    return { inserted: true };
  },
});

export const publicStats = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("viralActions").collect();
    const nominations = rows.filter((row) => row.kind === "nominate");
    const shares = rows.filter((row) => row.kind === "share");
    const jurors = new Set(nominations.map((row) => row.visitorId));
    const referredJurors = new Set(
      nominations.filter((row) => !!row.referrer).map((row) => row.visitorId),
    );

    const marketMap = new Map<string, { marketId: string; question: string; nominations: number }>();
    for (const row of nominations) {
      const current = marketMap.get(row.marketId) ?? {
        marketId: row.marketId,
        question: row.question,
        nominations: 0,
      };
      current.nominations += 1;
      marketMap.set(row.marketId, current);
    }

    return {
      uniqueJurors: jurors.size,
      nominations: nominations.length,
      shares: shares.length,
      referredJurors: referredJurors.size,
      topMarkets: [...marketMap.values()]
        .sort((a, b) => b.nominations - a.nominations)
        .slice(0, 5),
      updatedAt: Date.now(),
    };
  },
});
