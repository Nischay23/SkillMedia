import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// ==========================================
// ADMIN QUERIES
// ==========================================

// Get all quizzes for admin (with stats)
export const getAllQuizzesForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const quizzes = await ctx.db.query("quizzes").collect();

    const enriched = await Promise.all(
      quizzes.map(async (quiz) => {
        // Get group name
        const group = await ctx.db.get(quiz.groupId);

        // Get question count
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_quiz", (q) =>
            q.eq("quizId", quiz._id),
          )
          .collect();

        // Get attempts
        const attempts = await ctx.db
          .query("quizAttempts")
          .withIndex("by_quiz", (q) =>
            q.eq("quizId", quiz._id),
          )
          .collect();

        // Calculate stats
        const avgScore =
          attempts.length > 0
            ? attempts.reduce(
                (sum, a) => sum + a.score,
                0,
              ) / attempts.length
            : 0;
        const passRate =
          attempts.length > 0 && quiz.passingScore
            ? (attempts.filter(
                (a) => a.score >= quiz.passingScore!,
              ).length /
                attempts.length) *
              100
            : 0;

        return {
          ...quiz,
          groupName: group?.name ?? "Unknown",
          questionCount: questions.length,
          attemptCount: attempts.length,
          avgScore: Math.round(avgScore * 10) / 10,
          passRate: Math.round(passRate),
        };
      }),
    );

    return enriched.sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },
});

// Get quiz stats for admin dashboard
export const getQuizStats = query({
  args: {},
  handler: async (ctx) => {
    const quizzes = await ctx.db.query("quizzes").collect();
    const attempts = await ctx.db
      .query("quizAttempts")
      .collect();

    return {
      totalQuizzes: quizzes.length,
      publishedQuizzes: quizzes.filter((q) => q.isPublished)
        .length,
      draftQuizzes: quizzes.filter((q) => !q.isPublished)
        .length,
      totalAttempts: attempts.length,
    };
  },
});

// Get quiz analytics by ID (for admin)
export const getQuizAnalytics = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    const group = await ctx.db.get(quiz.groupId);

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) =>
        q.eq("quizId", args.quizId),
      )
      .collect();

    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) =>
        q.eq("quizId", args.quizId),
      )
      .collect();

    // Score distribution (0-25%, 26-50%, 51-75%, 76-100%)
    const totalQuestions = questions.length;
    const distribution = [0, 0, 0, 0];
    attempts.forEach((a) => {
      const pct =
        totalQuestions > 0
          ? (a.score / totalQuestions) * 100
          : 0;
      if (pct <= 25) distribution[0]++;
      else if (pct <= 50) distribution[1]++;
      else if (pct <= 75) distribution[2]++;
      else distribution[3]++;
    });

    // Recent attempts (last 10)
    const recentAttempts = await Promise.all(
      attempts
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 10)
        .map(async (attempt) => {
          const user = await ctx.db.get(attempt.userId);
          return {
            ...attempt,
            user: user
              ? {
                  _id: user._id,
                  fullname: user.fullname,
                  profileImage:
                    user.profileImage ?? user.image,
                }
              : null,
          };
        }),
    );

    const avgScore =
      attempts.length > 0
        ? attempts.reduce((sum, a) => sum + a.score, 0) /
          attempts.length
        : 0;

    return {
      ...quiz,
      groupName: group?.name ?? "Unknown",
      questions: questions.sort(
        (a, b) => a.order - b.order,
      ),
      attemptCount: attempts.length,
      avgScore: Math.round(avgScore * 10) / 10,
      scoreDistribution: distribution,
      recentAttempts,
    };
  },
});

// Get groups for quiz creation dropdown
export const getGroupsForQuiz = query({
  args: {},
  handler: async (ctx) => {
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

// Update quiz (admin only)
export const updateQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    timeLimit: v.optional(v.number()),
    passingScore: v.optional(v.number()),
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
      .withIndex("by_quiz", (q) =>
        q.eq("quizId", args.quizId),
      )
      .collect();
    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    // Delete all attempts
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) =>
        q.eq("quizId", args.quizId),
      )
      .collect();
    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    // Delete quiz
    await ctx.db.delete(args.quizId);
  },
});

// ==========================================
// QUIZ QUERIES
// ==========================================

// Get published quizzes for a group
// Enriched with: question count, attempt count, current user's best score
export const getQuizzesByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await getAuthenticatedUser(ctx);
    } catch {
      user = null;
    }

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_group", (q) =>
        q.eq("groupId", args.groupId),
      )
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    const enriched = await Promise.all(
      quizzes.map(async (quiz) => {
        // Get question count
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_quiz", (q) =>
            q.eq("quizId", quiz._id),
          )
          .collect();
        const questionCount = questions.length;

        // Get attempt count
        const attempts = await ctx.db
          .query("quizAttempts")
          .withIndex("by_quiz", (q) =>
            q.eq("quizId", quiz._id),
          )
          .collect();
        const attemptCount = attempts.length;

        // Get current user's best score (if authenticated and attempted)
        let bestScore = null;
        if (user) {
          const userAttempts = attempts.filter(
            (a) => a.userId === user._id,
          );
          if (userAttempts.length > 0) {
            bestScore = Math.max(
              ...userAttempts.map((a) => a.score),
            );
          }
        }

        return {
          ...quiz,
          questionCount,
          attemptCount,
          bestScore,
        };
      }),
    );

    return enriched.sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },
});

