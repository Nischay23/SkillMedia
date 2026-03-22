import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";
import { Id } from "./_generated/dataModel";

// ==========================================
// ROADMAP QUERIES & MUTATIONS
// ==========================================

// Get all roadmaps (admin)
export const getAllRoadmaps = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const roadmaps = await ctx.db
      .query("roadmaps")
      .collect();

    const enriched = await Promise.all(
      roadmaps.map(async (roadmap) => {
        const group = await ctx.db.get(roadmap.groupId);
        const filterOption = roadmap.filterOptionId
          ? await ctx.db.get(roadmap.filterOptionId)
          : null;

        // Get milestone count
        const milestones = await ctx.db
          .query("milestones")
          .withIndex("by_roadmap", (q) =>
            q.eq("roadmapId", roadmap._id),
          )
          .collect();

        // Get step count
        const steps = await ctx.db
          .query("roadmapSteps")
          .withIndex("by_roadmap", (q) =>
            q.eq("roadmapId", roadmap._id),
          )
          .collect();

        // Get unique users who have progress
        const progress = await ctx.db
          .query("userRoadmapProgress")
          .withIndex("by_roadmap", (q) =>
            q.eq("roadmapId", roadmap._id),
          )
          .collect();
        const uniqueUsers = new Set(
          progress.map((p) => p.userId),
        ).size;

        return {
          ...roadmap,
          groupName: group?.name ?? "Unknown",
          filterOptionName: filterOption?.name ?? "Unknown",
          milestoneCount: milestones.length,
          stepCount: steps.length,
          usersStarted: uniqueUsers,
        };
      }),
    );

    return enriched.sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },
});

// Get roadmap by ID (admin)
export const getRoadmap = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) return null;

    const group = await ctx.db.get(roadmap.groupId);
    const filterOption = roadmap.filterOptionId
      ? await ctx.db.get(roadmap.filterOptionId)
      : null;

    return {
      ...roadmap,
      groupName: group?.name ?? "Unknown",
      filterOptionName: filterOption?.name ?? "Unknown",
    };
  },
});

// Get roadmap by group ID (for mobile app)
export const getRoadmapByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db
      .query("roadmaps")
      .withIndex("by_group", (q) =>
        q.eq("groupId", args.groupId),
      )
      .filter((q) => q.eq(q.field("isPublished"), true))
      .first();

    return roadmap;
  },
});

// Get roadmap with full details (milestones and steps)
export const getRoadmapWithDetails = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    let user;
    try {
      user = await getAuthenticatedUser(ctx);
    } catch {
      user = null;
    }

    const roadmap = await ctx.db
      .query("roadmaps")
      .withIndex("by_group", (q) =>
        q.eq("groupId", args.groupId),
      )
      .filter((q) => q.eq(q.field("isPublished"), true))
      .first();

    if (!roadmap) return null;

    // Get all milestones
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap", (q) =>
        q.eq("roadmapId", roadmap._id),
      )
      .collect();

    // Sort by order
    const sortedMilestones = milestones.sort(
      (a, b) => a.order - b.order,
    );

    // Get user progress if authenticated
    let completedStepIds: Set<string> = new Set();
    if (user) {
      const userProgress = await ctx.db
        .query("userRoadmapProgress")
        .withIndex("by_user_and_roadmap", (q) =>
          q
            .eq("userId", user._id)
            .eq("roadmapId", roadmap._id),
        )
        .collect();
      completedStepIds = new Set(
        userProgress.map((p) => p.stepId),
      );
    }

    // Enrich milestones with steps
    const enrichedMilestones = await Promise.all(
      sortedMilestones.map(async (milestone) => {
        const steps = await ctx.db
          .query("roadmapSteps")
          .withIndex("by_milestone", (q) =>
            q.eq("milestoneId", milestone._id),
          )
          .collect();

        const sortedSteps = steps.sort(
          (a, b) => a.order - b.order,
        );

        const enrichedSteps = sortedSteps.map((step) => ({
          ...step,
          isCompleted: completedStepIds.has(step._id),
        }));

        const completedCount = enrichedSteps.filter(
          (s) => s.isCompleted,
        ).length;

        return {
          ...milestone,
          steps: enrichedSteps,
          totalSteps: enrichedSteps.length,
          completedSteps: completedCount,
          isCompleted:
            completedCount === enrichedSteps.length &&
            enrichedSteps.length > 0,
        };
      }),
    );

    const totalSteps = enrichedMilestones.reduce(
      (acc, m) => acc + m.totalSteps,
      0,
    );
    const completedSteps = enrichedMilestones.reduce(
      (acc, m) => acc + m.completedSteps,
      0,
    );

    return {
      ...roadmap,
      milestones: enrichedMilestones,
      totalSteps,
      completedSteps,
      progressPercent:
        totalSteps > 0
          ? Math.round((completedSteps / totalSteps) * 100)
          : 0,
    };
  },
});

