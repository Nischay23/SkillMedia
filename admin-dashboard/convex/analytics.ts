// convex/analytics.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// Track an analytics event
export const trackEvent = mutation({
  args: {
    type: v.string(),
    value: v.number(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    await ctx.db.insert("analytics", {
      type: args.type,
      value: args.value,
      date: today,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get dashboard stats (admin only)
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();

    const weekAgo = todayStartMs - 7 * 24 * 60 * 60 * 1000;

    // Get all users
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;

    // New users today
    const newUsersToday = allUsers.filter(
      (u) => u.createdAt && u.createdAt >= todayStartMs
    ).length;

    // New users this week
    const newUsersThisWeek = allUsers.filter(
      (u) => u.createdAt && u.createdAt >= weekAgo
    ).length;

    // Active users today (based on lastActiveAt)
    const activeUsersToday = allUsers.filter(
      (u) => u.lastActiveAt && u.lastActiveAt >= todayStartMs
    ).length;

    // Total posts
    const allPosts = await ctx.db.query("communityPosts").collect();
    const totalPosts = allPosts.length;

    // Total groups
    const allGroups = await ctx.db.query("groups").collect();
    const totalGroups = allGroups.length;

    // Total messages
    const allMessages = await ctx.db.query("messages").collect();
    const totalMessages = allMessages.length;

    // Daily signups for last 7 days
    const dailySignups: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayStartMs = dayStart.getTime();
      const dayEndMs = dayEnd.getTime();

      const count = allUsers.filter(
        (u) => u.createdAt && u.createdAt >= dayStartMs && u.createdAt < dayEndMs
      ).length;

      dailySignups.push({
        date: dayStart.toISOString().split("T")[0],
        count,
      });
    }

    // Popular career paths (top 5 by post count)
    const filterOptionPostCounts: Record<string, { id: string; name: string; count: number }> = {};

    for (const post of allPosts) {
      for (const filterId of post.linkedFilterOptionIds) {
        const filterIdStr = filterId.toString();
        if (!filterOptionPostCounts[filterIdStr]) {
          const filterOption = await ctx.db.get(filterId);
          filterOptionPostCounts[filterIdStr] = {
            id: filterIdStr,
            name: filterOption?.name || "Unknown",
            count: 0,
          };
        }
        filterOptionPostCounts[filterIdStr].count++;
      }
    }

    const popularCareerPaths = Object.values(filterOptionPostCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      activeUsersToday,
      totalPosts,
      totalGroups,
      totalMessages,
      dailySignups,
      popularCareerPaths,
    };
  },
});

// Update user's last active timestamp
export const updateLastActive = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) return { success: false };

    await ctx.db.patch(currentUser._id, {
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});

// Get analytics events by type and date range
export const getAnalyticsByType = query({
  args: {
    type: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    let events = await ctx.db
      .query("analytics")
      .withIndex("by_type_and_date", (q) => q.eq("type", args.type))
      .collect();

    // Filter by date range if provided
    if (args.startDate) {
      events = events.filter((e) => e.date >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.date <= args.endDate!);
    }

    return events;
  },
});

// Get aggregated stats for a specific metric
export const getAggregatedStats = query({
  args: {
    type: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const days = args.days || 7;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const events = await ctx.db
      .query("analytics")
      .withIndex("by_type_and_date", (q) => q.eq("type", args.type))
      .filter((q) => q.gte(q.field("date"), startDateStr))
      .collect();

    const total = events.reduce((sum, e) => sum + e.value, 0);
    const average = events.length > 0 ? total / events.length : 0;

    // Group by date
    const byDate: Record<string, number> = {};
    for (const event of events) {
      byDate[event.date] = (byDate[event.date] || 0) + event.value;
    }

    return {
      total,
      average,
      count: events.length,
      byDate,
    };
  },
});

// Get content performance stats (most liked, saved, engaged posts)
export const getContentPerformance = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const limit = args.limit || 10;

    // Get all posts with their engagement
    const posts = await ctx.db.query("communityPosts").collect();

    // Calculate engagement score for each post
    const postsWithEngagement = await Promise.all(
      posts.map(async (post) => {
        // Get saves count
        const saves = await ctx.db
          .query("savedContent")
          .filter((q) => q.eq(q.field("communityPostId"), post._id))
          .collect();

        // Get comments count
        const comments = await ctx.db
          .query("comments")
          .filter((q) => q.eq(q.field("communityPostId"), post._id))
          .collect();

        // Get author info
        const author = post.userId ? await ctx.db.get(post.userId) : null;

        // Get linked career path names
        const careerPaths = await Promise.all(
          post.linkedFilterOptionIds.map(async (id) => {
            const filter = await ctx.db.get(id);
            return filter?.name || "Unknown";
          })
        );

        const engagementScore =
          (post.likes || 0) * 1 +
          saves.length * 2 +
          comments.length * 3;

        return {
          id: post._id,
          title: post.title || post.content?.slice(0, 50) + "...",
          likes: post.likes || 0,
          saves: saves.length,
          comments: comments.length,
          engagementScore,
          createdAt: post.createdAt,
          author: author
            ? { name: author.fullname, image: author.profileImage }
            : null,
          careerPaths,
          status: post.status,
        };
      })
    );

    // Sort by engagement score
    const topPosts = postsWithEngagement
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);

    // Get most liked posts
    const mostLiked = postsWithEngagement
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5);

    // Get most saved posts
    const mostSaved = postsWithEngagement
      .sort((a, b) => b.saves - a.saves)
      .slice(0, 5);

    // Get most discussed posts
    const mostDiscussed = postsWithEngagement
      .sort((a, b) => b.comments - a.comments)
      .slice(0, 5);

    // Get group activity stats
    const groups = await ctx.db.query("groups").collect();
    const groupsWithActivity = await Promise.all(
      groups.map(async (group) => {
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        const messages = await ctx.db
          .query("messages")
          .filter((q) => q.eq(q.field("groupId"), group._id))
          .collect();

        // Get career path name
        const careerPath = group.filterOptionId
          ? await ctx.db.get(group.filterOptionId)
          : null;

        return {
          id: group._id,
          name: group.name,
          memberCount: members.length,
          messageCount: messages.length,
          careerPath: careerPath?.name || null,
          activityScore: members.length * 1 + messages.length * 2,
        };
      })
    );

    const topGroups = groupsWithActivity
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 5);

    // Total engagement metrics
    const totalLikes = postsWithEngagement.reduce((sum, p) => sum + p.likes, 0);
    const totalSaves = postsWithEngagement.reduce((sum, p) => sum + p.saves, 0);
    const totalComments = postsWithEngagement.reduce(
      (sum, p) => sum + p.comments,
      0
    );

    return {
      topPosts,
      mostLiked,
      mostSaved,
      mostDiscussed,
      topGroups,
      totalMetrics: {
        likes: totalLikes,
        saves: totalSaves,
        comments: totalComments,
        posts: posts.length,
        groups: groups.length,
      },
    };
  },
});

