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
});
