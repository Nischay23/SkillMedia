import { query } from "./_generated/server";
import { v } from "convex/values";

// Get children filter options for a given parent (or root when parentId is undefined)
export const getFilterChildren = query({
  args: {
    parentId: v.optional(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    const options = await ctx.db
      .query("FilterOption")
      .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return options.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Get all active filter options (useful for admin tools or seeding pipelines)
export const getAllFilterOptions = query({
  handler: async (ctx) => {
    const options = await ctx.db
      .query("FilterOption")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return options;
  },
});
