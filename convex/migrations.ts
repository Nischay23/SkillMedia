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
