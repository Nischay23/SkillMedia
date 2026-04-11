// convex/aiConfig.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";
import { Id } from "./_generated/dataModel";

// Get global AI settings
export const getGlobalSettings = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const settings = await ctx.db
      .query("aiSettings")
      .filter((q) => q.eq(q.field("groupId"), undefined))
      .first();

    if (!settings) {
      // Return defaults
      return {
        isEnabled: true,
        systemPrompt:
          "You are a helpful career guidance assistant for Indian students. Answer questions about career paths, preparation strategies, relevant exams, and job prospects. Be encouraging and informative.",
        maxQueriesPerDay: 10,
        temperature: 0.7,
        model: "gemini-2.5-flash",
      };
    }

    return settings;
  },
});

// Update global AI settings
export const updateGlobalSettings = mutation({
  args: {
    isEnabled: v.boolean(),
    systemPrompt: v.optional(v.string()),
    maxQueriesPerDay: v.optional(v.number()),
    temperature: v.optional(v.number()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const existing = await ctx.db
      .query("aiSettings")
      .filter((q) => q.eq(q.field("groupId"), undefined))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("aiSettings", {
        groupId: undefined,
        isEnabled: args.isEnabled,
        systemPrompt: args.systemPrompt,
        maxQueriesPerDay: args.maxQueriesPerDay ?? 10,
        temperature: args.temperature ?? 0.7,
        model: args.model ?? "gemini-2.5-flash",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get AI settings for a specific group
export const getGroupSettings = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const settings = await ctx.db
      .query("aiSettings")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (!settings) {
      // Fall back to global settings
      const global = await ctx.db
        .query("aiSettings")
        .filter((q) => q.eq(q.field("groupId"), undefined))
        .first();

      return global || { isEnabled: true, maxQueriesPerDay: 10 };
    }

    return settings;
  },
});

// Update AI settings for a specific group
export const updateGroupSettings = mutation({
  args: {
    groupId: v.id("groups"),
    isEnabled: v.boolean(),
    systemPrompt: v.optional(v.string()),
    maxQueriesPerDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const existing = await ctx.db
      .query("aiSettings")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isEnabled: args.isEnabled,
        systemPrompt: args.systemPrompt,
        maxQueriesPerDay: args.maxQueriesPerDay,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("aiSettings", {
        groupId: args.groupId,
        isEnabled: args.isEnabled,
        systemPrompt: args.systemPrompt,
        maxQueriesPerDay: args.maxQueriesPerDay ?? 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get all groups with their AI settings
export const getGroupsWithAISettings = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const groups = await ctx.db.query("groups").collect();
    const aiSettings = await ctx.db.query("aiSettings").collect();

    const settingsMap = new Map(
      aiSettings
        .filter((s) => s.groupId)
        .map((s) => [s.groupId?.toString(), s])
    );

    const groupsWithSettings = await Promise.all(
      groups.map(async (group) => {
        const settings = settingsMap.get(group._id.toString());
        const memberCount = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        // Get AI conversation count for this group
        const conversations = await ctx.db
          .query("aiConversations")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        return {
          id: group._id,
          name: group.name,
          memberCount: memberCount.length,
          aiEnabled: settings?.isEnabled ?? true,
          conversationCount: conversations.length,
          customPrompt: !!settings?.systemPrompt,
        };
      })
    );

    return groupsWithSettings;
  },
});

// Get AI usage statistics
export const getAIUsageStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const allConversations = await ctx.db.query("aiConversations").collect();

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    const weekAgoMs = todayStartMs - 7 * 24 * 60 * 60 * 1000;

    const totalConversations = allConversations.length;
    const todayConversations = allConversations.filter(
      (c) => c.createdAt >= todayStartMs
    ).length;
    const weekConversations = allConversations.filter(
      (c) => c.createdAt >= weekAgoMs
    ).length;

    // Unique users who used AI
    const uniqueUsers = new Set(allConversations.map((c) => c.userId.toString()))
      .size;

    // Daily usage for the past 7 days
    const dailyUsage: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = allConversations.filter(
        (c) =>
          c.createdAt >= dayStart.getTime() && c.createdAt < dayEnd.getTime()
      ).length;

      dailyUsage.push({
        date: dayStart.toISOString().split("T")[0],
        count,
      });
    }

    return {
      totalConversations,
      todayConversations,
      weekConversations,
      uniqueUsers,
      dailyUsage,
    };
  },
});
