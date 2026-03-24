import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthenticatedUser } from "./users";
import { internal } from "./_generated/api";

// ==========================================
// QUIZ ATTEMPTS QUERIES & MUTATIONS
// ==========================================

// Submit a quiz attempt
export const submitAttempt = mutation({
  args: {
    quizId: v.id("quizzes"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedAnswer: v.union(v.string(), v.array(v.string())),
        timeTaken: v.optional(v.number()),
      }),
    ),
    timeTaken: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Check if already attempted
    const existingAttempt = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_and_quiz", (q) =>
        q.eq("userId", user._id).eq("quizId", args.quizId),
      )
      .first();

    if (existingAttempt) {
      throw new Error("You have already attempted this quiz");
    }

    // Get quiz and questions
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    // Score the answers
    let score = 0;
    let totalPoints = 0;

    const scoredAnswers = args.answers.map((answer) => {
      const question = questions.find((q) => q._id === answer.questionId);
      if (!question) {
        return {
          ...answer,
          isCorrect: false,
        };
      }

      const points = question.points ?? 1;
      totalPoints += points;

      let isCorrect = false;

      // Check correctness based on question type
      if (question.type === "mcq_single" || question.type === "true_false" || question.type === "fill_blank") {
        // Single answer comparison
        const correctAnswer = Array.isArray(question.correctAnswer)
          ? question.correctAnswer[0]
          : question.correctAnswer;
        const userAnswer = Array.isArray(answer.selectedAnswer)
          ? answer.selectedAnswer[0]
          : answer.selectedAnswer;

        isCorrect = correctAnswer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
      } else if (question.type === "mcq_multiple") {
        // Multiple answer comparison
        const correctAnswers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : [question.correctAnswer];
        const userAnswers = Array.isArray(answer.selectedAnswer)
          ? answer.selectedAnswer
          : [answer.selectedAnswer];

        // All correct answers must be selected, no wrong answers
        const correctSet = new Set(correctAnswers.map((a) => a.toLowerCase().trim()));
        const userSet = new Set(userAnswers.map((a) => a.toLowerCase().trim()));

        isCorrect =
          correctSet.size === userSet.size &&
          [...correctSet].every((a) => userSet.has(a));
      }

      if (isCorrect) {
        score += points;
      }

      return {
        ...answer,
        isCorrect,
      };
    });

    // Handle unanswered questions (add them with 0 score)
    for (const question of questions) {
      const answered = scoredAnswers.find((a) => a.questionId === question._id);
      if (!answered) {
        totalPoints += question.points ?? 1;
        scoredAnswers.push({
          questionId: question._id,
          selectedAnswer: "",
          isCorrect: false,
          timeTaken: 0,
        });
      }
    }

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    // Create the attempt
    const attemptId = await ctx.db.insert("quizAttempts", {
      userId: user._id,
      quizId: args.quizId,
      answers: scoredAnswers,
      score,
      totalPoints,
      percentage,
      timeTaken: args.timeTaken,
      completedAt: Date.now(),
    });

    // Update streak
    await ctx.scheduler.runAfter(0, internal.quizAttempts.updateStreak, {
      userId: user._id,
    });

    return {
      attemptId,
      score,
      totalPoints,
      percentage,
      correctCount: scoredAnswers.filter((a) => a.isCorrect).length,
      wrongCount: scoredAnswers.filter((a) => !a.isCorrect && a.selectedAnswer !== "").length,
      skippedCount: scoredAnswers.filter((a) => a.selectedAnswer === "").length,
    };
  },
});

// Internal mutation to update streak
export const updateStreak = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Get existing streak
    const existingStreak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingStreak) {
      // Create new streak record
      await ctx.db.insert("streaks", {
        userId: args.userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        totalQuizzesTaken: 1,
      });
      return;
    }

    // Check if already updated today
    if (existingStreak.lastActivityDate === today) {
      // Just increment total quizzes
      await ctx.db.patch(existingStreak._id, {
        totalQuizzesTaken: (existingStreak.totalQuizzesTaken ?? 0) + 1,
      });
      return;
    }

    // Check if last activity was yesterday
    const lastDate = new Date(existingStreak.lastActivityDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let newCurrentStreak = 1;
    if (diffDays === 1) {
      // Consecutive day - increment streak
      newCurrentStreak = existingStreak.currentStreak + 1;
    }
    // If diffDays > 1, streak resets to 1

    const newLongestStreak = Math.max(newCurrentStreak, existingStreak.longestStreak);

    await ctx.db.patch(existingStreak._id, {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      totalQuizzesTaken: (existingStreak.totalQuizzesTaken ?? 0) + 1,
    });
  },
});

// Get user's attempt for a quiz
export const getAttempt = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const attempt = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_and_quiz", (q) =>
        q.eq("userId", user._id).eq("quizId", args.quizId),
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
          quizType: quiz?.type ?? "unknown",
        };
      }),
    );

    return enriched.sort((a, b) => b.completedAt - a.completedAt);
  },
});

// Get quiz performance stats for user
export const getUserPerformanceStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (attempts.length === 0) {
      return {
        totalQuizzes: 0,
        avgAccuracy: 0,
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        recentPerformance: [],
      };
    }

    const avgAccuracy =
      attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length;

    // Get last 7 attempts for performance trend
    const recentAttempts = attempts
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 7);

    const recentPerformance = await Promise.all(
      recentAttempts.map(async (attempt) => {
        const quiz = await ctx.db.get(attempt.quizId);
        return {
          quizTitle: quiz?.title ?? "Quiz",
          percentage: attempt.percentage,
          completedAt: attempt.completedAt,
        };
      }),
    );

    return {
      totalQuizzes: attempts.length,
      avgAccuracy: Math.round(avgAccuracy),
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      recentPerformance: recentPerformance.reverse(), // Oldest to newest
    };
  },
});
