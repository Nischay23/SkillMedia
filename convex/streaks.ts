import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// ==========================================
// STREAK QUERIES
// ==========================================

// Get current user's streak data or null
export const getMyStreak = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!streak) return null;

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      totalActiveDays: streak.totalActiveDays,
    };
  },
});

// ==========================================
// STREAK MUTATIONS
// ==========================================

// Update streak - call when user performs an activity
export const updateStreak = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Get today's date as string "YYYY-MM-DD"
    const today = new Date().toISOString().split("T")[0];

    // Get user's streak record
    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!streak) {
      // No record: create with currentStreak:1, lastActiveDate: today
      await ctx.db.insert("streaks", {
        userId: user._id,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        totalActiveDays: 1,
      });
      return;
    }

    // If lastActiveDate is today: do nothing (already active today)
    if (streak.lastActiveDate === today) {
      return;
    }

    // Calculate days difference
    const lastDate = new Date(streak.lastActiveDate);
    const todayDate = new Date(today);
    const diffTime =
      todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(
      diffTime / (1000 * 60 * 60 * 24),
    );

    let newCurrentStreak: number;

    if (diffDays === 1) {
      // lastActiveDate is yesterday: increment currentStreak
      newCurrentStreak = streak.currentStreak + 1;
    } else {
      // lastActiveDate is older: reset currentStreak to 1
      newCurrentStreak = 1;
    }

    // Update longestStreak if currentStreak > longestStreak
    const newLongestStreak = Math.max(
      newCurrentStreak,
      streak.longestStreak,
    );

    await ctx.db.patch(streak._id, {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: today,
      totalActiveDays: streak.totalActiveDays + 1,
    });
  },
});
