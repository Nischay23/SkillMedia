// convex/savedContent.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

export const getIsSaved = query({
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
      let existingSave = null;

      if (args.communityPostId) {
        existingSave = await ctx.db
          .query("savedContent")
          .withIndex("by_user_and_community_post", (q) =>
            q
              .eq("userId", currentUser._id)
              .eq("communityPostId", args.communityPostId!)
          )
          .first();
      } else if (args.filterOptionId) {
        existingSave = await ctx.db
          .query("savedContent")
          .withIndex("by_user_and_filter_option", (q) =>
            q
              .eq("userId", currentUser._id)
              .eq("filterOptionId", args.filterOptionId!)
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
        "Must provide either communityPostId or filterOptionId."
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
            .eq("communityPostId", args.communityPostId!)
        )
        .first();
    } else if (args.filterOptionId) {
      existingSave = await ctx.db
        .query("savedContent")
        .withIndex("by_user_and_filter_option", (q) =>
          q
            .eq("userId", currentUser._id)
            .eq("filterOptionId", args.filterOptionId!)
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
