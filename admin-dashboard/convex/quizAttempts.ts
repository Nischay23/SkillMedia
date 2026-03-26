import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// ==========================================
// QUIZ ATTEMPTS QUERIES
// ==========================================

// Get user's attempt for a quiz
export const getAttempt = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const attempt = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz_and_user", (q) =>
        q.eq("quizId", args.quizId).eq("userId", user._id),
      )
      .first();

    return attempt;
  },
});

// Get all attempts for current user
export const getUserAttempts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Enrich with quiz info
    const enriched = await Promise.all(
      attempts.map(async (attempt) => {
        const quiz = await ctx.db.get(attempt.quizId);
        return {
          ...attempt,
          quizTitle: quiz?.title ?? "Unknown Quiz",
        };
      }),
    );

    return enriched.sort(
      (a, b) => b.completedAt - a.completedAt,
    );
  },
});

// Check if user has attempted a quiz
export const hasAttempted = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const attempt = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz_and_user", (q) =>
        q.eq("quizId", args.quizId).eq("userId", user._id),
      )
      .first();

    return !!attempt;
  },
});
