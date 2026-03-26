import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const getGroupByFilterOption = query({
  args: { filterOptionId: v.id("FilterOption") },
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_filter_option", (q) =>
        q.eq("filterOptionId", args.filterOptionId),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    return group;
  },
});

export const getMyGroups = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const groups = await Promise.all(
      memberships.map(async (m) => {
        const group = await ctx.db.get(m.groupId);
        if (!group || !group.isActive) return null;

        const filterOption = await ctx.db.get(
          group.filterOptionId,
        );

        return {
          ...group,
          filterOptionName: filterOption?.name ?? "Unknown",
          role: m.role,
        };
      }),
    );

    return groups.filter(Boolean);
  },
});

export const getGroupById = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const filterOption = await ctx.db.get(
      group.filterOptionId,
    );

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .first();

    return {
      ...group,
      filterOptionName: filterOption?.name ?? "Unknown",
      isMember: !!membership,
      currentUserRole: membership?.role ?? null,
    };
  },
});

export const getIsMember = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .first();

    return !!membership;
  },
});

export const getGroupMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) =>
        q.eq("groupId", args.groupId),
      )
      .collect();

    const enriched = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          _id: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          fullname: user?.fullname ?? "Unknown",
          username: user?.username ?? "unknown",
          profileImage: user?.profileImage,
          isAdmin: user?.isAdmin === true,
        };
      }),
    );

    // Admins first, then members sorted by joinedAt
    return enriched.sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (a.role !== "admin" && b.role === "admin") return 1;
      return a.joinedAt - b.joinedAt;
    });
  },
});

export const joinGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .first();

    if (existing) throw new Error("Already a member");

    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    });

    const group = await ctx.db.get(args.groupId);
    if (group) {
      await ctx.db.patch(args.groupId, {
        memberCount: group.memberCount + 1,
      });
    }
  },
});

export const leaveGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id),
      )
      .first();

    if (!membership) throw new Error("Not a member");

    await ctx.db.delete(membership._id);

    const group = await ctx.db.get(args.groupId);
    if (group) {
      await ctx.db.patch(args.groupId, {
        memberCount: Math.max(0, group.memberCount - 1),
      });
    }
  },
});

export const createGroup = mutation({
  args: {
    filterOptionId: v.id("FilterOption"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const groupId = await ctx.db.insert("groups", {
      filterOptionId: args.filterOptionId,
      name: args.name,
      description: args.description,
      memberCount: 1,
      createdBy: user._id,
      isActive: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("groupMembers", {
      groupId,
      userId: user._id,
      role: "admin",
      joinedAt: Date.now(),
    });

    return groupId;
  },
});

// Get all groups for admin panel
export const getGroupsForAdmin = query({
  args: {
    status: v.optional(v.union(v.literal("all"), v.literal("active"), v.literal("disabled"))),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    let groups = await ctx.db.query("groups").collect();

    // Filter by status
    if (args.status === "active") {
      groups = groups.filter((g) => g.isActive);
    } else if (args.status === "disabled") {
      groups = groups.filter((g) => !g.isActive);
    }

    // Enrich with filter option name and message count
    const enrichedGroups = await Promise.all(
      groups.map(async (group) => {
        const filterOption = await ctx.db.get(group.filterOptionId);

        // Get actual message count
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .filter((q) => q.neq(q.field("isDeleted"), true))
          .collect();

        // Get pending reports count for this group
        const reports = await ctx.db
          .query("reports")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .collect();

        return {
          ...group,
          filterOptionName: filterOption?.name ?? "Unknown",
          messageCount: messages.length,
          pendingReportsCount: reports.length,
        };
      })
    );

    // Sort by member count descending
    return enrichedGroups.sort((a, b) => b.memberCount - a.memberCount);
  },
});

// Remove a member from a group (admin only)
export const removeGroupMember = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (!membership) throw new Error("Member not found");

    await ctx.db.delete(membership._id);

    // Decrement member count
    const group = await ctx.db.get(args.groupId);
    if (group) {
      await ctx.db.patch(args.groupId, {
        memberCount: Math.max(0, group.memberCount - 1),
      });
    }
  },
});

// Update a member's role (admin only)
export const updateMemberRole = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("moderator"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (!membership) throw new Error("Member not found");

    await ctx.db.patch(membership._id, { role: args.role });
  },
});

// Disable/enable a group (admin only)
export const toggleGroupStatus = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    await ctx.db.patch(args.groupId, { isActive: !group.isActive });
  },
});

// Delete a group permanently (admin only)
export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Delete all memberships
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // Soft delete all messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    for (const message of messages) {
      await ctx.db.patch(message._id, { isDeleted: true, content: "" });
    }

    // Delete the group
    await ctx.db.delete(args.groupId);
  },
});

// Get admin stats for groups
export const getGroupStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const allGroups = await ctx.db.query("groups").collect();
    const allMembers = await ctx.db.query("groupMembers").collect();
    const allMessages = await ctx.db
      .query("messages")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    return {
      totalGroups: allGroups.length,
      activeGroups: allGroups.filter((g) => g.isActive).length,
      disabledGroups: allGroups.filter((g) => !g.isActive).length,
      totalMembers: allMembers.length,
      totalMessages: allMessages.length,
    };
  },
});
