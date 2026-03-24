import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// ==========================================
// STREAK QUERIES
// ==========================================

// Get current user's streak
export const getStreak = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalQuizzesTaken: 0,
      };
    }

    // Check if streak is still active (activity within last day)
    const today = new Date().toISOString().split("T")[0];
    const lastDate = new Date(streak.lastActivityDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // If more than 1 day has passed, streak should show as 0
    // (but we don't update DB here - that happens on next activity)
    const effectiveStreak = diffDays > 1 ? 0 : streak.currentStreak;

    return {
      currentStreak: effectiveStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
      totalQuizzesTaken: streak.totalQuizzesTaken ?? 0,
      isActiveToday: streak.lastActivityDate === today,
    };
  },
});

// Get streak for a specific user (admin or leaderboard)
export const getUserStreak = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    // Check if streak is still active
    const today = new Date().toISOString().split("T")[0];
    const lastDate = new Date(streak.lastActivityDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const effectiveStreak = diffDays > 1 ? 0 : streak.currentStreak;

    return {
      currentStreak: effectiveStreak,
      longestStreak: streak.longestStreak,
    };
  },
});

// Get top streaks (for leaderboard)
export const getTopStreaks = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const allStreaks = await ctx.db.query("streaks").collect();
    const limit = args.limit ?? 10;

    const today = new Date().toISOString().split("T")[0];

    // Calculate effective streaks and filter out inactive ones
    const activeStreaks = allStreaks
      .map((streak) => {
        const lastDate = new Date(streak.lastActivityDate);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const effectiveStreak = diffDays > 1 ? 0 : streak.currentStreak;

        return {
          userId: streak.userId,
          currentStreak: effectiveStreak,
          longestStreak: streak.longestStreak,
        };
      })
      .filter((s) => s.currentStreak > 0);

    // Sort by current streak and take top N
    const topStreaks = activeStreaks
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, limit);

    // Enrich with user info
    const enriched = await Promise.all(
      topStreaks.map(async (streak) => {
        const user = await ctx.db.get(streak.userId);
        return {
          ...streak,
          username: user?.username ?? "Unknown",
          fullname: user?.fullname ?? "Unknown",
          image: user?.image ?? user?.profileImage,
        };
      }),
    );

    return enriched;
  },
});
