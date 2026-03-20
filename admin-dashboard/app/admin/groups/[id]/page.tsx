"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users2,
  MessageSquare,
  AlertTriangle,
  Send,
  Trash2,
  Shield,
  UserMinus,
  Pin,
  Megaphone,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
} from "lucide-react";

type TabType = "messages" | "members" | "reports";

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as Id<"groups">;

  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [announcementText, setAnnouncementText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<Id<"messages"> | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<Id<"users"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Queries
  const group = useQuery(api.groups.getGroupById, { groupId });
  const messages = useQuery(api.messages.getMessagesForAdmin, { groupId, limit: 100 });
  const members = useQuery(api.groups.getGroupMembers, { groupId });
  const reports = useQuery(api.reports.getReportsForGroup, { groupId, status: "all" });

  // Mutations
  const sendAnnouncement = useMutation(api.messages.sendAdminAnnouncement);
  const deleteMessage = useMutation(api.messages.adminDeleteMessage);
  const removeMember = useMutation(api.groups.removeGroupMember);
  const updateRole = useMutation(api.groups.updateMemberRole);
  const dismissReport = useMutation(api.reports.dismissReport);
  const deleteReportedMessage = useMutation(api.reports.deleteReportedMessage);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFullDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handlers
  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setIsSending(true);
    try {
      await sendAnnouncement({ groupId, content: announcementText });
      setAnnouncementText("");
    } catch (error) {
      console.error("Failed to send announcement:", error);
      alert("Failed to send announcement.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return;
    setIsDeleting(true);
    try {
      await deleteMessage({ messageId: deleteMessageId });
      setDeleteMessageId(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberId) return;
    setIsRemoving(true);
    try {
      await removeMember({ groupId, userId: removeMemberId });
      setRemoveMemberId(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert("Failed to remove member.");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "moderator" | "member") => {
    try {
      await updateRole({ groupId, userId, role: newRole });
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role.");
    }
  };

  const handleDismissReport = async (reportId: Id<"reports">) => {
    try {
      await dismissReport({ reportId });
    } catch (error) {
      console.error("Failed to dismiss report:", error);
      alert("Failed to dismiss report.");
    }
  };

  const handleDeleteReportedMessage = async (reportId: Id<"reports">, messageId: Id<"messages">) => {
    try {
      await deleteReportedMessage({ reportId, messageId });
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message.");
    }
  };

  const isLoading = group === undefined;
  const pendingReportsCount = reports?.filter((r) => r.status === "pending").length ?? 0;

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: "messages", label: "Messages", icon: MessageSquare, count: messages?.length },
    { id: "members", label: "Members", icon: Users2, count: members?.length },
    { id: "reports", label: "Reports", icon: AlertTriangle, count: pendingReportsCount },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Group not found</p>
        <Link href="/admin/groups" className="mt-4 text-primary hover:underline">
          Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-lg font-bold text-white">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="text-sm text-muted-foreground">{group.filterOptionName}</p>
          </div>
        </div>
        <span
          className={`ml-4 badge ${group.isActive ? "badge-success" : "badge-warning"}`}
        >
          {group.isActive ? "Active" : "Disabled"}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{group.memberCount}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{messages?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{pendingReportsCount}</p>
              <p className="text-xs text-muted-foreground">Pending Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Announcement */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Send Announcement</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Type your announcement message..."
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendAnnouncement()}
            className="input-field flex-1"
          />
          <button
            onClick={handleSendAnnouncement}
            disabled={!announcementText.trim() || isSending}
            className="btn-primary flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                    tab.id === "reports" && pendingReportsCount > 0
                      ? "bg-amber-500/20 text-amber-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-2">
            {messages && messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    msg.isDeleted
                      ? "border-border/50 bg-muted/30"
                      : msg.pendingReportsCount > 0
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  {/* Avatar */}
                  {msg.sender?.profileImage ? (
                    <img
                      src={msg.sender.profileImage}
                      alt={msg.sender.fullname}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {msg.sender?.fullname?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">
                        {msg.sender?.fullname || "Unknown"}
                      </span>
                      {msg.sender?.isAdmin && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                          Admin
                        </span>
                      )}
                      {msg.type === "announcement" && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-500">
                          Announcement
                        </span>
                      )}
                      {msg.isPinned && (
                        <Pin className="h-3 w-3 text-primary" />
                      )}
                      {msg.pendingReportsCount > 0 && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-bold text-amber-500">
                          {msg.pendingReportsCount} report{msg.pendingReportsCount > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    {msg.type === "image" && msg.imageUrl ? (
                      <div className="mt-2">
                        <img
                          src={msg.imageUrl}
                          alt="Message image"
                          className="max-h-48 rounded-lg object-cover"
                        />
                        {msg.content && (
                          <p className="mt-1 text-sm text-foreground">{msg.content}</p>
                        )}
                      </div>
                    ) : (
                      <p className={`mt-1 text-sm ${msg.isDeleted ? "text-muted-foreground italic" : "text-foreground"}`}>
                        {msg.content}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {!msg.isDeleted && (
                    <button
                      onClick={() => setDeleteMessageId(msg._id)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-error-muted hover:text-error"
                      title="Delete Message"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 text-muted-foreground">No messages yet</p>
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members && members.length > 0 ? (
                  members.map((member) => (
                    <tr key={member._id} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {member.profileImage ? (
                            <img
                              src={member.profileImage}
                              alt={member.fullname}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                              {member.fullname.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{member.fullname}</p>
                            <p className="text-xs text-muted-foreground">@{member.username}</p>
                          </div>
                          {member.isAdmin && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                              App Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member._id,
                              e.target.value as "admin" | "moderator" | "member"
                            )
                          }
                          className="input-field w-auto text-sm py-1"
                        >
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderator</option>
                          <option value="member">Member</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {formatFullDate(member.joinedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setRemoveMemberId(member._id)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-error-muted hover:text-error"
                          title="Remove Member"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <Users2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-3 text-muted-foreground">No members found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-3">
            {reports && reports.length > 0 ? (
              reports.map((report) => (
                <div
                  key={report._id}
                  className={`rounded-xl border p-4 transition-colors ${
                    report.status === "pending"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : report.status === "reviewed"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        {report.status === "pending" && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-500">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                        {report.status === "reviewed" && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-500">
                            <CheckCircle className="h-3 w-3" />
                            Reviewed
                          </span>
                        )}
                        {report.status === "dismissed" && (
                          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            <XCircle className="h-3 w-3" />
                            Dismissed
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>

                      {/* Reporter Info */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Reported by:</span>
                        <span className="font-medium text-foreground">
                          {report.reporter?.fullname || "Unknown"}
                        </span>
                      </div>

                      {/* Reported User Info */}
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-muted-foreground">Message from:</span>
                        <span className="font-medium text-foreground">
                          {report.reportedUser?.fullname || "Unknown"}
                        </span>
                      </div>

                      {/* Reason */}
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground uppercase mb-1">Reason</p>
                        <p className="text-sm text-foreground bg-muted/50 rounded-lg p-2">
                          {report.reason}
                        </p>
                      </div>

                      {/* Reported Message */}
                      {report.message && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Reported Message</p>
                          <div className="bg-muted/50 rounded-lg p-2 border-l-2 border-amber-500">
                            {report.message.type === "image" ? (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                                Image message
                              </span>
                            ) : report.message.isDeleted ? (
                              <span className="text-sm text-muted-foreground italic">
                                [Message deleted]
                              </span>
                            ) : (
                              <p className="text-sm text-foreground">{report.message.content}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {report.status === "pending" && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() =>
                            handleDeleteReportedMessage(report._id, report.messageId)
                          }
                          className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete Msg
                        </button>
                        <button
                          onClick={() => handleDismissReport(report._id)}
                          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <XCircle className="h-3 w-3" />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 text-muted-foreground">No reports for this group</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Message Confirmation */}
      <ConfirmDialog
        isOpen={deleteMessageId !== null}
        onClose={() => setDeleteMessageId(null)}
        onConfirm={handleDeleteMessage}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={removeMemberId !== null}
        onClose={() => setRemoveMemberId(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        description="Are you sure you want to remove this member from the group? They can rejoin if the group is public."
        confirmText="Remove"
        cancelText="Cancel"
        variant="warning"
        isLoading={isRemoving}
      />
    </div>
  );
}
