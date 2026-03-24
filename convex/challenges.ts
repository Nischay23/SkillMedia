import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// ==========================================
// CHALLENGE QUERIES & MUTATIONS
// ==========================================

// Get all challenges for a group
export const getChallenges = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await getAuthenticatedUser(ctx);
    } catch {
      user = null;
    }

    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    // Filter to only active challenges for non-admins
    let filteredChallenges = challenges;
    if (!user?.isAdmin) {
      filteredChallenges = challenges.filter((c) => c.isActive);
    }

    // Enrich with submission status
    const enriched = await Promise.all(
      filteredChallenges.map(async (challenge) => {
        let userSubmission = null;
        let submissionCount = 0;

        // Get submission count
        const submissions = await ctx.db
          .query("challengeSubmissions")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();
        submissionCount = submissions.length;

        // Get user's submission if authenticated
        if (user) {
          const submission = await ctx.db
            .query("challengeSubmissions")
            .withIndex("by_user_and_challenge", (q) =>
              q.eq("userId", user._id).eq("challengeId", challenge._id),
            )
            .first();

          if (submission) {
            userSubmission = {
              content: submission.content,
              submittedAt: submission.submittedAt,
            };
          }
        }

        const now = Date.now();
        const isExpired = challenge.deadline < now;
        const timeRemaining = isExpired ? 0 : challenge.deadline - now;

        return {
          ...challenge,
          submissionCount,
          userSubmission,
          isExpired,
          timeRemaining,
        };
      }),
    );

    // Sort by deadline (soonest first), then by creation date
    return enriched.sort((a, b) => {
      if (a.isExpired && !b.isExpired) return 1;
      if (!a.isExpired && b.isExpired) return -1;
      return a.deadline - b.deadline;
    });
  },
});

// Get a single challenge with details
export const getChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return null;

    let user;
    try {
      user = await getAuthenticatedUser(ctx);
    } catch {
      user = null;
    }

    let userSubmission = null;
    if (user) {
      const submission = await ctx.db
        .query("challengeSubmissions")
        .withIndex("by_user_and_challenge", (q) =>
          q.eq("userId", user._id).eq("challengeId", args.challengeId),
        )
        .first();

      if (submission) {
        userSubmission = {
          content: submission.content,
          linkUrl: submission.linkUrl,
          submittedAt: submission.submittedAt,
        };
      }
    }

    const now = Date.now();
    const isExpired = challenge.deadline < now;

    return {
      ...challenge,
      userSubmission,
      isExpired,
      timeRemaining: isExpired ? 0 : challenge.deadline - now,
    };
  },
});

// Submit a challenge
export const submitChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    content: v.string(),
    linkUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (!challenge.isActive) throw new Error("Challenge is not active");
    if (challenge.deadline < Date.now()) throw new Error("Challenge deadline has passed");

    // Check if already submitted
    const existingSubmission = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_user_and_challenge", (q) =>
        q.eq("userId", user._id).eq("challengeId", args.challengeId),
      )
      .first();

    if (existingSubmission) {
      // Update existing submission
      await ctx.db.patch(existingSubmission._id, {
        content: args.content,
        linkUrl: args.linkUrl,
        submittedAt: Date.now(),
      });
      return existingSubmission._id;
    }

    // Create new submission
    const submissionId = await ctx.db.insert("challengeSubmissions", {
      userId: user._id,
      challengeId: args.challengeId,
      content: args.content,
      linkUrl: args.linkUrl,
      submittedAt: Date.now(),
    });

    return submissionId;
  },
});

// Create a challenge (admin only)
export const createChallenge = mutation({
  args: {
    groupId: v.id("groups"),
    title: v.string(),
    description: v.string(),
    deadline: v.number(),
    submissionFormat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const challengeId = await ctx.db.insert("challenges", {
      groupId: args.groupId,
      title: args.title,
      description: args.description,
      type: "weekly",
      deadline: args.deadline,
      submissionFormat: args.submissionFormat,
      isActive: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return challengeId;
  },
});

// Update a challenge (admin only)
export const updateChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    deadline: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const { challengeId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(challengeId, cleanUpdates);
  },
});

// Delete a challenge (admin only)
export const deleteChallenge = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Delete all submissions
    const submissions = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    for (const submission of submissions) {
      await ctx.db.delete(submission._id);
    }

    // Delete challenge
    await ctx.db.delete(args.challengeId);
  },
});

// Get all challenges (admin)
export const getAllChallenges = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const challenges = await ctx.db.query("challenges").collect();

    const enriched = await Promise.all(
      challenges.map(async (challenge) => {
        const group = await ctx.db.get(challenge.groupId);
        const submissions = await ctx.db
          .query("challengeSubmissions")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        return {
          ...challenge,
          groupName: group?.name ?? "Unknown",
          submissionCount: submissions.length,
        };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get submissions for a challenge (admin)
export const getChallengeSubmissions = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const submissions = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const enriched = await Promise.all(
      submissions.map(async (submission) => {
        const submitter = await ctx.db.get(submission.userId);
        return {
          ...submission,
          username: submitter?.username ?? "Unknown",
          fullname: submitter?.fullname ?? "Unknown",
          image: submitter?.image ?? submitter?.profileImage,
        };
      }),
    );

    return enriched.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});
