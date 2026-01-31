import { query } from "./_generated/server";
import { v } from "convex/values";

// Get children filter options for a given parent (or root when parentId is undefined)
export const getFilterChildren = query({
  args: {
    parentId: v.optional(v.id("FilterOption")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const options = await ctx.db
      .query("FilterOption")
      .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const sorted = options.sort((a, b) => a.name.localeCompare(b.name));

    if (args.limit && args.limit > 0) {
      return sorted.slice(0, args.limit);
    }
    return sorted;
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

/**
 * Fetches FilterOption documents for a given array of IDs.
 * Useful for displaying breadcrumbs (names) based on a selected path of IDs.
 */
export const getFilterNamesByIds = query({
  args: {
    filterIds: v.array(v.id("FilterOption")), // An array of FilterOption IDs
  },
  handler: async (ctx, args) => {
    if (args.filterIds.length === 0) {
      return [];
    }
    const options = await Promise.all(
      args.filterIds.map((id) => ctx.db.get(id))
    );
    // Filter out any nulls if an ID doesn't exist
    return options.filter(Boolean); // Filters out null/undefined results
  },
});

/**
 * Fetches a single FilterOption document by its ID, including all its content fields.
 * This is used by FeedScreen to display the details of the selected path.
 */
export const getFilterOptionById = query({
  args: {
    filterOptionId: v.id("FilterOption"),
  },
  handler: async (ctx, args) => {
    const option = await ctx.db.get(args.filterOptionId);
    if (option) {
      return {
        ...option,
        likes: option.likes || 0,
        comments: option.comments || 0,
      };
    }
    return null;
  },
});
