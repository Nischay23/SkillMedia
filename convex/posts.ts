import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

// Generate upload URL for file uploads
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Get feed posts with pagination and filtering
export const getFeedPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const createdByUser = post.createdBy
          ? await ctx.db.get(post.createdBy)
          : null;
        const filterOptionNames = post.filterOptionIds
          ? await Promise.all(
              post.filterOptionIds.map(
                async (id) =>
                  (await ctx.db.get(id))?.name ?? null
              )
            )
          : [];

        return {
          ...post,
          createdBy: createdByUser
            ? {
                _id: createdByUser._id,
                name:
                  createdByUser.fullname ||
                  createdByUser.username,
                profileImage:
                  createdByUser.profileImage ||
                  createdByUser.image,
              }
            : null,
          filterOptionNames:
            filterOptionNames.filter(Boolean),
        };
      })
    );

    return postsWithDetails;
  },
});

// Return posts filtered by selected filter options (AND logic)
export const getFilteredPosts = query({
  args: {
    selectedFilterIds: v.array(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    // No filters: show active posts, newest first
    if (args.selectedFilterIds.length === 0) {
      const allPosts = await ctx.db
        .query("posts")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .collect();

      const postsWithDetails = await Promise.all(
        allPosts.map(async (post) => {
          const createdByUser = post.createdBy
            ? await ctx.db.get(post.createdBy)
            : null;
          const filterOptionNames = post.filterOptionIds
            ? await Promise.all(
                post.filterOptionIds.map(
                  async (id) =>
                    (await ctx.db.get(id))?.name ?? null
                )
              )
            : [];
          return {
            ...post,
            createdBy: createdByUser
              ? {
                  _id: createdByUser._id,
                  name:
                    createdByUser.fullname ||
                    createdByUser.username,
                  profileImage:
                    createdByUser.profileImage ||
                    createdByUser.image,
                }
              : null,
            filterOptionNames:
              filterOptionNames.filter(Boolean),
          };
        })
      );
      return postsWithDetails;
    }

    // Fetch active posts and filter by all selected IDs in-memory
    const allActive = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    const filtered = allActive.filter(
      (post) =>
        post.filterOptionIds &&
        args.selectedFilterIds.every((id) =>
          post.filterOptionIds!.includes(id)
        )
    );

    const postsWithDetails = await Promise.all(
      filtered.map(async (post) => {
        const createdByUser = post.createdBy
          ? await ctx.db.get(post.createdBy)
          : null;
        const filterOptionNames = post.filterOptionIds
          ? await Promise.all(
              post.filterOptionIds.map(
                async (id) =>
                  (await ctx.db.get(id))?.name ?? null
              )
            )
          : [];
        return {
          ...post,
          createdBy: createdByUser
            ? {
                _id: createdByUser._id,
                name:
                  createdByUser.fullname ||
                  createdByUser.username,
                profileImage:
                  createdByUser.profileImage ||
                  createdByUser.image,
              }
            : null,
          filterOptionNames:
            filterOptionNames.filter(Boolean),
        };
      })
    );

    return postsWithDetails;
  },
});

// Get posts by specific user
export const getPostsByUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .filter((q) =>
        args.userId
          ? q.eq(q.field("createdBy"), args.userId)
          : q.eq(q.field("isActive"), true)
      )
      .order("desc")
      .collect();

    return await Promise.all(
      posts.map(async (post) => {
        let createdBy = null;
        if (post.createdBy) {
          const userProfile = await ctx.db.get(
            post.createdBy
          );
          if (userProfile) {
            createdBy = {
              _id: userProfile._id,
              name:
                userProfile.fullname ||
                userProfile.username ||
                "Unknown",
              profileImage: userProfile.profileImage,
            };
          }
        }

        // Get filter option names
        const filterOptionNames: (string | null)[] = [];
        if (post.filterOptionIds) {
          for (const id of post.filterOptionIds) {
            const filterOption = await ctx.db.get(id);
            filterOptionNames.push(
              filterOption?.name || null
            );
          }
        }

        return {
          ...post,
          createdBy,
          filterOptionNames,
          likes: post.likes || 0,
          comments: post.comments || 0,
        };
      })
    );
  },
});

