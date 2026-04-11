// convex/analytics.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// Track an analytics event (authenticated users only)
export const trackEvent = mutation({
  args: {
    type: v.string(),
    value: v.number(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication to prevent spam
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      throw new Error("Authentication required");
    }

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
    if (!currentUser?.isAdmin)
      throw new Error("Admin only");

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
      (u) => u.createdAt && u.createdAt >= todayStartMs,
    ).length;

    // New users this week
    const newUsersThisWeek = allUsers.filter(
      (u) => u.createdAt && u.createdAt >= weekAgo,
    ).length;

    // Active users today (based on lastActiveAt)
    const activeUsersToday = allUsers.filter(
      (u) =>
        u.lastActiveAt && u.lastActiveAt >= todayStartMs,
    ).length;

    // Total posts
    const allPosts = await ctx.db
      .query("communityPosts")
      .collect();
    const totalPosts = allPosts.length;

    // Total groups
    const allGroups = await ctx.db
      .query("groups")
      .collect();
    const totalGroups = allGroups.length;

    // Total messages
    const allMessages = await ctx.db
      .query("messages")
      .collect();
    const totalMessages = allMessages.length;

    // Daily signups for last 7 days
    const dailySignups: { date: string; count: number }[] =
      [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayStartMs = dayStart.getTime();
      const dayEndMs = dayEnd.getTime();

      const count = allUsers.filter(
        (u) =>
          u.createdAt &&
          u.createdAt >= dayStartMs &&
          u.createdAt < dayEndMs,
      ).length;

      dailySignups.push({
        date: dayStart.toISOString().split("T")[0],
        count,
      });
    }

    // Popular career paths (top 5 by post count)
    // Pre-fetch all referenced filter options to avoid N+1
    const allLinkedIds = [...new Set(allPosts.flatMap((p) => p.linkedFilterOptionIds))];
    const filterOptionsData = await Promise.all(allLinkedIds.map((id) => ctx.db.get(id)));
    const filterOptionsMap = new Map(
      filterOptionsData.filter(Boolean).map((f) => [f!._id.toString(), f!.name])
    );

    const filterOptionPostCounts: Record<
      string,
      { id: string; name: string; count: number }
    > = {};

    for (const post of allPosts) {
      for (const filterId of post.linkedFilterOptionIds) {
        const filterIdStr = filterId.toString();
        if (!filterOptionPostCounts[filterIdStr]) {
          filterOptionPostCounts[filterIdStr] = {
            id: filterIdStr,
            name: filterOptionsMap.get(filterIdStr) || "Unknown",
            count: 0,
          };
        }
        filterOptionPostCounts[filterIdStr].count++;
      }
    }

    const popularCareerPaths = Object.values(
      filterOptionPostCounts,
    )
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
    if (!currentUser?.isAdmin)
      throw new Error("Admin only");

    let events = await ctx.db
      .query("analytics")
      .withIndex("by_type_and_date", (q) =>
        q.eq("type", args.type),
      )
      .collect();

    // Filter by date range if provided
    if (args.startDate) {
      events = events.filter(
        (e) => e.date >= args.startDate!,
      );
    }
    if (args.endDate) {
      events = events.filter(
        (e) => e.date <= args.endDate!,
      );
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
    if (!currentUser?.isAdmin)
      throw new Error("Admin only");

    const days = args.days || 7;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate
      .toISOString()
      .split("T")[0];

    const events = await ctx.db
      .query("analytics")
      .withIndex("by_type_and_date", (q) =>
        q.eq("type", args.type),
      )
      .filter((q) => q.gte(q.field("date"), startDateStr))
      .collect();

    const total = events.reduce(
      (sum, e) => sum + e.value,
      0,
    );
    const average =
      events.length > 0 ? total / events.length : 0;

    // Group by date
    const byDate: Record<string, number> = {};
    for (const event of events) {
      byDate[event.date] =
        (byDate[event.date] || 0) + event.value;
    }

    return {
      total,
      average,
      count: events.length,
      byDate,
    };
  },
});
