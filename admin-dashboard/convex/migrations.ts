import { mutation } from "./_generated/server";

export const fixNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Fixing notifications data...");

    // Get all notifications
    const notifications = await ctx.db
      .query("notifications")
      .collect();

    let fixedCount = 0;
    for (const notification of notifications) {
      // Check if createdAt is missing or isRead is missing
      if (
        !notification.createdAt ||
        notification.isRead === undefined
      ) {
        await ctx.db.patch(notification._id, {
          createdAt: notification.createdAt || Date.now(),
          isRead:
            notification.isRead !== undefined
              ? notification.isRead
              : false,
        });
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} notification records`);
    return `Fixed ${fixedCount} notifications`;
  },
});

export const clearInvalidNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Clearing invalid notifications...");

    // Get all notifications
    const notifications = await ctx.db
      .query("notifications")
      .collect();

    let deletedCount = 0;
    for (const notification of notifications) {
      // Delete notifications that don't have required fields and can't be fixed
      if (!notification.createdAt) {
        await ctx.db.delete(notification._id);
        deletedCount++;
      }
    }

    console.log(
      `Deleted ${deletedCount} invalid notification records`
    );
    return `Deleted ${deletedCount} notifications`;
  },
});

export const addEngagementFieldsToFilterOptions = mutation({
  args: {},
  handler: async (ctx) => {
    const filterOptions = await ctx.db
      .query("FilterOption")
      .collect();

    for (const option of filterOptions) {
      await ctx.db.patch(option._id, {
        likes: 0,
        comments: 0,
      });
    }

    console.log(
      `Updated ${filterOptions.length} FilterOption documents with likes and comments fields`
    );
    return `Updated ${filterOptions.length} FilterOption documents`;
  },
});

export const cleanupOldLikesData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all old likes documents that have postId (from old schema)
    const oldLikes = await ctx.db.query("likes").collect();
    let deletedCount = 0;

    for (const like of oldLikes) {
      // If the like has postId or is missing required fields, delete it
      if ((like as any).postId || !like.createdAt) {
        await ctx.db.delete(like._id);
        deletedCount++;
      }
    }

    console.log(
      `Deleted ${deletedCount} old likes documents`
    );
    return `Deleted ${deletedCount} old likes documents`;
  },
});

export const cleanupOldCommentsData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all old comments documents that have postId (from old schema)
    const oldComments = await ctx.db
      .query("comments")
      .collect();
    let deletedCount = 0;

    for (const comment of oldComments) {
      // If the comment has postId, delete it
      if ((comment as any).postId) {
        await ctx.db.delete(comment._id);
        deletedCount++;
      }
    }

    console.log(
      `Deleted ${deletedCount} old comments documents`
    );
    return `Deleted ${deletedCount} old comments documents`;
  },
});

export const cleanupOldSavedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all old savedContent documents that have postId (from old schema)
    const oldSaved = await ctx.db
      .query("savedContent")
      .collect();
    let deletedCount = 0;

    for (const saved of oldSaved) {
      // If the saved has postId, delete it
      if ((saved as any).postId) {
        await ctx.db.delete(saved._id);
        deletedCount++;
      }
    }

    console.log(
      `Deleted ${deletedCount} old saved documents`
    );
    return `Deleted ${deletedCount} old saved documents`;
  },
});
