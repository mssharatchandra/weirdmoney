import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Log a post that WYRD published to X or Telegram.
 */
export const logPost = mutation({
  args: {
    marketId: v.string(),
    question: v.string(),
    text: v.string(),
    format: v.string(),
    url: v.string(),
    platform: v.union(v.literal("x"), v.literal("tg")),
  },
  returns: v.id("posts"),
  handler: async (ctx, args): Promise<Id<"posts">> => {
    return await ctx.db.insert("posts", {
      marketId: args.marketId,
      question: args.question,
      text: args.text,
      format: args.format,
      url: args.url,
      platform: args.platform,
      postedAt: Date.now(),
    });
  },
});

/**
 * Latest N posts, newest first — powers the landing "latest drops" feed.
 */
export const recentPosts = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      marketId: v.string(),
      question: v.string(),
      text: v.string(),
      format: v.string(),
      url: v.string(),
      platform: v.union(v.literal("x"), v.literal("tg")),
      postedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("posts")
      .withIndex("by_postedAt")
      .order("desc")
      .take(limit);
  },
});
