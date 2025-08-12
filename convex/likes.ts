import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./users";

export const getIsLiked = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    try {
      const currentUser = await getAuthenticatedUser(ctx);
      const existingLike = await ctx.db
        .query("likes")
        .withIndex("by_user_and_post", (q) =>
          q
            .eq("userId", currentUser._id)
            .eq("postId", args.postId)
        )
        .first();
      return existingLike !== null;
    } catch {
      return false;
    }
  },
});
