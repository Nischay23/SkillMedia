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
        q.eq("clerkId", args.clerkId)
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
        q.eq("clerkId", args.clerkId)
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
        q.eq("clerkId", identity.subject)
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

export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) =>
      q.eq("clerkId", identity.subject)
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

// ─── Admin User Management ─────────────────────────────────

// Get all users with their activity stats (for admin)
export const getAllUsersWithStats = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(
      v.union(
        v.literal("createdAt"),
        v.literal("lastActiveAt"),
        v.literal("postsCount"),
        v.literal("name")
      )
    ),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const limit = args.limit || 20;
    const offset = args.offset || 0;
    const sortBy = args.sortBy || "createdAt";
    const sortOrder = args.sortOrder || "desc";

    // Get all users
    let users = await ctx.db.query("users").collect();

    // Search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.fullname?.toLowerCase().includes(searchLower) ||
          u.username?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower)
      );
    }

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get posts count
        const posts = await ctx.db
          .query("communityPosts")
          .filter((q) => q.eq(q.field("userId"), user._id))
          .collect();

        // Get comments count
        const comments = await ctx.db
          .query("comments")
          .filter((q) => q.eq(q.field("userId"), user._id))
          .collect();

        // Get likes count
        const likes = await ctx.db
          .query("likes")
          .filter((q) => q.eq(q.field("userId"), user._id))
          .collect();

        // Get groups joined
        const groupMemberships = await ctx.db
          .query("groupMembers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        // Get user preferences for last active
        const preferences = await ctx.db
          .query("userPreferences")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        return {
          ...user,
          postsCount: posts.length,
          commentsCount: comments.length,
          likesCount: likes.length,
          groupsJoined: groupMemberships.length,
          lastActiveAt: user.lastActiveAt || user.createdAt || 0,
        };
      })
    );

    // Sort
    usersWithStats.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a.fullname || "").localeCompare(b.fullname || "");
          break;
        case "postsCount":
          comparison = a.postsCount - b.postsCount;
          break;
        case "lastActiveAt":
          comparison = (a.lastActiveAt || 0) - (b.lastActiveAt || 0);
          break;
        case "createdAt":
        default:
          comparison = (a.createdAt || 0) - (b.createdAt || 0);
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Pagination
    const total = usersWithStats.length;
    const paginatedUsers = usersWithStats.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total,
      hasMore: offset + limit < total,
    };
  },
});

// Toggle admin status
export const toggleAdminStatus = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Prevent demoting the last admin
    if (user.isAdmin) {
      const allAdmins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("isAdmin"), true))
        .collect();
      if (allAdmins.length <= 1) {
        throw new Error("Cannot demote the last admin");
      }
    }

    await ctx.db.patch(args.userId, {
      isAdmin: !user.isAdmin,
    });

    return { success: true, isAdmin: !user.isAdmin };
  },
});

// Ban/Unban user
export const toggleBanStatus = mutation({
  args: { userId: v.id("users"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Prevent banning admins
    if (user.isAdmin && !user.isBanned) {
      throw new Error("Cannot ban an admin user");
    }

    const isBanned = !user.isBanned;

    await ctx.db.patch(args.userId, {
      isBanned,
      banReason: isBanned ? args.reason : undefined,
      bannedAt: isBanned ? Date.now() : undefined,
    });

    return { success: true, isBanned };
  },
});

// Get user activity timeline
export const getUserActivityTimeline = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Get posts
    const posts = await ctx.db
      .query("communityPosts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);

    // Get comments
    const comments = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);

    // Combine and sort
    const activities = [
      ...posts.map((p) => ({
        type: "post" as const,
        title: p.title || "Created a post",
        createdAt: p.createdAt,
        id: p._id,
      })),
      ...comments.map((c) => ({
        type: "comment" as const,
        title: "Left a comment",
        createdAt: c.createdAt,
        id: c._id,
      })),
    ];

    activities.sort((a, b) => b.createdAt - a.createdAt);

    return activities.slice(0, limit);
  },
});
