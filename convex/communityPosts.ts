// convex/communityPosts.ts
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// Helper: Recursively get all descendant filter IDs
async function getAllDescendantFilterIds(
  ctx: QueryCtx,
  parentId: Id<"FilterOption">
): Promise<Id<"FilterOption">[]> {
  const children = await ctx.db
    .query("FilterOption")
    .withIndex("by_parentId", (q) =>
      q.eq("parentId", parentId)
    )
    .filter((q) => q.eq(q.field("isActive"), true))
    .collect();

  if (children.length === 0) return [];

  const childIds = children.map((c) => c._id);

  // Recursive call for each child
  const nestedDescendants = await Promise.all(
    children.map((child) =>
      getAllDescendantFilterIds(ctx, child._id)
    )
  );

  return [...childIds, ...nestedDescendants.flat()];
}

// CRITICAL: Hierarchical filtering query
export const getCommunityPostsByFilterHierarchy = query({
  args: {
    filterOptionId: v.id("FilterOption"),
    statusFilter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("published"),
        v.literal("draft")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // 1. Recursively get all descendant filter IDs
    const descendantIds = await getAllDescendantFilterIds(
      ctx,
      args.filterOptionId
    );

    // 2. Include parent + all descendants
    const allRelevantFilterIds = [
      args.filterOptionId,
      ...descendantIds,
    ];

    // 3. Query all active posts
    const allPosts = await ctx.db
      .query("communityPosts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // 4. Filter posts where linkedFilterOptionIds intersects with relevant IDs
    let filteredPosts = allPosts.filter((post) =>
      post.linkedFilterOptionIds.some((id) =>
        allRelevantFilterIds.includes(id)
      )
    );

    // 5. Apply status filter
    const statusFilter = args.statusFilter || "published";
    if (!currentUser?.isAdmin) {
      // Regular users only see published posts
      filteredPosts = filteredPosts.filter(
        (p) => p.status === "published"
      );
    } else if (statusFilter !== "all") {
      // Admins can filter by status
      filteredPosts = filteredPosts.filter(
        (p) => p.status === statusFilter
      );
    }

    // 6. Sort by creation time (newest first)
    filteredPosts.sort((a, b) => b.createdAt - a.createdAt);

    // 7. Limit results
    const limit = args.limit || 20;
    filteredPosts = filteredPosts.slice(0, limit);

    // 8. Enrich with user data
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

export const getCommunityPosts = query({
  args: {
    statusFilter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("published"),
        v.literal("draft")
      )
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    let posts = await ctx.db
      .query("communityPosts")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    // Regular users only see published posts
    if (!currentUser?.isAdmin) {
      posts = posts.filter((p) => p.status === "published");
    } else if (
      args.statusFilter &&
      args.statusFilter !== "all"
    ) {
      // Admins can filter by status
      posts = posts.filter(
        (p) => p.status === args.statusFilter
      );
    }

    posts = posts.slice(0, 20);

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
    const filteredPosts = allPosts
      .filter((post) =>
        post.linkedFilterOptionIds.includes(
          args.filterOptionId
        )
      )
      .slice(0, 20); // Take only first 20

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
    title: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    linkedFilterOptionIds: v.optional(
      v.array(v.id("FilterOption"))
    ),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"))
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const status = args.status || "draft";

    const postId = await ctx.db.insert("communityPosts", {
      userId: currentUser._id,
      title: args.title,
      content: args.content,
      imageUrl: args.imageUrl,
      linkedFilterOptionIds:
        args.linkedFilterOptionIds || [],
      status: status,
      publishedAt:
        status === "published" ? Date.now() : undefined,
      likes: 0,
      comments: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
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
    const currentUser = await getAuthenticatedUser(ctx);
    const posts = await ctx.db
      .query("communityPosts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    // Filter by status if not admin or not own posts
    const isOwnPosts = currentUser?._id === args.userId;
    const filteredPosts =
      !currentUser?.isAdmin && !isOwnPosts
        ? posts.filter((p) => p.status === "published")
        : posts;

    const user = await ctx.db.get(args.userId);

    // Enrich with user data
    const postsWithUsers = filteredPosts.map((post) => ({
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

// NEW: Update existing post
export const updateCommunityPost = mutation({
  args: {
    postId: v.id("communityPosts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    linkedFilterOptionIds: v.optional(
      v.array(v.id("FilterOption"))
    ),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"))
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin)
      throw new Error("Admin only");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const updates: any = { updatedAt: Date.now() };

    if (args.title !== undefined)
      updates.title = args.title;
    if (args.content !== undefined)
      updates.content = args.content;
    if (args.imageUrl !== undefined)
      updates.imageUrl = args.imageUrl;
    if (args.linkedFilterOptionIds !== undefined) {
      updates.linkedFilterOptionIds =
        args.linkedFilterOptionIds;
    }

    // Handle status change
    if (args.status !== undefined) {
      updates.status = args.status;
      if (
        args.status === "published" &&
        !post.publishedAt
      ) {
        updates.publishedAt = Date.now();
      }
    }

    await ctx.db.patch(args.postId, updates);
    return { success: true };
  },
});

// NEW: Search posts (admin only)
export const searchCommunityPosts = query({
  args: {
    searchQuery: v.string(),
    statusFilter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("published"),
        v.literal("draft")
      )
    ),
    filterOptionId: v.optional(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin)
      throw new Error("Admin only");

    let posts = await ctx.db
      .query("communityPosts")
      .collect();

    // Text search (case-insensitive)
    const query = args.searchQuery.toLowerCase();
    if (query) {
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (args.statusFilter && args.statusFilter !== "all") {
      posts = posts.filter(
        (post) => post.status === args.statusFilter
      );
    }

    // Filter by career path
    if (args.filterOptionId) {
      posts = posts.filter((post) =>
        post.linkedFilterOptionIds.includes(
          args.filterOptionId!
        )
      );
    }

    // Sort by creation time (newest first)
    posts.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with user data
    const postsWithUsers = await Promise.all(
      posts.slice(0, 50).map(async (post) => {
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

// NEW: Get post statistics (admin only)
export const getPostStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin)
      throw new Error("Admin only");

    const allPosts = await ctx.db
      .query("communityPosts")
      .collect();

    return {
      total: allPosts.length,
      published: allPosts.filter(
        (p) => p.status === "published"
      ).length,
      drafts: allPosts.filter((p) => p.status === "draft")
        .length,
      totalLikes: allPosts.reduce(
        (sum, p) => sum + p.likes,
        0
      ),
      totalComments: allPosts.reduce(
        (sum, p) => sum + p.comments,
        0
      ),
    };
  },
});

// NEW: Bulk delete posts (admin only)
export const bulkDeletePosts = mutation({
  args: { postIds: v.array(v.id("communityPosts")) },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin)
      throw new Error("Admin only");

    for (const postId of args.postIds) {
      const post = await ctx.db.get(postId);
      if (!post) continue;

      // Delete associated comments
      const comments = await ctx.db
        .query("comments")
        .filter((q) =>
          q.eq(q.field("communityPostId"), postId)
        )
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }

      // Delete associated likes
      const likes = await ctx.db
        .query("likes")
        .filter((q) =>
          q.eq(q.field("communityPostId"), postId)
        )
        .collect();
      for (const like of likes) {
        await ctx.db.delete(like._id);
      }

      // Delete saved content
      const savedContent = await ctx.db
        .query("savedContent")
        .filter((q) =>
          q.eq(q.field("communityPostId"), postId)
        )
        .collect();
      for (const saved of savedContent) {
        await ctx.db.delete(saved._id);
      }

      // Delete the post
      await ctx.db.delete(postId);
    }

    return { deleted: args.postIds.length };
  },
});

// NEW: Bulk update status (admin only)
export const bulkUpdateStatus = mutation({
  args: {
    postIds: v.array(v.id("communityPosts")),
    status: v.union(
      v.literal("draft"),
      v.literal("published")
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin)
      throw new Error("Admin only");

    for (const postId of args.postIds) {
      const post = await ctx.db.get(postId);
      if (!post) continue;

      await ctx.db.patch(postId, {
        status: args.status,
        publishedAt:
          args.status === "published" && !post.publishedAt
            ? Date.now()
            : post.publishedAt,
        updatedAt: Date.now(),
      });
    }

    return { updated: args.postIds.length };
  },
});

// NEW: Bulk update filters (admin only)
export const bulkUpdateFilters = mutation({
  args: {
    postIds: v.array(v.id("communityPosts")),
    filterIdsToAdd: v.optional(
      v.array(v.id("FilterOption"))
    ),
    filterIdsToRemove: v.optional(
      v.array(v.id("FilterOption"))
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.isAdmin)
      throw new Error("Admin only");

    for (const postId of args.postIds) {
      const post = await ctx.db.get(postId);
      if (!post) continue;

      let newFilterIds = [...post.linkedFilterOptionIds];

      if (args.filterIdsToAdd) {
        newFilterIds = [
          ...newFilterIds,
          ...args.filterIdsToAdd.filter(
            (id) => !newFilterIds.includes(id)
          ),
        ];
      }

      if (args.filterIdsToRemove) {
        newFilterIds = newFilterIds.filter(
          (id) => !args.filterIdsToRemove!.includes(id)
        );
      }

      await ctx.db.patch(postId, {
        linkedFilterOptionIds: newFilterIds,
        updatedAt: Date.now(),
      });
    }

    return { updated: args.postIds.length };
  },
});
