// convex/pushNotifications.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";
import { Id } from "./_generated/dataModel";

// Get all broadcast notifications
export const getBroadcastNotifications = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const limit = args.limit || 50;

    let notifications = await ctx.db
      .query("broadcastNotifications")
      .order("desc")
      .collect();

    if (args.status && args.status !== "all") {
      notifications = notifications.filter((n) => n.status === args.status);
    }

    // Get creator details
    const notificationsWithCreator = await Promise.all(
      notifications.slice(0, limit).map(async (notification) => {
        const creator = await ctx.db.get(notification.createdBy);
        return {
          ...notification,
          creator: creator
            ? { name: creator.fullname, image: creator.profileImage }
            : null,
        };
      })
    );

    return notificationsWithCreator;
  },
});

// Create a new broadcast notification
export const createBroadcastNotification = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    data: v.optional(v.string()),
    targetAudience: v.string(),
    targetId: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const status = args.scheduledAt ? "scheduled" : "draft";

    const notificationId = await ctx.db.insert("broadcastNotifications", {
      title: args.title,
      body: args.body,
      data: args.data,
      targetAudience: args.targetAudience,
      targetId: args.targetId,
      scheduledAt: args.scheduledAt,
      status,
      createdBy: currentUser._id,
      createdAt: Date.now(),
    });

    return { success: true, id: notificationId };
  },
});

// Update a broadcast notification
export const updateBroadcastNotification = mutation({
  args: {
    id: v.id("broadcastNotifications"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    data: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    targetId: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");
    if (notification.status === "sent")
      throw new Error("Cannot edit sent notification");

    const updates: Record<string, unknown> = {};
    if (args.title) updates.title = args.title;
    if (args.body) updates.body = args.body;
    if (args.data !== undefined) updates.data = args.data;
    if (args.targetAudience) updates.targetAudience = args.targetAudience;
    if (args.targetId !== undefined) updates.targetId = args.targetId;
    if (args.scheduledAt !== undefined) {
      updates.scheduledAt = args.scheduledAt;
      updates.status = args.scheduledAt ? "scheduled" : "draft";
    }

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

// Delete a broadcast notification
export const deleteBroadcastNotification = mutation({
  args: { id: v.id("broadcastNotifications") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");
    if (notification.status === "sent")
      throw new Error("Cannot delete sent notification");

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Send a notification immediately
export const sendBroadcastNotification = mutation({
  args: { id: v.id("broadcastNotifications") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");
    if (notification.status === "sent")
      throw new Error("Notification already sent");

    // Get target users based on audience
    let targetUsers = await ctx.db.query("users").collect();

    if (notification.targetAudience === "group" && notification.targetId) {
      // Get members of the specific group
      const members = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) =>
          q.eq("groupId", notification.targetId as Id<"groups">)
        )
        .collect();
      const memberUserIds = new Set(members.map((m) => m.userId.toString()));
      targetUsers = targetUsers.filter((u) => memberUserIds.has(u._id.toString()));
    } else if (
      notification.targetAudience === "qualification" &&
      notification.targetId
    ) {
      // Get users with matching qualification preference
      const preferences = await ctx.db.query("userPreferences").collect();
      const matchingUserIds = new Set(
        preferences
          .filter((p) => p.qualification === notification.targetId)
          .map((p) => p.userId.toString())
      );
      targetUsers = targetUsers.filter((u) =>
        matchingUserIds.has(u._id.toString())
      );
    }

    // Filter users with push tokens
    const usersWithTokens = targetUsers.filter((u) => u.pushToken);

    // In a real implementation, you would send via Expo Push Notification service
    // For now, we'll just mark as sent and record the count
    // TODO: Integrate with expo-notifications server-side sending

    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      recipientCount: usersWithTokens.length,
    });

    // Note: Individual notification tracking is handled via push notifications
    // The broadcastNotifications table tracks the broadcast itself

    return {
      success: true,
      recipientCount: usersWithTokens.length,
    };
  },
});

// Get notification stats
export const getNotificationStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const notifications = await ctx.db.query("broadcastNotifications").collect();

    const draft = notifications.filter((n) => n.status === "draft").length;
    const scheduled = notifications.filter((n) => n.status === "scheduled")
      .length;
    const sent = notifications.filter((n) => n.status === "sent").length;
    const totalRecipients = notifications
      .filter((n) => n.status === "sent")
      .reduce((sum, n) => sum + (n.recipientCount || 0), 0);

    // Get users with push tokens
    const users = await ctx.db.query("users").collect();
    const usersWithTokens = users.filter((u) => u.pushToken).length;

    return {
      draft,
      scheduled,
      sent,
      total: notifications.length,
      totalRecipients,
      usersWithTokens,
      totalUsers: users.length,
    };
  },
});

// Get available target groups
export const getTargetGroups = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    const groups = await ctx.db.query("groups").collect();

    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        return {
          id: group._id,
          name: group.name,
          memberCount: members.length,
        };
      })
    );

    return groupsWithMembers.sort((a, b) => b.memberCount - a.memberCount);
  },
});

// Get qualifications for targeting
export const getTargetQualifications = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin) throw new Error("Admin only");

    // Get root level filter options (qualifications)
    const qualifications = await ctx.db
      .query("FilterOption")
      .filter((q) => q.eq(q.field("type"), "qualification"))
      .collect();

    // Count users for each qualification
    const preferences = await ctx.db.query("userPreferences").collect();

    return qualifications.map((q) => ({
      name: q.name,
      userCount: preferences.filter((p) => p.qualification === q.name).length,
    }));
  },
});
