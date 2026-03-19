import { v } from "convex/values";
import {
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";

export const createUser = mutation({
  args: {
    username: v.string(),
    fullname: v.string(),
    profileImage: v.string(),
    bio: v.optional(v.string()),
    email: v.string(),
    clerkId: v.string(),
  },

  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.clerkId),
      )
      .first();

    if (existingUser) return;

    await ctx.db.insert("users", {
      username: args.username,
      fullname: args.fullname,
      email: args.email,
      bio: args.bio,
      profileImage: args.profileImage,
      clerkId: args.clerkId,
      createdAt: Date.now(),
    });
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.clerkId),
      )
      .unique();

    return user;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject),
      )
      .unique();

    return user;
  },
});

export const updateProfile = mutation({
  args: {
    fullname: v.string(),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    await ctx.db.patch(currentUser._id, {
      fullname: args.fullname,
      bio: args.bio,
    });
  },
});

// Save push notification token
export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    await ctx.db.patch(currentUser._id, {
      pushToken: args.token,
    });
  },
});

// Get push tokens for users in a group (for sending notifications)
export const getGroupMemberPushTokens = query({
  args: {
    groupId: v.id("groups"),
    excludeUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) =>
        q.eq("groupId", args.groupId),
      )
      .collect();

    const tokens: string[] = [];

    for (const member of members) {
      if (
        args.excludeUserId &&
        member.userId === args.excludeUserId
      ) {
        continue;
      }

      const user = await ctx.db.get(member.userId);
      if (user?.pushToken) {
        tokens.push(user.pushToken);
      }
    }

    return tokens;
  },
});

export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) =>
      q.eq("clerkId", identity.subject),
    )
    .first();

  if (!currentUser) throw new Error("User not found");

  return currentUser;
}

export const getUserProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    return user;
  },
});

// Check if current user is following another user
export const isFollowing = query({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getAuthenticatedUser(ctx);
      // For now, return false since we don't have a follows table implemented
      return false;
    } catch {
      return false;
    }
  },
});

// Toggle follow/unfollow a user
export const toggleFollow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getAuthenticatedUser(ctx);
      // For now, just return success since we don't have a follows table implemented
      return { success: true };
    } catch (error) {
      throw new Error("Failed to toggle follow");
    }
  },
});
