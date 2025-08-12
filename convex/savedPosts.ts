import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

export const getIsSaved = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getAuthenticatedUser(ctx);
      const existingSave = await ctx.db
        .query("savedPosts")
        .withIndex("by_user_and_post", (q) =>
          q
            .eq("userId", currentUser._id)
            .eq("postId", args.postId)
        )
        .first();
      return existingSave !== null;
    } catch {
      return false;
    }
  },
});

export const toggleSavePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) throw new Error("Unauthorized");

    const existingSave = await ctx.db
      .query("savedPosts")
      .withIndex("by_user_and_post", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("postId", args.postId)
      )
      .first();

    if (existingSave) {
      await ctx.db.delete(existingSave._id);
      return { saved: false };
    } else {
      await ctx.db.insert("savedPosts", {
        userId: currentUser._id,
        postId: args.postId,
        createdAt: Date.now(),
      });
      return { saved: true };
    }
  },
});
