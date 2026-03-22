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

// Mark group as read - updates lastReadAt timestamp
export const markGroupAsRead = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q
          .eq("groupId", args.groupId)
          .eq("userId", user._id),
      )
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, {
        lastReadAt: Date.now(),
      });
    }
  },
});

// Get unread count for a specific group
export const getUnreadCount = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q
          .eq("groupId", args.groupId)
          .eq("userId", user._id),
      )
      .first();

    if (!membership) return 0;

    const lastReadAt = membership.lastReadAt ?? 0;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_group_and_created", (q) =>
        q.eq("groupId", args.groupId),
      )
      .filter((q) =>
        q.and(
          q.gt(q.field("createdAt"), lastReadAt),
          q.neq(q.field("userId"), user._id),
          q.neq(q.field("isDeleted"), true),
        ),
      )
      .collect();

    return messages.length;
  },
});

// Get total unread count across all groups
export const getTotalUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let total = 0;

    for (const membership of memberships) {
      const group = await ctx.db.get(membership.groupId);
      if (!group || !group.isActive) continue;

      const lastReadAt = membership.lastReadAt ?? 0;

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_group_and_created", (q) =>
          q.eq("groupId", membership.groupId),
        )
        .filter((q) =>
          q.and(
            q.gt(q.field("createdAt"), lastReadAt),
            q.neq(q.field("userId"), user._id),
            q.neq(q.field("isDeleted"), true),
          ),
        )
        .collect();

      total += messages.length;
    }

    return total;
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

        // Calculate unread count
        const lastReadAt = m.lastReadAt ?? 0;
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_group_and_created", (q) =>
            q.eq("groupId", m.groupId),
          )
          .filter((q) =>
            q.and(
              q.gt(q.field("createdAt"), lastReadAt),
              q.neq(q.field("userId"), user._id),
              q.neq(q.field("isDeleted"), true),
            ),
          )
          .collect();

        // Get last message for preview
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_group_and_created", (q) =>
            q.eq("groupId", m.groupId),
          )
          .filter((q) => q.neq(q.field("isDeleted"), true))
          .order("desc")
          .first();

        let lastMessagePreview = null;
        if (lastMessage) {
          const sender = await ctx.db.get(
            lastMessage.userId,
          );
          lastMessagePreview = {
            content:
              lastMessage.type === "image"
                ? "📷 Photo"
                : lastMessage.content,
            senderName: sender?.fullname ?? "Unknown",
            createdAt: lastMessage.createdAt,
          };
        }

        // Get roadmap progress for this group
        let roadmapProgress = null;
        const roadmap = await ctx.db
          .query("roadmaps")
          .withIndex("by_group", (q) =>
            q.eq("groupId", m.groupId),
          )
          .filter((q) => q.eq(q.field("isPublished"), true))
          .first();

        if (roadmap && roadmap.totalSteps > 0) {
          const userProgress = await ctx.db
            .query("userRoadmapProgress")
            .withIndex("by_user_and_roadmap", (q) =>
              q
                .eq("userId", user._id)
                .eq("roadmapId", roadmap._id),
            )
            .collect();

          const completedSteps = userProgress.length;
          const totalSteps = roadmap.totalSteps;
          const percent =
            totalSteps > 0
              ? Math.round((completedSteps / totalSteps) * 100)
              : 0;

          roadmapProgress = {
            completedSteps,
            totalSteps,
            percent,
            hasRoadmap: true,
          };
        } else if (roadmap) {
          roadmapProgress = {
            completedSteps: 0,
            totalSteps: 0,
            percent: 0,
            hasRoadmap: true,
          };
        }

        return {
          ...group,
          filterOptionName: filterOption?.name ?? "Unknown",
          role: m.role,
          unreadCount: unreadMessages.length,
          lastMessage: lastMessagePreview,
          roadmapProgress,
        };
      }),
    );

    // Sort by last message time (most recent first)
    return groups.filter(Boolean).sort((a, b) => {
      const aTime = a?.lastMessage?.createdAt ?? 0;
      const bTime = b?.lastMessage?.createdAt ?? 0;
      return bTime - aTime;
    });
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
        q
          .eq("groupId", args.groupId)
          .eq("userId", user._id),
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
        q
          .eq("groupId", args.groupId)
          .eq("userId", user._id),
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
      if (a.role === "admin" && b.role !== "admin")
        return -1;
      if (a.role !== "admin" && b.role === "admin")
        return 1;
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
        q
          .eq("groupId", args.groupId)
          .eq("userId", user._id),
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
        q
          .eq("groupId", args.groupId)
          .eq("userId", user._id),
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
      messageCount: 0,
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

// Auto-create group for a filter option (admin only)
export const autoCreateGroupForFilterOption = mutation({
  args: { filterOptionId: v.id("FilterOption") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    // Check if group already exists
    const existingGroup = await ctx.db
      .query("groups")
      .withIndex("by_filter_option", (q) =>
        q.eq("filterOptionId", args.filterOptionId)
      )
      .first();

    if (existingGroup) {
      return existingGroup._id;
    }

    // Get filter option details
    const filterOption = await ctx.db.get(args.filterOptionId);
    if (!filterOption) throw new Error("Filter option not found");

    // Create the group
    const groupId = await ctx.db.insert("groups", {
      filterOptionId: args.filterOptionId,
      name: filterOption.name,
      description: filterOption.description,
      memberCount: 1,
      messageCount: 0,
      createdBy: user._id,
      isActive: true,
      createdAt: Date.now(),
    });

    // Add creator as admin
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
