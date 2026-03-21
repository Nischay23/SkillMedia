import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// Report a message
export const reportMessage = mutation({
  args: {
    messageId: v.id("messages"),
    groupId: v.id("groups"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Cannot report own message
    if (message.userId === user._id) {
      throw new Error("Cannot report your own message");
    }

    // Check for existing pending report from this user
    const existingReport = await ctx.db
      .query("reports")
      .withIndex("by_reporter_and_message", (q) =>
        q
          .eq("reporterId", user._id)
          .eq("messageId", args.messageId),
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingReport) {
      throw new Error(
        "You have already reported this message",
      );
    }

    const reportId = await ctx.db.insert("reports", {
      reporterId: user._id,
      messageId: args.messageId,
      groupId: args.groupId,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
    });

    return reportId;
  },
});

// Get all reports (admin only)
export const getReports = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("dismissed"),
        v.literal("all"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!user.isAdmin) {
      throw new Error("Unauthorized");
    }

    // Use separate query paths to avoid type reassignment issues
    let reports;
    if (args.status && args.status !== "all") {
      reports = await ctx.db
        .query("reports")
        .withIndex("by_status", (q) =>
          q.eq(
            "status",
            args.status as
              | "pending"
              | "reviewed"
              | "dismissed",
          ),
        )
        .order("desc")
        .collect();
    } else {
      reports = await ctx.db
        .query("reports")
        .order("desc")
        .collect();
    }

    // Enrich reports with user and message data
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const reporter = await ctx.db.get(
          report.reporterId,
        );
        const message = await ctx.db.get(report.messageId);
        const group = await ctx.db.get(report.groupId);

        let reportedUser = null;
        if (message) {
          reportedUser = await ctx.db.get(message.userId);
        }

        return {
          ...report,
          reporter: reporter
            ? {
                _id: reporter._id,
                fullname: reporter.fullname,
                username: reporter.username,
                profileImage: reporter.profileImage,
              }
            : null,
          message: message
            ? {
                _id: message._id,
                content: message.content,
                type: message.type,
                isDeleted: message.isDeleted,
              }
            : null,
          reportedUser: reportedUser
            ? {
                _id: reportedUser._id,
                fullname: reportedUser.fullname,
                username: reportedUser.username,
              }
            : null,
          groupName: group?.name ?? "Unknown Group",
        };
      }),
    );

    return enrichedReports;
  },
});

// Get report counts (admin only)
export const getReportCounts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    if (!user.isAdmin) {
      throw new Error("Unauthorized");
    }

    const allReports = await ctx.db
      .query("reports")
      .collect();

    const counts = {
      pending: 0,
      reviewed: 0,
      dismissed: 0,
      total: allReports.length,
    };

    for (const report of allReports) {
      counts[report.status]++;
    }

    return counts;
  },
});

// Dismiss a report (admin only)
export const dismissReport = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!user.isAdmin) {
      throw new Error("Unauthorized");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    await ctx.db.patch(args.reportId, {
      status: "dismissed",
    });
  },
});

// Get reports for a specific group (admin only)
export const getReportsForGroup = query({
  args: {
    groupId: v.id("groups"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("dismissed"),
        v.literal("all"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user.isAdmin) throw new Error("Unauthorized");

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();

    // Filter by status if specified
    let filteredReports = reports;
    if (args.status && args.status !== "all") {
      filteredReports = reports.filter((r) => r.status === args.status);
    }

    // Enrich reports
    const enrichedReports = await Promise.all(
      filteredReports.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        const message = await ctx.db.get(report.messageId);
        let reportedUser = null;
        if (message) {
          reportedUser = await ctx.db.get(message.userId);
        }

        return {
          ...report,
          reporter: reporter
            ? {
                _id: reporter._id,
                fullname: reporter.fullname,
                username: reporter.username,
                profileImage: reporter.profileImage,
              }
            : null,
          message: message
            ? {
                _id: message._id,
                content: message.content,
                type: message.type,
                isDeleted: message.isDeleted,
              }
            : null,
          reportedUser: reportedUser
            ? {
                _id: reportedUser._id,
                fullname: reportedUser.fullname,
                username: reportedUser.username,
              }
            : null,
        };
      })
    );

    return enrichedReports;
  },
});

// Delete reported message and mark report as reviewed (admin only)
export const deleteReportedMessage = mutation({
  args: {
    reportId: v.id("reports"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (!user.isAdmin) {
      throw new Error("Unauthorized");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Soft delete the message
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      content: "",
    });

    // Mark report as reviewed
    await ctx.db.patch(args.reportId, {
      status: "reviewed",
    });

    // Mark any other pending reports for this message as reviewed
    const otherReports = await ctx.db
      .query("reports")
      .withIndex("by_message", (q) =>
        q.eq("messageId", args.messageId),
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const otherReport of otherReports) {
      await ctx.db.patch(otherReport._id, {
        status: "reviewed",
      });
    }
  },
});
