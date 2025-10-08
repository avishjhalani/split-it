import { mutation , query } from "./_generated/server";

export const store = mutation(async ({ db, auth }) => {
  const identity = await auth.getUserIdentity();
  if (!identity) throw new Error("No identity");

  const existing = await db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (existing) return existing._id;

  const newUser = await db.insert("users", {
    name: identity.name ?? "",
    email: identity.email ?? "",
    tokenIdentifier: identity.tokenIdentifier,
    imageUrl: identity.pictureUrl,
  });

  return newUser; // ✅ important
});

export const getCurrentUser = query({handler: async(ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("No Authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .first();

    if(!user){
      throw new Error("User not found");
    }
    return user;
},
});