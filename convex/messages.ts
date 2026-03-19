import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// Generate upload URL for images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Get messages for a group (oldest first, newest at bottom)
export const getMessages = query({
  args: {
    groupId: v.id("groups"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_group_and_created", (q) =>
        q.eq("groupId", args.groupId),
      )
      .order("asc")
      .take(limit);

    // Enrich each message with sender data and image URLs
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.userId);

        // Get image URL if it's an image message
        let imageUrl = msg.imageUrl;
        if (
          msg.type === "image" &&
          msg.storageId &&
          !imageUrl
        ) {
          imageUrl =
            (await ctx.storage.getUrl(msg.storageId)) ??
            undefined;
        }

        // Process reactions to get counts
        const reactionCounts: Record<
          string,
          {
            emoji: string;
            count: number;
            userIds: string[];
          }
        > = {};
        if (msg.reactions) {
          for (const reaction of msg.reactions) {
            if (!reactionCounts[reaction.emoji]) {
              reactionCounts[reaction.emoji] = {
                emoji: reaction.emoji,
                count: 0,
                userIds: [],
              };
            }
            reactionCounts[reaction.emoji].count++;
            reactionCounts[reaction.emoji].userIds.push(
              reaction.userId,
            );
          }
        }

        return {
          _id: msg._id,
          groupId: msg.groupId,
          userId: msg.userId,
          content: msg.isDeleted
            ? "[Message deleted]"
            : msg.content,
          type: msg.type,
          imageUrl,
          storageId: msg.storageId,
          reactions: Object.values(reactionCounts),
          isPinned: msg.isPinned ?? false,
          isDeleted: msg.isDeleted ?? false,
          createdAt: msg.createdAt,
          sender: sender
            ? {
                _id: sender._id,
                fullname: sender.fullname,
                username: sender.username,
                profileImage: sender.profileImage,
                isAdmin: sender.isAdmin ?? false,
              }
            : null,
        };
      }),
    );

    return enrichedMessages;
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    groupId: v.id("groups"),
    content: v.string(),
    type: v.optional(
      v.union(v.literal("text"), v.literal("announcement")),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Verify user is a member
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q
          .eq("groupId", args.groupId)
          .eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("Not a member");
    }

    // Only admins can send announcements
    const messageType = args.type ?? "text";
    if (
      messageType === "announcement" &&
      !user.isAdmin &&
      membership.role !== "admin"
    ) {
      throw new Error("Only admins can send announcements");
    }

    const messageId = await ctx.db.insert("messages", {
      groupId: args.groupId,
      userId: user._id,
      content: args.content.trim(),
      type: messageType,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Send an image message
export const sendImageMessage = mutation({
  args: {
    groupId: v.id("groups"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Verify user is a member
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q
          .eq("groupId", args.groupId)
          .eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("Not a member");
    }

    const messageId = await ctx.db.insert("messages", {
      groupId: args.groupId,
      userId: user._id,
      content: args.caption ?? "",
      type: "image",
      storageId: args.storageId,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Toggle reaction on a message
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Verify user is a member of the group
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q
          .eq("groupId", message.groupId)
          .eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("Not a member");
    }

    const reactions = message.reactions ?? [];
    const existingIndex = reactions.findIndex(
      (r) =>
        r.emoji === args.emoji && r.userId === user._id,
    );

    if (existingIndex >= 0) {
      // Remove the reaction
      reactions.splice(existingIndex, 1);
    } else {
      // Add the reaction
      reactions.push({
        emoji: args.emoji,
        userId: user._id,
      });
    }

    await ctx.db.patch(args.messageId, { reactions });

    return existingIndex >= 0 ? "removed" : "added";
  },
});

// Soft delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is the message owner
    const isOwner = message.userId === user._id;

    // Check if user is an app admin
    const isAppAdmin = user.isAdmin === true;

    // Check if user is a group admin
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q
          .eq("groupId", message.groupId)
          .eq("userId", user._id),
      )
      .first();
    const isGroupAdmin = membership?.role === "admin";

    if (!isOwner && !isAppAdmin && !isGroupAdmin) {
      throw new Error(
        "Unauthorized to delete this message",
      );
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      content: "",
    });
  },
});

// Get the pinned message for a group
export const getPinnedMessage = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const pinnedMessage = await ctx.db
      .query("messages")
      .withIndex("by_group", (q) =>
        q.eq("groupId", args.groupId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isPinned"), true),
          q.neq(q.field("isDeleted"), true),
        ),
      )
      .order("desc")
      .first();

    if (!pinnedMessage) return null;

    const sender = await ctx.db.get(pinnedMessage.userId);

    return {
      ...pinnedMessage,
      sender: sender
        ? {
            _id: sender._id,
            fullname: sender.fullname,
            username: sender.username,
            profileImage: sender.profileImage,
            isAdmin: sender.isAdmin ?? false,
          }
        : null,
    };
  },
});

// Pin a message (admin only)
export const pinMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is app admin or group admin
    const isAppAdmin = user.isAdmin === true;
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q
          .eq("groupId", message.groupId)
          .eq("userId", user._id),
      )
      .first();
    const isGroupAdmin = membership?.role === "admin";

    if (!isAppAdmin && !isGroupAdmin) {
      throw new Error("Only admins can pin messages");
    }

    // Unpin all other messages in this group first
    const currentlyPinned = await ctx.db
      .query("messages")
      .withIndex("by_group", (q) =>
        q.eq("groupId", message.groupId),
      )
      .filter((q) => q.eq(q.field("isPinned"), true))
      .collect();

    for (const pinnedMsg of currentlyPinned) {
      await ctx.db.patch(pinnedMsg._id, {
        isPinned: false,
      });
    }

    // Pin the new message
    await ctx.db.patch(args.messageId, { isPinned: true });
  },
});

// Unpin a message (admin only)
export const unpinMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    const isAppAdmin = user.isAdmin === true;
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q
          .eq("groupId", message.groupId)
          .eq("userId", user._id),
      )
      .first();
    const isGroupAdmin = membership?.role === "admin";

    if (!isAppAdmin && !isGroupAdmin) {
      throw new Error("Only admins can unpin messages");
    }

    await ctx.db.patch(args.messageId, { isPinned: false });
  },
});
