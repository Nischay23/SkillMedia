// convex/likes.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

export const getIsLiked = query({
  args: {
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    if (!args.communityPostId && !args.filterOptionId) {
      throw new Error(
        "Must provide either communityPostId or filterOptionId."
      );
    }
    try {
      const currentUser = await getAuthenticatedUser(ctx);
      let existingLike = null;

      if (args.communityPostId) {
        existingLike = await ctx.db
          .query("likes")
          .withIndex("by_user_and_community_post", (q) =>
            q
              .eq("userId", currentUser._id)
              .eq("communityPostId", args.communityPostId!)
          )
          .first();
      } else if (args.filterOptionId) {
        existingLike = await ctx.db
          .query("likes")
          .withIndex("by_user_and_filter_option", (q) =>
            q
              .eq("userId", currentUser._id)
              .eq("filterOptionId", args.filterOptionId!)
          )
          .first();
      }
      return existingLike !== null;
    } catch {
      return false;
    }
  },
});

export const toggleLike = mutation({
  args: {
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    if (!args.communityPostId && !args.filterOptionId) {
      throw new Error(
        "Must provide either communityPostId or filterOptionId."
      );
    }
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    let existingLike = null;

    if (args.communityPostId) {
      existingLike = await ctx.db
        .query("likes")
        .withIndex("by_user_and_community_post", (q) =>
          q
            .eq("userId", currentUser._id)
            .eq("communityPostId", args.communityPostId!)
        )
        .first();
    } else if (args.filterOptionId) {
      existingLike = await ctx.db
        .query("likes")
        .withIndex("by_user_and_filter_option", (q) =>
          q
            .eq("userId", currentUser._id)
            .eq("filterOptionId", args.filterOptionId!)
        )
        .first();
    }

    // Get the content document to update its like count
    const contentId = args.communityPostId || args.filterOptionId!;
    const contentDoc = await ctx.db.get(contentId);
    if (!contentDoc) throw new Error("Content not found");

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      const currentLikes = (contentDoc as any).likes || 0;
      await ctx.db.patch(contentId, {
        likes: Math.max(0, currentLikes - 1),
      });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("likes", {
        userId: currentUser._id,
        communityPostId: args.communityPostId,
        filterOptionId: args.filterOptionId,
        createdAt: Date.now(),
      });
      const currentLikes = (contentDoc as any).likes || 0;
      await ctx.db.patch(contentId, {
        likes: currentLikes + 1,
      });

      // Create notification for community posts
      if (args.communityPostId) {
        const postCreatorId = (contentDoc as any).userId;
        if (postCreatorId && postCreatorId !== currentUser._id) {
          await ctx.db.insert("notifications", {
            receiverId: postCreatorId,
            senderId: currentUser._id,
            type: "like",
            communityPostId: args.communityPostId,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
      return { liked: true };
    }
  },
});
