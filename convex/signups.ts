import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Create a signup (default source "landing").
 * Dedupe by email: if an email already exists, return the existing id.
 */
export const createSignup = mutation({
  args: {
    email: v.string(),
    source: v.optional(
      v.union(
        v.literal("landing"),
        v.literal("telegram"),
        v.literal("floor"),
      ),
    ),
  },
  returns: v.id("signups"),
  handler: async (ctx, args): Promise<Id<"signups">> => {
    const email = args.email.trim().toLowerCase();
    const source = args.source ?? "landing";

    const existing = await ctx.db
      .query("signups")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("signups", {
      email,
      source,
      createdAt: Date.now(),
    });
  },
});

/**
 * Link a Telegram identity to a signup.
 * - If signupId is given and exists, set tgUserId/tgUsername/linkedAt on it.
 * - Else upsert a signup row with source "telegram".
 * Idempotent by tgUserId: never double-insert the same tgUserId.
 */
export const linkTelegram = mutation({
  args: {
    signupId: v.optional(v.id("signups")),
    tgUserId: v.string(),
    tgUsername: v.optional(v.string()),
  },
  returns: v.id("signups"),
  handler: async (ctx, args): Promise<Id<"signups">> => {
    const now = Date.now();

    // If a signupId is provided and exists, attach the Telegram identity to it.
    if (args.signupId) {
      const row = await ctx.db.get(args.signupId);
      if (row) {
        await ctx.db.patch(row._id, {
          tgUserId: args.tgUserId,
          tgUsername: args.tgUsername,
          linkedAt: now,
        });
        return row._id;
      }
    }

    // Idempotent by tgUserId: if this Telegram user already exists, update it.
    const existing = await ctx.db
      .query("signups")
      .withIndex("by_tgUserId", (q) => q.eq("tgUserId", args.tgUserId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        tgUsername: args.tgUsername ?? existing.tgUsername,
        linkedAt: existing.linkedAt ?? now,
      });
      return existing._id;
    }

    // Otherwise create a fresh telegram-sourced signup.
    return await ctx.db.insert("signups", {
      tgUserId: args.tgUserId,
      tgUsername: args.tgUsername,
      source: "telegram",
      linkedAt: now,
      createdAt: now,
    });
  },
});

/**
 * All signups that have a Telegram identity, for broadcasting.
 */
export const listSubscribers = query({
  args: {},
  returns: v.array(
    v.object({
      tgUserId: v.string(),
      tgUsername: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("signups").collect();
    return rows
      .filter((r): r is typeof r & { tgUserId: string } => !!r.tgUserId)
      .map((r) => ({ tgUserId: r.tgUserId, tgUsername: r.tgUsername }));
  },
});

/** Delete a known test signup from the CLI. Not exposed through HTTP. */
export const deleteSignupByEmail = mutation({
  args: { email: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const rows = await ctx.db
      .query("signups")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const row of rows) await ctx.db.delete(row._id);
    return rows.length;
  },
});

/**
 * Demo proof numbers: total signups, how many are linked to Telegram, total posts.
 */
export const stats = query({
  args: {},
  returns: v.object({
    signups: v.number(),
    linked: v.number(),
    posts: v.number(),
  }),
  handler: async (ctx) => {
    const signups = await ctx.db.query("signups").collect();
    const posts = await ctx.db.query("posts").collect();
    const linked = signups.filter((s) => !!s.tgUserId).length;
    return {
      signups: signups.length,
      linked,
      posts: posts.length,
    };
  },
});
