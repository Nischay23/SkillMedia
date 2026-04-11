// convex/userPreferences.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// Get current user's preferences
export const getMyPreferences = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) return null;

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) =>
        q.eq("userId", currentUser._id),
      )
      .first();

    return preferences;
  },
});

// Save/update preferences (partial update)
export const savePreferences = mutation({
  args: {
    qualification: v.optional(v.string()),
    interestedCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) =>
        q.eq("userId", currentUser._id),
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing preferences
      const updates: Record<string, any> = {
        updatedAt: now,
      };
      if (args.qualification !== undefined) {
        updates.qualification = args.qualification;
      }
      if (args.interestedCategories !== undefined) {
        updates.interestedCategories =
          args.interestedCategories;
      }
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      // Create new preferences
      return await ctx.db.insert("userPreferences", {
        userId: currentUser._id,
        qualification: args.qualification,
        interestedCategories: args.interestedCategories,
        onboardingCompleted: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Complete onboarding with final preferences
export const completeOnboarding = mutation({
  args: {
    qualification: v.string(),
    interestedCategories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) =>
        q.eq("userId", currentUser._id),
      )
      .first();

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    if (existing) {
      await ctx.db.patch(existing._id, {
        qualification: args.qualification,
        interestedCategories: args.interestedCategories,
        onboardingCompleted: true,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: currentUser._id,
        qualification: args.qualification,
        interestedCategories: args.interestedCategories,
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Track analytics event
    await ctx.db.insert("analytics", {
      type: "onboarding_completed",
      value: 1,
      date: today,
      createdAt: now,
    });

    return { success: true };
  },
});

// Check if user has completed onboarding
export const checkOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) return false;

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) =>
        q.eq("userId", currentUser._id),
      )
      .first();

    return preferences?.onboardingCompleted ?? false;
  },
});

// Skip onboarding (mark as complete without full preferences)
export const skipOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) =>
        q.eq("userId", currentUser._id),
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        onboardingCompleted: true,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: currentUser._id,
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
