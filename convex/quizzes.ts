import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// ==========================================
// QUIZ QUERIES & MUTATIONS
// ==========================================

// Get all quizzes for a group (with user attempt status)
export const getQuizzes = query({
  args: { groupId: v.id("groups"), type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await getAuthenticatedUser(ctx);
    } catch {
      user = null;
    }

    let quizQuery = ctx.db
      .query("quizzes")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId));

    const quizzes = await quizQuery.collect();

    // Filter by type if provided
    let filteredQuizzes = quizzes;
    if (args.type) {
      filteredQuizzes = quizzes.filter((q) => q.type === args.type);
    }

    // Filter to only published quizzes for non-admins
    if (!user?.isAdmin) {
      filteredQuizzes = filteredQuizzes.filter((q) => q.isPublished);
    }

    // Enrich with user's attempt data
    const enriched = await Promise.all(
      filteredQuizzes.map(async (quiz) => {
        let attempt = null;
        let questionCount = 0;

        // Get question count
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
          .collect();
        questionCount = questions.length;

        // Get user's attempt if authenticated
        if (user) {
          attempt = await ctx.db
            .query("quizAttempts")
            .withIndex("by_user_and_quiz", (q) =>
              q.eq("userId", user._id).eq("quizId", quiz._id),
            )
            .first();
        }

        // Check if quiz is available (within scheduled time)
        const now = Date.now();
        const isAvailable =
          (!quiz.scheduledAt || quiz.scheduledAt <= now) &&
          (!quiz.expiresAt || quiz.expiresAt > now);
        const isExpired = quiz.expiresAt && quiz.expiresAt <= now;
        const isScheduled = quiz.scheduledAt && quiz.scheduledAt > now;

        return {
          ...quiz,
          questionCount,
          attempt: attempt
            ? {
                score: attempt.score,
                totalPoints: attempt.totalPoints,
                percentage: attempt.percentage,
                completedAt: attempt.completedAt,
              }
            : null,
          isAvailable,
          isExpired,
          isScheduled,
          scheduledIn: isScheduled ? quiz.scheduledAt! - now : null,
        };
      }),
    );

    // Sort by type priority and creation date
    const typePriority: Record<string, number> = {
      daily: 1,
      weekly: 2,
      test_series: 3,
    };

    return enriched.sort((a, b) => {
      const priorityDiff = typePriority[a.type] - typePriority[b.type];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt - a.createdAt;
    });
  },
});

// Get a single quiz with questions (for taking quiz)
export const getQuizWithQuestions = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    // Check if user already attempted (for non-repeatable quizzes)
    const existingAttempt = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_and_quiz", (q) =>
        q.eq("userId", user._id).eq("quizId", args.quizId),
      )
      .first();

    if (existingAttempt) {
      return {
        ...quiz,
        questions: [],
        alreadyAttempted: true,
        previousAttempt: {
          score: existingAttempt.score,
          totalPoints: existingAttempt.totalPoints,
          percentage: existingAttempt.percentage,
        },
      };
    }

    // Get questions (without correct answers for the quiz taker)
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    const sortedQuestions = questions.sort((a, b) => a.order - b.order);

    // Remove correct answers from questions for security
    const sanitizedQuestions = sortedQuestions.map((q) => ({
      _id: q._id,
      text: q.text,
      type: q.type,
      options: q.options,
      order: q.order,
      points: q.points ?? 1,
      imageUrl: q.imageUrl,
    }));

    return {
      ...quiz,
      questions: sanitizedQuestions,
      alreadyAttempted: false,
    };
  },
});

