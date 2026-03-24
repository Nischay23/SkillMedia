import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";
import { Id, Doc } from "./_generated/dataModel";

// ==========================================
// LEADERBOARD QUERIES
// ==========================================

type Period = "week" | "month" | "allTime";

// Get leaderboard for a group
export const getGroupLeaderboard = query({
  args: {
    groupId: v.id("groups"),
    period: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("allTime"))),
  },
  handler: async (ctx, args) => {
    let currentUser;
    try {
      currentUser = await getAuthenticatedUser(ctx);
    } catch {
      currentUser = null;
    }

    const period: Period = args.period ?? "week";

    // Get all members of the group
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    // Get all quizzes for the group
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const quizIds = new Set(quizzes.map((q) => q._id));

    // Calculate time filter
    const now = Date.now();
    let startTime = 0;
    if (period === "week") {
      startTime = now - 7 * 24 * 60 * 60 * 1000;
    } else if (period === "month") {
      startTime = now - 30 * 24 * 60 * 60 * 1000;
    }

    // Get scores for each member
    const leaderboardData = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        if (!user) return null;

        // Get all attempts by this user for quizzes in this group
        const allAttempts = await ctx.db
          .query("quizAttempts")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .collect();

        // Filter to this group's quizzes and time period
        const relevantAttempts = allAttempts.filter(
          (a) =>
            quizIds.has(a.quizId) &&
            (period === "allTime" || a.completedAt >= startTime),
        );

        // Calculate total score and quiz count
        const totalScore = relevantAttempts.reduce((sum, a) => sum + a.score, 0);
        const totalPossible = relevantAttempts.reduce((sum, a) => sum + a.totalPoints, 0);
        const quizCount = relevantAttempts.length;
        const avgPercentage =
          quizCount > 0
            ? relevantAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizCount
            : 0;

        // Get streak
        const streak = await ctx.db
          .query("streaks")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .first();

        // Check if streak is active
        const today = new Date().toISOString().split("T")[0];
        let currentStreak = 0;
        if (streak) {
          const lastDate = new Date(streak.lastActivityDate);
          const todayDate = new Date(today);
          const diffTime = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          currentStreak = diffDays > 1 ? 0 : streak.currentStreak;
        }

        return {
          userId: member.userId,
          username: user.username,
          fullname: user.fullname,
          image: user.image ?? user.profileImage,
          totalScore,
          totalPossible,
          quizCount,
          avgPercentage: Math.round(avgPercentage),
          currentStreak,
          isCurrentUser: currentUser?._id === member.userId,
        };
      }),
    );

    // Filter out nulls and sort by total score
    const validData = leaderboardData.filter(Boolean) as NonNullable<
      (typeof leaderboardData)[number]
    >[];

    // Sort by total score, then by quiz count, then by avg percentage
    validData.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.quizCount !== a.quizCount) return b.quizCount - a.quizCount;
      return b.avgPercentage - a.avgPercentage;
    });

    // Add rank
    return validData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  },
});

// Get global leaderboard (across all groups)
export const getGlobalLeaderboard = query({
  args: {
    period: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("allTime"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let currentUser;
    try {
      currentUser = await getAuthenticatedUser(ctx);
    } catch {
      currentUser = null;
    }

    const period: Period = args.period ?? "week";
    const limit = args.limit ?? 50;

    // Calculate time filter
    const now = Date.now();
    let startTime = 0;
    if (period === "week") {
      startTime = now - 7 * 24 * 60 * 60 * 1000;
    } else if (period === "month") {
      startTime = now - 30 * 24 * 60 * 60 * 1000;
    }

    // Get all quiz attempts
    const allAttempts = await ctx.db.query("quizAttempts").collect();

    // Filter by time period
    const relevantAttempts =
      period === "allTime"
        ? allAttempts
        : allAttempts.filter((a) => a.completedAt >= startTime);

    // Group by user
    const userScores = new Map<
      string,
      { totalScore: number; totalPossible: number; quizCount: number; percentageSum: number }
    >();

    for (const attempt of relevantAttempts) {
      const existing = userScores.get(attempt.userId) ?? {
        totalScore: 0,
        totalPossible: 0,
        quizCount: 0,
        percentageSum: 0,
      };

      userScores.set(attempt.userId, {
        totalScore: existing.totalScore + attempt.score,
        totalPossible: existing.totalPossible + attempt.totalPoints,
        quizCount: existing.quizCount + 1,
        percentageSum: existing.percentageSum + attempt.percentage,
      });
    }

    // Build leaderboard entries
    const leaderboardData = await Promise.all(
      Array.from(userScores.entries()).map(async ([userIdStr, stats]) => {
        const userId = userIdStr as Id<"users">;

        // Query the users table directly to get proper typing
        const users = await ctx.db.query("users").collect();
        const user = users.find(u => u._id === userId);
        if (!user) return null;

        // Get streak
        const streak = await ctx.db
          .query("streaks")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        const today = new Date().toISOString().split("T")[0];
        let currentStreak = 0;
        if (streak) {
          const lastDate = new Date(streak.lastActivityDate);
          const todayDate = new Date(today);
          const diffTime = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          currentStreak = diffDays > 1 ? 0 : streak.currentStreak;
        }

        return {
          userId,
          username: user.username,
          fullname: user.fullname,
          image: user.image ?? user.profileImage,
          totalScore: stats.totalScore,
          totalPossible: stats.totalPossible,
          quizCount: stats.quizCount,
          avgPercentage: Math.round(stats.percentageSum / stats.quizCount),
          currentStreak,
          isCurrentUser: currentUser?._id === userId,
        };
      }),
    );

    // Filter nulls and sort
    const validData = leaderboardData.filter(Boolean) as NonNullable<
      (typeof leaderboardData)[number]
    >[];

    validData.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.quizCount !== a.quizCount) return b.quizCount - a.quizCount;
      return b.avgPercentage - a.avgPercentage;
    });

    // Add rank and limit
    return validData.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  },
});

// Get current user's rank in a group
export const getUserRank = query({
  args: {
    groupId: v.id("groups"),
    period: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("allTime"))),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Get full leaderboard (reuse logic)
    const period: Period = args.period ?? "week";

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const quizIds = new Set(quizzes.map((q) => q._id));

    const now = Date.now();
    let startTime = 0;
    if (period === "week") {
      startTime = now - 7 * 24 * 60 * 60 * 1000;
    } else if (period === "month") {
      startTime = now - 30 * 24 * 60 * 60 * 1000;
    }

    const scores: { oduserId: Id<"users">; totalScore: number }[] = [];

    for (const member of members) {
      const attempts = await ctx.db
        .query("quizAttempts")
        .withIndex("by_user", (q) => q.eq("userId", member.userId))
        .collect();

      const relevantAttempts = attempts.filter(
        (a) =>
          quizIds.has(a.quizId) &&
          (period === "allTime" || a.completedAt >= startTime),
      );

      const totalScore = relevantAttempts.reduce((sum, a) => sum + a.score, 0);
      scores.push({ oduserId: member.userId, totalScore });
    }

    scores.sort((a, b) => b.totalScore - a.totalScore);

    const userRankIndex = scores.findIndex((s) => s.oduserId === user._id);

    if (userRankIndex === -1) {
      return { rank: null, totalParticipants: scores.length };
    }

    return {
      rank: userRankIndex + 1,
      totalParticipants: scores.length,
      totalScore: scores[userRankIndex].totalScore,
    };
  },
});