// Admin-only create post
export const createPost = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    filterOptionIds: v.array(v.id("FilterOption")),
    postType: v.union(
      v.literal("job"),
      v.literal("skill"),
      v.literal("course")
    ),
    sourceUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    location: v.optional(v.array(v.string())),
    experience: v.optional(v.string()),
    salary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser || !currentUser.isAdmin) {
      throw new Error(
        "Unauthorized: Only admins can create posts."
      );
    }

    const postId = await ctx.db.insert("posts", {
      title: args.title,
      description: args.description,
      filterOptionIds: args.filterOptionIds,
      postType: args.postType,
      sourceUrl: args.sourceUrl,
      imageUrl: args.imageUrl,
      storageId: args.storageId,
      location: args.location,
      experience: args.experience,
      salary: args.salary,
      likes: 0,
      comments: 0,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });

    return postId;
  },
});

// Toggle like for a post and notify the creator
export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("postId", args.postId)
      )
      .first();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likes: (post.likes || 0) - 1,
      });
      return { liked: false, count: (post.likes || 0) - 1 };
    } else {
      await ctx.db.insert("likes", {
        userId: currentUser._id,
        postId: args.postId,
      });
      await ctx.db.patch(args.postId, {
        likes: (post.likes || 0) + 1,
      });

      if (
        post.createdBy &&
        post.createdBy !== currentUser._id
      ) {
        await ctx.db.insert("notifications", {
          receiverId: post.createdBy,
          senderId: currentUser._id,
          type: "like",
          postId: args.postId,
          isRead: false,
          createdAt: Date.now(),
        });
      }
      return { liked: true, count: (post.likes || 0) + 1 };
    }
  },
});

// Add a comment and notify the creator
export const addComment = mutation({
  args: {
    content: v.string(),
    postId: v.id("posts"),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const commentId = await ctx.db.insert("comments", {
      userId: currentUser._id,
      postId: args.postId,
      content: args.content,
      parentCommentId: args.parentCommentId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.postId, {
      comments: (post.comments || 0) + 1,
    });

    if (
      post.createdBy &&
      post.createdBy !== currentUser._id
    ) {
      await ctx.db.insert("notifications", {
        receiverId: post.createdBy,
        senderId: currentUser._id,
        type: "comment",
        postId: args.postId,
        commentId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return commentId;
  },
});

// Get comments for a post (with basic user info)
export const getComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) =>
        q.eq("postId", args.postId)
      )
      .collect();

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

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const postToDelete = await ctx.db.get(args.postId);
    if (!postToDelete) throw new Error("Post not found");

    // Only the post creator who is also an admin can delete
    if (postToDelete.createdBy !== currentUser._id) {
      throw new Error(
        "Unauthorized: You can only delete your own posts."
      );
    }
    if (!currentUser.isAdmin) {
      throw new Error(
        "Unauthorized: Only admins can delete posts."
      );
    }

    // Delete related likes, comments, and saved posts
    const likesToDelete = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) =>
        q.eq("postId", args.postId)
      )
      .collect();
    for (const like of likesToDelete) {
      await ctx.db.delete(like._id);
    }
    const commentsToDelete = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) =>
        q.eq("postId", args.postId)
      )
      .collect();
    for (const comment of commentsToDelete) {
      await ctx.db.delete(comment._id);
    }
    const savedPostsToDelete = await ctx.db
      .query("savedPosts")
      .withIndex("by_post", (q) =>
        q.eq("postId", args.postId)
      )
      .collect();
    for (const saved of savedPostsToDelete) {
      await ctx.db.delete(saved._id);
    }

    // Delete the post
    await ctx.db.delete(args.postId);
    console.log(
      `Post ${args.postId} deleted by user ${currentUser._id}`
    );
  },
});