// Create roadmap (admin)
export const createRoadmap = mutation({
  args: {
    groupId: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
      ),
    ),
    estimatedDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Get group's filterOptionId
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const roadmapId = await ctx.db.insert("roadmaps", {
      groupId: args.groupId,
      filterOptionId: group.filterOptionId,
      title: args.title,
      description: args.description,
      totalSteps: 0,
      estimatedDays: args.estimatedDays,
      difficulty: args.difficulty,
      isPublished: false,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return roadmapId;
  },
});

// Update roadmap (admin)
export const updateRoadmap = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
      ),
    ),
    estimatedDays: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const { roadmapId, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(roadmapId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete roadmap (admin)
export const deleteRoadmap = mutation({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Delete all progress
    const progress = await ctx.db
      .query("userRoadmapProgress")
      .withIndex("by_roadmap", (q) =>
        q.eq("roadmapId", args.roadmapId),
      )
      .collect();
    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    // Delete all steps
    const steps = await ctx.db
      .query("roadmapSteps")
      .withIndex("by_roadmap", (q) =>
        q.eq("roadmapId", args.roadmapId),
      )
      .collect();
    for (const step of steps) {
      await ctx.db.delete(step._id);
    }

    // Delete all milestones
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap", (q) =>
        q.eq("roadmapId", args.roadmapId),
      )
      .collect();
    for (const milestone of milestones) {
      await ctx.db.delete(milestone._id);
    }

    // Delete roadmap
    await ctx.db.delete(args.roadmapId);
  },
});

// ==========================================
// MILESTONE QUERIES & MUTATIONS
// ==========================================

// Get milestones for a roadmap
export const getMilestones = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap", (q) =>
        q.eq("roadmapId", args.roadmapId),
      )
      .collect();

    return milestones.sort((a, b) => a.order - b.order);
  },
});

// Create milestone (admin)
export const createMilestone = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Get current max order
    const existingMilestones = await ctx.db
      .query("milestones")
      .withIndex("by_roadmap", (q) =>
        q.eq("roadmapId", args.roadmapId),
      )
      .collect();
    const maxOrder = existingMilestones.reduce(
      (max, m) => Math.max(max, m.order),
      0,
    );

    const milestoneId = await ctx.db.insert("milestones", {
      roadmapId: args.roadmapId,
      title: args.title,
      description: args.description,
      order: maxOrder + 1,
      stepCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update roadmap timestamp
    await ctx.db.patch(args.roadmapId, {
      updatedAt: Date.now(),
    });

    return milestoneId;
  },
});

// Update milestone (admin)
export const updateMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const { milestoneId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(milestoneId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete milestone (admin)
export const deleteMilestone = mutation({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    // Delete all steps in this milestone
    const steps = await ctx.db
      .query("roadmapSteps")
      .withIndex("by_milestone", (q) =>
        q.eq("milestoneId", args.milestoneId),
      )
      .collect();

    for (const step of steps) {
      // Delete progress for each step
      const progress = await ctx.db
        .query("userRoadmapProgress")
        .withIndex("by_user_and_step", (q) =>
          q.eq(
            "userId",
            step._id as unknown as Id<"users">,
          ),
        )
        .collect();
      for (const p of progress) {
        if (p.stepId === step._id) {
          await ctx.db.delete(p._id);
        }
      }
      await ctx.db.delete(step._id);
    }

    // Delete milestone
    await ctx.db.delete(args.milestoneId);

    // Update roadmap timestamp
    await ctx.db.patch(milestone.roadmapId, {
      updatedAt: Date.now(),
    });
  },
});

// ==========================================
// STEP QUERIES & MUTATIONS
// ==========================================

// Get steps for a milestone
export const getSteps = query({
  args: { milestoneId: v.id("milestones") },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("roadmapSteps")
      .withIndex("by_milestone", (q) =>
        q.eq("milestoneId", args.milestoneId),
      )
      .collect();

    return steps.sort((a, b) => a.order - b.order);
  },
});

