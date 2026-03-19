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

        return {
          ...group,
          filterOptionName: filterOption?.name ?? "Unknown",
          role: m.role,
          unreadCount: unreadMessages.length,
          lastMessage: lastMessagePreview,
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
