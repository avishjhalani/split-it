import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";


 
export const getAllContacts = query({
  handler: async (ctx) => {
    
    const currentUser = await ctx.runQuery(
      internal.users.getCurrentUser
    );

    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    
    const expensesYouPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      )
      .collect();

    
    const expensesNotPaidByYou = (await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", undefined))
      .collect()
    ).filter(
      (e) =>
        e.paidByUserId !== currentUser._id &&
        e.splits.some((s) => s.userId === currentUser._id)
    );

    const personalExpenses = [
      ...expensesYouPaid,
      ...expensesNotPaidByYou,
    ];

    
    const contactIds = new Set();
    for (const exp of personalExpenses) {
      if (exp.paidByUserId !== currentUser._id) {
        contactIds.add(exp.paidByUserId);
      }

      for (const split of exp.splits) {
        if (split.userId !== currentUser._id) {
          contactIds.add(split.userId);
        }
      }
    }

    
    const contactUsers = (
      await Promise.all(
        [...contactIds].map(async (id) => {
          const user = await ctx.db.get(id);
          return user
            ? {
                id: user._id,
                name: user.name,
                email: user.email,
                imageUrl: user.imageUrl,
                type: "user",
              }
            : null;
        })
      )
    ).filter(Boolean);

    
    const userGroups = (await ctx.db.query("groups").collect())
      .filter((group) =>
        group.members.some(
          (member) => member.userId === currentUser._id
        )
      )
      .map((group) => ({
        id: group._id,
        name: group.name,
        imageUrl: group.imageUrl,
        memberCount: group.members.length,
        type: "group",
      }));

    
    contactUsers.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    userGroups.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return {
      users: contactUsers,
      groups: userGroups,
    };
  },
});


export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    members: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    
    const currentUser = await ctx.runQuery(
      internal.users.getCurrentUser
    );

    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    if (!args.name.trim()) {
      throw new Error("Group name cannot be empty");
    }

    
    const uniqueMembers = new Set(args.members);
    uniqueMembers.add(currentUser._id);

    
    for (const id of uniqueMembers) {
      const user = await ctx.db.get(id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
    }

    return await ctx.db.insert("groups", {
      name: args.name.trim(),
      description: args.description?.trim() ?? "",
      createdBy: currentUser._id,
      members: [...uniqueMembers].map((id) => ({
        userId: id,
        role: id === currentUser._id ? "admin" : "member",
        joinedAt: Date.now(),
      })),
    });
  },
});
