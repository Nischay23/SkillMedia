// convex/savedContent.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const getIsSaved = query({
  args: {
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    if (!args.communityPostId && !args.filterOptionId) {
      throw new Error(
        "Must provide either communityPostId or filterOptionId.",
      );
    }
    try {
      const currentUser = await getAuthenticatedUser(ctx);
      let existingSave = null;

      if (args.communityPostId) {
        existingSave = await ctx.db
          .query("savedContent")
          .withIndex("by_user_and_community_post", (q) =>
            q
              .eq("userId", currentUser._id)
              .eq("communityPostId", args.communityPostId!),
          )
          .first();
      } else if (args.filterOptionId) {
        existingSave = await ctx.db
          .query("savedContent")
          .withIndex("by_user_and_filter_option", (q) =>
            q
              .eq("userId", currentUser._id)
              .eq("filterOptionId", args.filterOptionId!),
          )
          .first();
      }
      return existingSave !== null;
    } catch {
      return false;
    }
  },
});

export const toggleSave = mutation({
  args: {
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    if (!args.communityPostId && !args.filterOptionId) {
      throw new Error(
        "Must provide either communityPostId or filterOptionId.",
      );
    }
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    let existingSave = null;

    if (args.communityPostId) {
      existingSave = await ctx.db
        .query("savedContent")
        .withIndex("by_user_and_community_post", (q) =>
          q
            .eq("userId", currentUser._id)
            .eq("communityPostId", args.communityPostId!),
        )
        .first();
    } else if (args.filterOptionId) {
      existingSave = await ctx.db
        .query("savedContent")
        .withIndex("by_user_and_filter_option", (q) =>
          q
            .eq("userId", currentUser._id)
            .eq("filterOptionId", args.filterOptionId!),
        )
        .first();
    }

    if (existingSave) {
      await ctx.db.delete(existingSave._id);
      return { saved: false };
    } else {
      await ctx.db.insert("savedContent", {
        userId: currentUser._id,
        communityPostId: args.communityPostId,
        filterOptionId: args.filterOptionId,
        createdAt: Date.now(),
      });
      return { saved: true };
    }
  },
});

export const getBookmarkedContent = query({
  handler: async (ctx) => {
    try {
      const currentUser = await getAuthenticatedUser(ctx);

      const savedRecords = await ctx.db
        .query("savedContent")
        .withIndex("by_user", (q) =>
          q.eq("userId", currentUser._id),
        )
        .order("desc") // newest first
        .collect();

      const results = await Promise.all(
        savedRecords.map(async (record) => {
          if (record.communityPostId) {
            const post = await ctx.db.get(
              record.communityPostId,
            );
            if (post) {
              return {
                ...post,
                itemType: "communityPost" as const,
                savedAt: record.createdAt,
              };
            }
          } else if (record.filterOptionId) {
            const filterOption = await ctx.db.get(
              record.filterOptionId,
            );
            if (filterOption) {
              return {
                ...filterOption,
                itemType: "filterOption" as const,
                savedAt: record.createdAt,
              };
            }
          }
          return null;
        }),
      );

      return results.filter(Boolean) as any[]; // Need to cast as any for returning heterogeneous array
    } catch {
      return [];
    }
  },
});