// Create step (admin)
export const createStep = mutation({
  args: {
    milestoneId: v.id("milestones"),
    title: v.string(),
    description: v.optional(v.string()),
    resourceUrl: v.optional(v.string()),
    contentType: v.optional(
      v.union(
        v.literal("video"),
        v.literal("article"),
        v.literal("practice"),
        v.literal("quiz"),
        v.literal("project"),
      ),
    ),
    estimatedMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    // Get current max order
    const existingSteps = await ctx.db
      .query("roadmapSteps")
      .withIndex("by_milestone", (q) =>
        q.eq("milestoneId", args.milestoneId),
      )
      .collect();
    const maxOrder = existingSteps.reduce(
      (max, s) => Math.max(max, s.order),
      0,
    );

    const stepId = await ctx.db.insert("roadmapSteps", {
      milestoneId: args.milestoneId,
      roadmapId: milestone.roadmapId,
      title: args.title,
      description: args.description,
      order: maxOrder + 1,
      resourceUrl: args.resourceUrl,
      contentType: args.contentType,
      estimatedMinutes: args.estimatedMinutes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update milestone step count
    await ctx.db.patch(args.milestoneId, {
      stepCount: existingSteps.length + 1,
      updatedAt: Date.now(),
    });

    // Update roadmap total steps
    const roadmap = await ctx.db.get(milestone.roadmapId);
    if (roadmap) {
      await ctx.db.patch(milestone.roadmapId, {
        totalSteps: roadmap.totalSteps + 1,
        updatedAt: Date.now(),
      });
    }

    return stepId;
  },
});

// Update step (admin)
export const updateStep = mutation({
  args: {
    stepId: v.id("roadmapSteps"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    resourceUrl: v.optional(v.string()),
    contentType: v.optional(
      v.union(
        v.literal("video"),
        v.literal("article"),
        v.literal("practice"),
        v.literal("quiz"),
        v.literal("project"),
      ),
    ),
    estimatedMinutes: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const { stepId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(stepId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete step (admin)
export const deleteStep = mutation({
  args: { stepId: v.id("roadmapSteps") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const step = await ctx.db.get(args.stepId);
    if (!step) throw new Error("Step not found");

    // Delete progress for this step
    const progress = await ctx.db
      .query("userRoadmapProgress")
      .withIndex("by_roadmap", (q) =>
        q.eq("roadmapId", step.roadmapId),
      )
      .collect();
    for (const p of progress) {
      if (p.stepId === args.stepId) {
        await ctx.db.delete(p._id);
      }
    }

    // Delete step
    await ctx.db.delete(args.stepId);

    // Update milestone step count
    const milestone = await ctx.db.get(step.milestoneId);
    if (milestone) {
      await ctx.db.patch(step.milestoneId, {
        stepCount: Math.max(0, milestone.stepCount - 1),
        updatedAt: Date.now(),
      });
    }

    // Update roadmap total steps
    const roadmap = await ctx.db.get(step.roadmapId);
    if (roadmap) {
      await ctx.db.patch(step.roadmapId, {
        totalSteps: Math.max(0, roadmap.totalSteps - 1),
        updatedAt: Date.now(),
      });
    }
  },
});

// ==========================================
// PROGRESS QUERIES & MUTATIONS
// ==========================================

// Toggle step completion
export const toggleStepComplete = mutation({
  args: {
    stepId: v.id("roadmapSteps"),
    roadmapId: v.id("roadmaps"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Check if already completed
    const existing = await ctx.db
      .query("userRoadmapProgress")
      .withIndex("by_user_and_step", (q) =>
        q.eq("userId", user._id).eq("stepId", args.stepId),
      )
      .first();

    if (existing) {
      // Uncomplete - delete the progress entry
      await ctx.db.delete(existing._id);
      return { completed: false };
    } else {
      // Complete - create progress entry
      await ctx.db.insert("userRoadmapProgress", {
        userId: user._id,
        roadmapId: args.roadmapId,
        stepId: args.stepId,
        completedAt: Date.now(),
      });
      return { completed: true };
    }
  },
});

// Get user's progress for a roadmap
export const getUserProgress = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const progress = await ctx.db
      .query("userRoadmapProgress")
      .withIndex("by_user_and_roadmap", (q) =>
        q
          .eq("userId", user._id)
          .eq("roadmapId", args.roadmapId),
      )
      .collect();

    return progress;
  },
});

// Get progress summary for a roadmap
export const getRoadmapProgressSummary = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) return null;

    const progress = await ctx.db
      .query("userRoadmapProgress")
      .withIndex("by_user_and_roadmap", (q) =>
        q
          .eq("userId", user._id)
          .eq("roadmapId", args.roadmapId),
      )
      .collect();

    const completed = progress.length;
    const total = roadmap.totalSteps;
    const percent =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percent };
  },
});

// Get user's progress across all roadmaps (for profile)
export const getMyRoadmapsProgress = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Get all user's progress entries
    const allProgress = await ctx.db
      .query("userRoadmapProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Group by roadmap
    const progressByRoadmap = new Map<string, number>();
    for (const p of allProgress) {
      const count = progressByRoadmap.get(p.roadmapId) || 0;
      progressByRoadmap.set(p.roadmapId, count + 1);
    }

    // Get roadmap details
    const results = await Promise.all(
      Array.from(progressByRoadmap.entries()).map(
        async ([roadmapId, completed]) => {
          const roadmap = await ctx.db.get(
            roadmapId as Id<"roadmaps">,
          );
          if (!roadmap || !roadmap.isPublished) return null;

          const group = await ctx.db.get(roadmap.groupId);

          return {
            roadmapId,
            groupId: roadmap.groupId,
            title: roadmap.title,
            groupName: group?.name ?? "Unknown",
            completed,
            total: roadmap.totalSteps,
            percent:
              roadmap.totalSteps > 0
                ? Math.round(
                    (completed / roadmap.totalSteps) * 100,
                  )
                : 0,
          };
        },
      ),
    );

    return results.filter(Boolean);
  },
});

