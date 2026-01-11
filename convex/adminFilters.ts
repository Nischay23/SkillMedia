// convex/adminFilters.ts

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  mutation,
  MutationCtx,
  query,
} from "./_generated/server";
import { getAdmin } from "./adminAuth";

/**
 * Query: Get all filters (including inactive) for admin view
 * Security: Admin only
 */
export const getAllFilters = query({
  args: {},
  handler: async (ctx) => {
    // Security check
    await getAdmin(ctx);

    // Fetch ALL filters (including inactive for admin view)
    const filters = await ctx.db
      .query("FilterOption")
      .collect();

    return filters.map((f) => ({
      _id: f._id,
      name: f.name,
      type: f.type,
      parentId: f.parentId,
      description: f.description,
      requirements: f.requirements,
      avgSalary: f.avgSalary,
      relevantExams: f.relevantExams,
      image: f.image,
      isActive: f.isActive ?? true,
      likes: f.likes ?? 0,
      comments: f.comments ?? 0,
    }));
  },
});

/**
 * Mutation: Create a new filter node
 * Security: Admin only
 * Validation: Hierarchy rules enforced
 */
export const createFilterNode = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("qualification"),
      v.literal("category"),
      v.literal("sector"),
      v.literal("subSector"),
      v.literal("branch"),
      v.literal("role")
    ),
    parentId: v.optional(v.id("FilterOption")),
    description: v.optional(v.string()),
    requirements: v.optional(v.string()),
    avgSalary: v.optional(v.string()),
    relevantExams: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Security check
    await getAdmin(ctx);

    // 2. Validation: name cannot be empty
    if (!args.name.trim()) {
      throw new Error("Name cannot be empty");
    }

    // 3. Validation: parent must exist (if provided)
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) {
        throw new Error("Parent filter not found");
      }

      // 4. Validation: child type must be valid for parent
      const validChildTypes = getValidChildTypes(
        parent.type
      );
      if (!validChildTypes.includes(args.type)) {
        throw new Error(
          `Invalid child type '${args.type}' for parent type '${parent.type}'. ` +
            `Valid types: ${validChildTypes.join(", ")}`
        );
      }
    } else {
      // 5. Validation: only 'qualification' can be root
      if (args.type !== "qualification") {
        throw new Error(
          "Only 'qualification' nodes can be root-level"
        );
      }
    }

    // 6. Check for duplicates (same name + parent)
    const duplicate = await ctx.db
      .query("FilterOption")
      .withIndex("by_parentId", (q) =>
        q.eq("parentId", args.parentId)
      )
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (duplicate) {
      throw new Error(
        `A filter named '${args.name}' already exists at this level`
      );
    }

    // 7. Create node
    const newId = await ctx.db.insert("FilterOption", {
      name: args.name.trim(),
      type: args.type,
      parentId: args.parentId,
      description: args.description?.trim(),
      requirements: args.requirements?.trim(),
      avgSalary: args.avgSalary?.trim(),
      relevantExams: args.relevantExams?.trim(),
      image: args.image?.trim(),
      likes: 0,
      comments: 0,
      isActive: true,
    });

    return { _id: newId };
  },
});

/**
 * Mutation: Update an existing filter node
 * Security: Admin only
 */
export const updateFilterNode = mutation({
  args: {
    filterId: v.id("FilterOption"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    requirements: v.optional(v.string()),
    avgSalary: v.optional(v.string()),
    relevantExams: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Security check
    await getAdmin(ctx);

    // 2. Verify node exists
    const node = await ctx.db.get(args.filterId);
    if (!node) {
      throw new Error("Filter node not found");
    }

    // 3. Validation: name cannot be empty
    if (args.name !== undefined && !args.name.trim()) {
      throw new Error("Name cannot be empty");
    }

    // 4. Build update object (only changed fields)
    const updates: any = {};
    if (args.name !== undefined)
      updates.name = args.name.trim();
    if (args.description !== undefined)
      updates.description = args.description.trim();
    if (args.requirements !== undefined)
      updates.requirements = args.requirements.trim();
    if (args.avgSalary !== undefined)
      updates.avgSalary = args.avgSalary.trim();
    if (args.relevantExams !== undefined)
      updates.relevantExams = args.relevantExams.trim();
    if (args.image !== undefined)
      updates.image = args.image.trim();

    // 5. Check for duplicate name (if name changed)
    if (args.name && args.name !== node.name) {
      const duplicate = await ctx.db
        .query("FilterOption")
        .withIndex("by_parentId", (q) =>
          q.eq("parentId", node.parentId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("name"), args.name),
            q.neq(q.field("_id"), args.filterId)
          )
        )
        .first();

      if (duplicate) {
        throw new Error(
          `A filter named '${args.name}' already exists at this level`
        );
      }
    }

    // 6. Update node
    await ctx.db.patch(args.filterId, updates);

    return { success: true };
  },
});

/**
 * Mutation: Toggle filter active status (soft delete)
 * Security: Admin only
 * Cascades to children when deactivating
 */
export const toggleFilterActive = mutation({
  args: {
    filterId: v.id("FilterOption"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // 1. Security check
    await getAdmin(ctx);

    // 2. Verify node exists
    const node = await ctx.db.get(args.filterId);
    if (!node) {
      throw new Error("Filter node not found");
    }

    // 3. Toggle active status
    await ctx.db.patch(args.filterId, {
      isActive: args.isActive,
    });

    // 4. Cascade to children (if deactivating)
    if (!args.isActive) {
      await deactivateDescendants(ctx, args.filterId);
    }

    return { success: true };
  },
});

/**
 * Recursive helper to deactivate all descendants
 */
async function deactivateDescendants(
  ctx: MutationCtx,
  parentId: Id<"FilterOption">
) {
  const children = await ctx.db
    .query("FilterOption")
    .withIndex("by_parentId", (q) =>
      q.eq("parentId", parentId)
    )
    .collect();

  for (const child of children) {
    await ctx.db.patch(child._id, { isActive: false });
    // Recursively deactivate child's descendants
    await deactivateDescendants(ctx, child._id);
  }
}

/**
 * Hierarchy Rules Enforcer
 * Returns valid child types for a given parent type
 */
function getValidChildTypes(
  parentType:
    | "qualification"
    | "category"
    | "sector"
    | "subSector"
    | "branch"
    | "role"
): (
  | "qualification"
  | "category"
  | "sector"
  | "subSector"
  | "branch"
  | "role"
)[] {
  const hierarchy: Record<string, string[]> = {
    qualification: ["category"],
    category: ["sector"],
    sector: ["subSector"],
    subSector: ["branch"],
    branch: ["role"],
    role: [], // Leaf node - no children allowed
  };

  return hierarchy[parentType] as (
    | "qualification"
    | "category"
    | "sector"
    | "subSector"
    | "branch"
    | "role"
  )[];
}
