// convex/comments.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

export const addComment = mutation({
  args: {
    content: v.string(),
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    if (!args.communityPostId && !args.filterOptionId) {
      throw new Error(
        "Must provide either communityPostId or filterOptionId."
      );
    }
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    let contentDoc: any;
    if (args.communityPostId) {
      contentDoc = await ctx.db.get(args.communityPostId);
    } else {
      contentDoc = await ctx.db.get(args.filterOptionId!);
    }

    if (!contentDoc) throw new Error("Content not found");

    const commentId = await ctx.db.insert("comments", {
      userId: currentUser._id,
      communityPostId: args.communityPostId,
      filterOptionId: args.filterOptionId,
      content: args.content,
      parentCommentId: args.parentCommentId,
      createdAt: Date.now(),
    });

    // Increment comment count
    const contentId =
      args.communityPostId || args.filterOptionId!;
    await ctx.db.patch(contentId, {
      comments: (contentDoc.comments || 0) + 1,
    });

    // Create notification for community posts
    if (args.communityPostId) {
      const postCreatorId = contentDoc.userId;
      if (
        postCreatorId &&
        postCreatorId !== currentUser._id
      ) {
        await ctx.db.insert("notifications", {
          receiverId: postCreatorId,
          senderId: currentUser._id,
          type: "comment",
          communityPostId: args.communityPostId,
          commentId,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }
    return commentId;
  },
});

export const getComments = query({
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

    let comments;
    if (args.communityPostId) {
      comments = await ctx.db
        .query("comments")
        .withIndex("by_community_post", (q) =>
          q.eq("communityPostId", args.communityPostId!)
        )
        .collect();
    } else {
      comments = await ctx.db
        .query("comments")
        .withIndex("by_filter_option", (q) =>
          q.eq("filterOptionId", args.filterOptionId!)
        )
        .collect();
    }

    // Enrich with user data
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: user
            ? {
                _id: user._id,
                username: user.username,
                fullname: user.fullname,
                profileImage: user.profileImage,
              }
            : null,
        };
      })
    );

    return commentsWithUsers.sort(
      (a, b) => a.createdAt - b.createdAt
    );
  },
});
