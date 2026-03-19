"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

// Send push notification via Expo Push API
export const sendPushNotification = action({
  args: {
    tokens: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (args.tokens.length === 0) {
      return { success: true, ticketCount: 0 };
    }

    // Filter out any invalid tokens
    const validTokens = args.tokens.filter(
      (token) =>
        token.startsWith("ExponentPushToken[") ||
        token.startsWith("ExpoPushToken["),
    );

    if (validTokens.length === 0) {
      return { success: true, ticketCount: 0 };
    }

    // Build the messages array
    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default" as const,
      title: args.title,
      body: args.body,
      data: args.data ?? {},
    }));

    try {
      // Send to Expo Push API
      const response = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Push notification error:", result);
        return { success: false, error: result };
      }

      return {
        success: true,
        ticketCount: messages.length,
        tickets: result.data,
      };
    } catch (error) {
      console.error(
        "Push notification fetch error:",
        error,
      );
      return { success: false, error: String(error) };
    }
  },
});

// Send notification for new message in group
export const notifyNewMessage = action({
  args: {
    groupId: v.id("groups"),
    groupName: v.string(),
    senderName: v.string(),
    senderId: v.id("users"),
    messagePreview: v.string(),
  },
  handler: async (ctx, args) => {
    // Get push tokens for all group members except sender
    const tokens = await ctx.runQuery(
      // @ts-ignore - internal query
      "users:getGroupMemberPushTokens",
      {
        groupId: args.groupId,
        excludeUserId: args.senderId,
      },
    );

    if (!tokens || tokens.length === 0) {
      return { success: true, notified: 0 };
    }

    // Truncate message preview
    const preview =
      args.messagePreview.length > 60
        ? args.messagePreview.substring(0, 57) + "..."
        : args.messagePreview;

    const body = `${args.senderName}: ${preview}`;

    // Send the notification
    const result = await ctx.runAction(
      // @ts-ignore - internal action
      "pushNotifications:sendPushNotification",
      {
        tokens,
        title: args.groupName,
        body,
        data: { groupId: args.groupId },
      },
    );

    return result;
  },
});
