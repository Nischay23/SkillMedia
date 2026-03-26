import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// ==========================================
// ADMIN QUERIES
// ==========================================

// Get all challenges for admin (with stats)
export const getAllChallengesForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const challenges = await ctx.db
      .query("challenges")
      .collect();

    const enriched = await Promise.all(
      challenges.map(async (challenge) => {
        const group = await ctx.db.get(challenge.groupId);

        const submissions = await ctx.db
          .query("challengeSubmissions")
          .withIndex("by_challenge", (q) =>
            q.eq("challengeId", challenge._id),
          )
          .collect();

        const completedCount = submissions.filter(
          (s) => s.isCompleted,
        ).length;

        return {
          ...challenge,
          groupName: group?.name ?? "Unknown",
          participantCount: submissions.length,
          completedCount,
        };
      }),
    );

    return enriched.sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },
});

// Get challenge stats for admin
export const getChallengeStats = query({
  args: {},
  handler: async (ctx) => {
    const challenges = await ctx.db
      .query("challenges")
      .collect();
    const submissions = await ctx.db
      .query("challengeSubmissions")
      .collect();

    const now = Date.now();
    const activeChallenges = challenges.filter(
      (c) =>
        c.isActive &&
        c.startDate <= now &&
        c.endDate >= now,
    );

    return {
      totalChallenges: challenges.length,
      activeChallenges: activeChallenges.length,
      totalParticipants: submissions.length,
      completedSubmissions: submissions.filter(
        (s) => s.isCompleted,
      ).length,
    };
  },
});

// Get groups for challenge creation
export const getGroupsForChallenge = query({
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

// Create challenge (admin only)
export const createChallenge = mutation({
  args: {
    groupId: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("quiz"),
      v.literal("steps"),
      v.literal("streak"),
    ),
    targetValue: v.number(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const challengeId = await ctx.db.insert("challenges", {
      groupId: args.groupId,
      title: args.title,
      description: args.description,
      type: args.type,
      targetValue: args.targetValue,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return challengeId;
  },
});

// Update challenge (admin only)
export const updateChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    targetValue: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
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

// Delete challenge (admin only)
export const deleteChallenge = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Delete all submissions
    const submissions = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", args.challengeId),
      )
      .collect();
    for (const submission of submissions) {
      await ctx.db.delete(submission._id);
    }

    // Delete challenge
    await ctx.db.delete(args.challengeId);
  },
});

// ==========================================
// CHALLENGE QUERIES
// ==========================================

// Get active challenges for a group
// Each with current user's submission if exists
export const getChallengesByGroup = query({
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
      .withIndex("by_group", (q) =>
        q.eq("groupId", args.groupId),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const now = Date.now();

    // Filter to only active challenges within date range
    const activeChallenges = challenges.filter(
      (c) => c.startDate <= now && c.endDate >= now,
    );

    // Enrich with user's submission and participant data
    const enriched = await Promise.all(
      activeChallenges.map(async (challenge) => {
        let userSubmission = null;

        // Get all submissions for this challenge
        const allSubmissions = await ctx.db
          .query("challengeSubmissions")
          .withIndex("by_challenge", (q) =>
            q.eq("challengeId", challenge._id),
          )
          .collect();

        if (user) {
          const submission = allSubmissions.find(
            (s) => s.userId === user._id,
          );

          if (submission) {
            userSubmission = {
              value: submission.value,
              isCompleted: submission.isCompleted,
              completedAt: submission.completedAt,
            };
          }
        }

        // Get participant info (first 3 for avatar display)
        const participants = await Promise.all(
          allSubmissions
            .slice(0, 3)
            .map(async (submission) => {
              const participantUser = await ctx.db.get(
                submission.userId,
              );
              return participantUser
                ? {
                    profileImage:
                      participantUser.profileImage ??
                      participantUser.image,
                    fullname: participantUser.fullname,
                  }
                : null;
            }),
        );

        return {
          ...challenge,
          userSubmission,
          timeRemaining: challenge.endDate - now,
          participantCount: allSubmissions.length,
          participants: participants.filter(Boolean),
        };
      }),
    );

    // Sort by end date (soonest first)
    return enriched.sort((a, b) => a.endDate - b.endDate);
  },
});

// Get challenge leaderboard
// Submissions sorted by value desc, enriched with user profile data
export const getChallengeLeaderboard = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", args.challengeId),
      )
      .collect();

    // Sort by value desc
    const sortedSubmissions = submissions.sort(
      (a, b) => b.value - a.value,
    );

    // Enrich with user data
    const enriched = await Promise.all(
      sortedSubmissions.map(async (submission, index) => {
        const user = await ctx.db.get(submission.userId);
        return {
          rank: index + 1,
          value: submission.value,
          isCompleted: submission.isCompleted,
          completedAt: submission.completedAt,
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
// CHALLENGE MUTATIONS
// ==========================================

// Join a challenge
export const joinChallenge = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Check if already joined
    const existing = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", args.challengeId),
      )
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existing) {
      throw new Error("Already joined this challenge");
    }

    // Verify challenge exists and is active
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (!challenge.isActive)
      throw new Error("Challenge is not active");

    const now = Date.now();
    if (challenge.endDate < now)
      throw new Error("Challenge has ended");

    // Insert challengeSubmission (value: 0, isCompleted: false)
    const submissionId = await ctx.db.insert(
      "challengeSubmissions",
      {
        challengeId: args.challengeId,
        userId: user._id,
        value: 0,
        isCompleted: false,
      },
    );

    return submissionId;
  },
});

// Update challenge progress
export const updateChallengeProgress = mutation({
  args: {
    challengeId: v.id("challenges"),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Get the submission
    const submission = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", args.challengeId),
      )
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!submission) {
      throw new Error("You haven't joined this challenge");
    }

    // Get the challenge to check target value
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    // Update submission value
    const isCompleted = args.value >= challenge.targetValue;

    await ctx.db.patch(submission._id, {
      value: args.value,
      isCompleted,
      completedAt:
        isCompleted && !submission.isCompleted
          ? Date.now()
          : submission.completedAt,
    });
  },
});
