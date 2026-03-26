import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// ==========================================
// QUESTION QUERIES (Admin)
// ==========================================

// Get all questions for a quiz (admin)
export const getQuestions = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) =>
        q.eq("quizId", args.quizId),
      )
      .collect();

    return questions.sort((a, b) => a.order - b.order);
  },
});
