import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// ==========================================
// QUESTION QUERIES & MUTATIONS
// ==========================================

// Get all questions for a quiz (admin)
export const getQuestions = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    return questions.sort((a, b) => a.order - b.order);
  },
});

// Add a question to a quiz (admin)
export const addQuestion = mutation({
  args: {
    quizId: v.id("quizzes"),
    text: v.string(),
    type: v.union(
      v.literal("mcq_single"),
      v.literal("mcq_multiple"),
      v.literal("true_false"),
      v.literal("fill_blank"),
    ),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.union(v.string(), v.array(v.string())),
    explanation: v.optional(v.string()),
    points: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Get current question count for order
    const existingQuestions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    const maxOrder = existingQuestions.reduce(
      (max, q) => Math.max(max, q.order),
      0,
    );

    const questionId = await ctx.db.insert("questions", {
      quizId: args.quizId,
      text: args.text,
      type: args.type,
      options: args.options,
      correctAnswer: args.correctAnswer,
      explanation: args.explanation,
      order: maxOrder + 1,
      points: args.points ?? 1,
      imageUrl: args.imageUrl,
    });

    // Update quiz total questions count
    await ctx.db.patch(args.quizId, {
      totalQuestions: existingQuestions.length + 1,
    });

    return questionId;
  },
});

// Update a question (admin)
export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    text: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("mcq_single"),
        v.literal("mcq_multiple"),
        v.literal("true_false"),
        v.literal("fill_blank"),
      ),
    ),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.optional(v.union(v.string(), v.array(v.string()))),
    explanation: v.optional(v.string()),
    order: v.optional(v.number()),
    points: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
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

// Delete a question (admin)
export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    // Delete the question
    await ctx.db.delete(args.questionId);

    // Update quiz total questions count
    const remainingQuestions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", question.quizId))
      .collect();

    await ctx.db.patch(question.quizId, {
      totalQuestions: remainingQuestions.length,
    });

    // Reorder remaining questions
    const sortedRemaining = remainingQuestions.sort((a, b) => a.order - b.order);
    for (let i = 0; i < sortedRemaining.length; i++) {
      if (sortedRemaining[i].order !== i + 1) {
        await ctx.db.patch(sortedRemaining[i]._id, { order: i + 1 });
      }
    }
  },
});

// Bulk create questions (admin)
export const bulkCreateQuestions = mutation({
  args: {
    quizId: v.id("quizzes"),
    questions: v.array(
      v.object({
        text: v.string(),
        type: v.union(
          v.literal("mcq_single"),
          v.literal("mcq_multiple"),
          v.literal("true_false"),
          v.literal("fill_blank"),
        ),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.union(v.string(), v.array(v.string())),
        explanation: v.optional(v.string()),
        points: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Get current question count for order
    const existingQuestions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    let order = existingQuestions.length;

    for (const question of args.questions) {
      order++;
      await ctx.db.insert("questions", {
        quizId: args.quizId,
        text: question.text,
        type: question.type,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        order,
        points: question.points ?? 1,
      });
    }

    // Update quiz total questions count
    await ctx.db.patch(args.quizId, {
      totalQuestions: existingQuestions.length + args.questions.length,
    });

    return { added: args.questions.length };
  },
});

// Reorder questions (admin)
export const reorderQuestions = mutation({
  args: {
    questionIds: v.array(v.id("questions")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    for (let i = 0; i < args.questionIds.length; i++) {
      await ctx.db.patch(args.questionIds[i], { order: i + 1 });
    }
  },
});
