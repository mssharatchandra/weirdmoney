import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  signups: defineTable({
    email: v.optional(v.string()),
    tgUserId: v.optional(v.string()),
    tgUsername: v.optional(v.string()),
    source: v.union(
      v.literal("landing"),
      v.literal("telegram"),
      v.literal("floor"),
    ),
    linkedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_tgUserId", ["tgUserId"]),

  posts: defineTable({
    marketId: v.string(),
    question: v.string(),
    text: v.string(),
    format: v.string(),
    url: v.string(),
    platform: v.union(v.literal("x"), v.literal("tg")),
    postedAt: v.number(),
  }).index("by_postedAt", ["postedAt"]),

  viralActions: defineTable({
    visitorId: v.string(),
    actionKey: v.string(),
    kind: v.union(v.literal("nominate"), v.literal("share")),
    marketId: v.string(),
    question: v.string(),
    channel: v.optional(
      v.union(
        v.literal("x"),
        v.literal("telegram"),
        v.literal("whatsapp"),
        v.literal("native"),
        v.literal("copy"),
      ),
    ),
    referrer: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_visitor_action", ["visitorId", "actionKey"])
    .index("by_createdAt", ["createdAt"])
    .index("by_market", ["marketId"]),
});
