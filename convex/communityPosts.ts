// convex/communityPosts.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

export const getCommunityPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("communityPosts")
      .withIndex("by_creation_time")
      .order("desc")
      .take(20);

    // Enrich with user data
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        return {
          ...post,
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

    return postsWithUsers;
  },
});

export const getCommunityPostsByFilterOption = query({
  args: {
    filterOptionId: v.id("FilterOption"),
  },
  handler: async (ctx, args) => {
    // Get all active community posts
    const allPosts = await ctx.db
      .query("communityPosts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Filter posts that include the specified filterOptionId
    const filteredPosts = allPosts.filter(post => 
      post.linkedFilterOptionIds.includes(args.filterOptionId)
    ).slice(0, 20); // Take only first 20

    // Enrich with user data
    const postsWithUsers = await Promise.all(
      filteredPosts.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        return {
          ...post,
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

    return postsWithUsers;
  },
});

export const createCommunityPost = mutation({
  args: {
    content: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const postId = await ctx.db.insert("communityPosts", {
      userId: currentUser._id,
      content: args.content,
      imageUrl: args.imageUrl,
      likes: 0,
      comments: 0,
      linkedFilterOptionIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return postId;
  },
});

export const deleteCommunityPost = mutation({
  args: {
    postId: v.id("communityPosts"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (post.userId !== currentUser._id) {
      throw new Error("You can only delete your own posts");
    }

    // Delete associated comments, likes, and saved content
    const comments = await ctx.db
      .query("comments")
      .filter((q) =>
        q.eq(q.field("communityPostId"), args.postId)
      )
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    const likes = await ctx.db
      .query("likes")
      .filter((q) =>
        q.eq(q.field("communityPostId"), args.postId)
      )
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    const savedContent = await ctx.db
      .query("savedContent")
      .filter((q) =>
        q.eq(q.field("communityPostId"), args.postId)
      )
      .collect();

    for (const saved of savedContent) {
      await ctx.db.delete(saved._id);
    }

    // Delete the post
    await ctx.db.delete(args.postId);

    return { success: true };
  },
});

export const getCommunityPostById = query({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const user = await ctx.db.get(post.userId);

    return {
      ...post,
      user: user
        ? {
            _id: user._id,
            username: user.username,
            fullname: user.fullname,
            profileImage: user.profileImage,
          }
        : null,
    };
  },
});

export const getCommunityPostsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("communityPosts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    const user = await ctx.db.get(args.userId);

    // Enrich with user data
    const postsWithUsers = posts.map((post) => ({
      ...post,
      user: user
        ? {
            _id: user._id,
            username: user.username,
            fullname: user.fullname,
            profileImage: user.profileImage,
          }
        : null,
    }));

    return postsWithUsers;
  },
});