// Export data functions for admin
export const exportUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const users = await ctx.db.query("users").collect();

    return users.map((user) => ({
      id: user._id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      isAdmin: user.isAdmin || false,
      isBanned: user.isBanned || false,
      createdAt: user.createdAt
        ? new Date(user.createdAt).toISOString()
        : null,
      lastActiveAt: user.lastActiveAt
        ? new Date(user.lastActiveAt).toISOString()
        : null,
    }));
  },
});

export const exportPosts = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const posts = await ctx.db.query("communityPosts").collect();

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const author = post.userId ? await ctx.db.get(post.userId) : null;
        const saves = await ctx.db
          .query("savedContent")
          .filter((q) => q.eq(q.field("communityPostId"), post._id))
          .collect();
        const comments = await ctx.db
          .query("comments")
          .filter((q) => q.eq(q.field("communityPostId"), post._id))
          .collect();

        const careerPaths = await Promise.all(
          post.linkedFilterOptionIds.map(async (id) => {
            const filter = await ctx.db.get(id);
            return filter?.name || "Unknown";
          })
        );

        return {
          id: post._id,
          title: post.title || "",
          content: post.content || "",
          author: author?.fullname || "Unknown",
          authorEmail: author?.email || "",
          likes: post.likes || 0,
          saves: saves.length,
          comments: comments.length,
          careerPaths: careerPaths.join(", "),
          status: post.status || "published",
          createdAt: new Date(post.createdAt).toISOString(),
        };
      })
    );

    return postsWithDetails;
  },
});

export const exportGroups = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const groups = await ctx.db.query("groups").collect();

    const groupsWithDetails = await Promise.all(
      groups.map(async (group) => {
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        const messages = await ctx.db
          .query("messages")
          .filter((q) => q.eq(q.field("groupId"), group._id))
          .collect();

        const careerPath = group.filterOptionId
          ? await ctx.db.get(group.filterOptionId)
          : null;

        return {
          id: group._id,
          name: group.name,
          description: group.description || "",
          careerPath: careerPath?.name || "",
          memberCount: members.length,
          messageCount: messages.length,
          createdAt: group.createdAt
            ? new Date(group.createdAt).toISOString()
            : "",
        };
      })
    );

    return groupsWithDetails;
  },
});

export const exportAnalytics = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const days = args.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateMs = startDate.getTime();

    const users = await ctx.db.query("users").collect();
    const posts = await ctx.db.query("communityPosts").collect();
    const groups = await ctx.db.query("groups").collect();
    const messages = await ctx.db.query("messages").collect();

    // Generate daily stats
    const dailyStats: Array<{
      date: string;
      newUsers: number;
      activeUsers: number;
      newPosts: number;
      newMessages: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + (days - 1 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayStartMs = dayStart.getTime();
      const dayEndMs = dayEnd.getTime();

      const newUsers = users.filter(
        (u) => u.createdAt && u.createdAt >= dayStartMs && u.createdAt < dayEndMs
      ).length;

      const activeUsers = users.filter(
        (u) =>
          u.lastActiveAt &&
          u.lastActiveAt >= dayStartMs &&
          u.lastActiveAt < dayEndMs
      ).length;

      const newPosts = posts.filter(
        (p) => p.createdAt >= dayStartMs && p.createdAt < dayEndMs
      ).length;

      const newMessages = messages.filter(
        (m) => m.createdAt >= dayStartMs && m.createdAt < dayEndMs
      ).length;

      dailyStats.push({
        date: dayStart.toISOString().split("T")[0],
        newUsers,
        activeUsers,
        newPosts,
        newMessages,
      });
    }

    return dailyStats;
  },
});