// Get quiz for review (with correct answers and explanations)
export const getQuizForReview = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    // Get user's attempt
    const attempt = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_and_quiz", (q) =>
        q.eq("userId", user._id).eq("quizId", args.quizId),
      )
      .first();

    if (!attempt) return null;

    // Get questions with answers
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    const sortedQuestions = questions.sort((a, b) => a.order - b.order);

    // Map user's answers to questions
    const questionsWithUserAnswers = sortedQuestions.map((question) => {
      const userAnswer = attempt.answers.find(
        (a) => a.questionId === question._id,
      );
      return {
        ...question,
        userAnswer: userAnswer?.selectedAnswer ?? null,
        isCorrect: userAnswer?.isCorrect ?? false,
        timeTaken: userAnswer?.timeTaken,
      };
    });

    return {
      quiz,
      attempt: {
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        percentage: attempt.percentage,
        timeTaken: attempt.timeTaken,
        completedAt: attempt.completedAt,
      },
      questions: questionsWithUserAnswers,
    };
  },
});

// Create quiz (admin only)
export const createQuiz = mutation({
  args: {
    groupId: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("test_series"),
    ),
    timeLimit: v.optional(v.number()),
    perQuestionTime: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const quizId = await ctx.db.insert("quizzes", {
      groupId: args.groupId,
      title: args.title,
      description: args.description,
      type: args.type,
      timeLimit: args.timeLimit,
      perQuestionTime: args.perQuestionTime,
      totalQuestions: 0,
      scheduledAt: args.scheduledAt,
      expiresAt: args.expiresAt,
      isPublished: false,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return quizId;
  },
});

// Update quiz (admin only)
export const updateQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("test_series"),
      ),
    ),
    timeLimit: v.optional(v.number()),
    perQuestionTime: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const { quizId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(quizId, cleanUpdates);
  },
});

// Delete quiz (admin only)
export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Delete all questions
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    // Delete all attempts
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    // Delete quiz
    await ctx.db.delete(args.quizId);
  },
});

// Get all quizzes (admin - for management)
export const getAllQuizzes = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const quizzes = await ctx.db.query("quizzes").collect();

    const enriched = await Promise.all(
      quizzes.map(async (quiz) => {
        const group = await ctx.db.get(quiz.groupId);
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
          .collect();
        const attempts = await ctx.db
          .query("quizAttempts")
          .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
          .collect();

        const avgScore =
          attempts.length > 0
            ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
            : 0;

        return {
          ...quiz,
          groupName: group?.name ?? "Unknown",
          questionCount: questions.length,
          attemptCount: attempts.length,
          avgScore: Math.round(avgScore),
        };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get quiz stats (admin)
export const getQuizStats = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    // Calculate stats
    const totalAttempts = attempts.length;
    const avgScore =
      totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts
        : 0;

    // Per-question accuracy
    const questionStats = questions.map((question) => {
      let correctCount = 0;
      let totalAnswered = 0;

      for (const attempt of attempts) {
        const answer = attempt.answers.find((a) => a.questionId === question._id);
        if (answer) {
          totalAnswered++;
          if (answer.isCorrect) correctCount++;
        }
      }

      return {
        questionId: question._id,
        text: question.text.substring(0, 50) + (question.text.length > 50 ? "..." : ""),
        correctCount,
        totalAnswered,
        accuracy: totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0,
      };
    });

    // Score distribution
    const scoreDistribution = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    for (const attempt of attempts) {
      if (attempt.percentage <= 20) scoreDistribution["0-20"]++;
      else if (attempt.percentage <= 40) scoreDistribution["21-40"]++;
      else if (attempt.percentage <= 60) scoreDistribution["41-60"]++;
      else if (attempt.percentage <= 80) scoreDistribution["61-80"]++;
      else scoreDistribution["81-100"]++;
    }

    return {
      totalAttempts,
      avgScore: Math.round(avgScore),
      questionStats: questionStats.sort((a, b) => a.accuracy - b.accuracy),
      scoreDistribution,
    };
  },
});

// Get groups for quiz creation dropdown
export const getGroupsForQuiz = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const groups = await ctx.db
      .query("groups")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return groups.map((g) => ({
      _id: g._id,
      name: g.name,
    }));
  },
});
