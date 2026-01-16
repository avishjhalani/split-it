import { v } from "convex/values";
import {
  mutation,
  query,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";

/* =========================
   STORE USER
========================= */
export const store = mutation(async ({ db, auth }) => {
  const identity = await auth.getUserIdentity();
  if (!identity) {
    throw new Error("No identity");
  }

  const existing = await db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (existing) {
    return existing._id;
  }

  const newUser = await db.insert("users", {
    name: identity.name ?? "",
    email: identity.email ?? "",
    tokenIdentifier: identity.tokenIdentifier,
    imageUrl: identity.pictureUrl,
  });

  return newUser;
});

/* =========================
   PUBLIC QUERY (CLIENT)
========================= */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
});

/* =========================
   INTERNAL QUERY (SERVER)
========================= */
export const getCurrentUserInternal = internalQuery({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
});

/* =========================
   SEARCH USERS
========================= */
export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(
      internal.users.getCurrentUserInternal
    );

    if (args.query.length < 2) {
      return [];
    }

    const nameResults = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) =>
        q.search("name", args.query)
      )
      .collect();

    const emailResults = await ctx.db
      .query("users")
      .withSearchIndex("search_email", (q) =>
        q.search("email", args.query)
      )
      .collect();

    const users = [
      ...nameResults,
      ...emailResults.filter(
        (email) =>
          !nameResults.some((name) => name._id === email._id)
      ),
    ];

    return users
      .filter((user) => user._id !== currentUser._id)
      .map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
      }));
  },
});
