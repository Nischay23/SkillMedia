import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAdmin } from "./adminAuth";

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

    const sorted = options.sort((a, b) => {
      // Sort by ranking ascending (nulls last), then alphabetically
      const rankA = a.ranking ?? Infinity;
      const rankB = b.ranking ?? Infinity;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });

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
        ranking: option.ranking ?? null,
        annualVacancies: option.annualVacancies ?? null,
      };
    }
    return null;
  },
});

// Get top career paths by engagement (admin only)
export const getFilterOptionsWithStats = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAdmin(ctx);

    const limit = args.limit ?? 20;

    // Get all filter options
    const allOptions = await ctx.db
      .query("FilterOption")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Find deepest-level options (those with no children)
    const optionsWithChildCounts = await Promise.all(
      allOptions.map(async (option) => {
        const children = await ctx.db
          .query("FilterOption")
          .withIndex("by_parentId", (q) => q.eq("parentId", option._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .take(1);
        return {
          ...option,
          hasChildren: children.length > 0,
        };
      })
    );

    // Filter to deepest (leaf) nodes only
    const leafOptions = optionsWithChildCounts.filter((opt) => !opt.hasChildren);

    // Enrich with parent path for context
    const enrichedOptions = await Promise.all(
      leafOptions.map(async (option) => {
        // Build parent path for breadcrumb
        let parentPath: string[] = [];
        let currentParentId = option.parentId;

        while (currentParentId) {
          const parent = await ctx.db.get(currentParentId);
          if (parent) {
            parentPath.unshift(parent.name);
            currentParentId = parent.parentId;
          } else {
            break;
          }
        }

        const likes = option.likes ?? 0;
        const comments = option.comments ?? 0;
        const engagement = likes + comments;

        return {
          _id: option._id,
          name: option.name,
          type: option.type,
          parentPath: parentPath.join(" > "),
          qualification: parentPath[0] ?? "Unknown",
          likes,
          comments,
          engagement,
          ranking: option.ranking,
          annualVacancies: option.annualVacancies,
        };
      })
    );

    // Sort by engagement (highest first)
    const sorted = enrichedOptions.sort((a, b) => b.engagement - a.engagement);

    return sorted.slice(0, limit);
  },
});