// Admin: Get progress stats for a roadmap
export const getRoadmapStats = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) return null;

    // Get all progress for this roadmap
    const allProgress = await ctx.db
      .query("userRoadmapProgress")
      .withIndex("by_roadmap", (q) =>
        q.eq("roadmapId", args.roadmapId),
      )
      .collect();

    // Get unique users who have progress
    const usersWithProgress = new Set(
      allProgress.map((p) => p.userId),
    );

    // Calculate average completion
    const progressByUser = new Map<string, number>();
    for (const p of allProgress) {
      const count = progressByUser.get(p.userId) || 0;
      progressByUser.set(p.userId, count + 1);
    }

    const completionRates = Array.from(
      progressByUser.values(),
    ).map((completed) =>
      roadmap.totalSteps > 0
        ? (completed / roadmap.totalSteps) * 100
        : 0,
    );

    const avgCompletion =
      completionRates.length > 0
        ? Math.round(
            completionRates.reduce((a, b) => a + b, 0) /
              completionRates.length,
          )
        : 0;

    // Get group member count for context
    const group = await ctx.db.get(roadmap.groupId);

    return {
      usersStarted: usersWithProgress.size,
      totalGroupMembers: group?.memberCount ?? 0,
      avgCompletion,
      totalProgress: allProgress.length,
    };
  },
});

// Get all groups for roadmap dropdown (admin)
export const getGroupsForRoadmap = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const groups = await ctx.db
      .query("groups")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Check which groups already have a roadmap
    const groupsWithRoadmaps = await Promise.all(
      groups.map(async (group) => {
        const roadmap = await ctx.db
          .query("roadmaps")
          .withIndex("by_group", (q) =>
            q.eq("groupId", group._id),
          )
          .first();

        const filterOption = await ctx.db.get(
          group.filterOptionId,
        );

        return {
          _id: group._id,
          name: group.name,
          filterOptionName: filterOption?.name ?? "Unknown",
          hasRoadmap: !!roadmap,
          roadmapId: roadmap?._id ?? null,
        };
      }),
    );

    return groupsWithRoadmaps.sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  },
});