// Get quiz with all questions
export const getQuizById = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) =>
        q.eq("quizId", args.quizId),
      )
      .collect();

    const sortedQuestions = questions.sort(
      (a, b) => a.order - b.order,
    );

    return {
      ...quiz,
      questions: sortedQuestions,
    };
  },
});

// Get top 10 attempts sorted by score desc, timeTaken asc
// Enriched with user profile data
export const getLeaderboard = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) =>
        q.eq("quizId", args.quizId),
      )
      .collect();

    // Sort by score desc, then timeTaken asc
    const sortedAttempts = attempts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // For timeTaken, lower is better (asc)
      const aTime = a.timeTaken ?? Infinity;
      const bTime = b.timeTaken ?? Infinity;
      return aTime - bTime;
    });

    // Take top 10
    const top10 = sortedAttempts.slice(0, 10);

    // Enrich with user data
    const enriched = await Promise.all(
      top10.map(async (attempt, index) => {
        const user = await ctx.db.get(attempt.userId);
        return {
          rank: index + 1,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          timeTaken: attempt.timeTaken,
          completedAt: attempt.completedAt,
          user: user
            ? {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                profileImage:
                  user.profileImage ?? user.image,
              }
            : null,
        };
      }),
    );

    return enriched;
  },
});

// ==========================================
// QUIZ MUTATIONS
// ==========================================

// Create a quiz (admin only, unpublished)
export const createQuiz = mutation({
  args: {
    groupId: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    timeLimit: v.optional(v.number()),
    passingScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const quizId = await ctx.db.insert("quizzes", {
      groupId: args.groupId,
      title: args.title,
      description: args.description,
      timeLimit: args.timeLimit,
      passingScore: args.passingScore,
      isPublished: false,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return quizId;
  },
});

// Add a question to a quiz (admin only)
export const addQuestion = mutation({
  args: {
    quizId: v.id("quizzes"),
    text: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    explanation: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const questionId = await ctx.db.insert("questions", {
      quizId: args.quizId,
      text: args.text,
      options: args.options,
      correctIndex: args.correctIndex,
      explanation: args.explanation,
      order: args.order,
    });

    return questionId;
  },
});

// Update a question (admin only)
export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    text: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    correctIndex: v.optional(v.number()),
    explanation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const { questionId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(questionId, cleanUpdates);
  },
});

// Delete a question (admin only)
export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    await ctx.db.delete(args.questionId);
  },
});

// Publish a quiz (admin only)
export const publishQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    await ctx.db.patch(args.quizId, { isPublished: true });
  },
});

// Submit a quiz attempt
export const submitQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    answers: v.array(v.number()),
    timeTaken: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Verify quiz exists
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Verify user is a group member
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q
          .eq("groupId", quiz.groupId)
          .eq("userId", user._id),
      )
      .first();

    if (!membership)
      throw new Error(
        "You must be a group member to take this quiz",
      );

    // Get questions
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) =>
        q.eq("quizId", args.quizId),
      )
      .collect();

    const sortedQuestions = questions.sort(
      (a, b) => a.order - b.order,
    );
    const totalQuestions = sortedQuestions.length;

    // Calculate score by comparing answers to correctIndex
    let score = 0;
    const correctAnswers: boolean[] = [];

    for (let i = 0; i < totalQuestions; i++) {
      const question = sortedQuestions[i];
      const userAnswer = args.answers[i];
      const isCorrect =
        userAnswer === question.correctIndex;
      correctAnswers.push(isCorrect);
      if (isCorrect) score++;
    }

    // Insert quiz attempt
    await ctx.db.insert("quizAttempts", {
      quizId: args.quizId,
      userId: user._id,
      answers: args.answers,
      score,
      totalQuestions,
      timeTaken: args.timeTaken,
      completedAt: Date.now(),
    });

    // Update challenge progress if active challenge exists (quiz type)
    const activeChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_group", (q) =>
        q.eq("groupId", quiz.groupId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("type"), "quiz"),
        ),
      )
      .collect();

    const now = Date.now();
    for (const challenge of activeChallenges) {
      if (
        challenge.startDate <= now &&
        challenge.endDate >= now
      ) {
        // Check if user has a submission for this challenge
        const existingSubmission = await ctx.db
          .query("challengeSubmissions")
          .withIndex("by_challenge", (q) =>
            q.eq("challengeId", challenge._id),
          )
          .filter((q) => q.eq(q.field("userId"), user._id))
          .first();

        if (existingSubmission) {
          const newValue = existingSubmission.value + 1;
          const isCompleted =
            newValue >= challenge.targetValue;
          await ctx.db.patch(existingSubmission._id, {
            value: newValue,
            isCompleted,
            completedAt: isCompleted
              ? Date.now()
              : existingSubmission.completedAt,
          });
        }
      }
    }

    // Calculate passed boolean
    const passingScore = quiz.passingScore ?? 0;
    const passed = score >= passingScore;

    return {
      score,
      totalQuestions,
      correctAnswers,
      passed,
    };
  },
});
