"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Bell,
  Send,
  Clock,
  FileText,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  Users,
  Target,
  Calendar,
  X,
  RefreshCw,
} from "lucide-react";

type TargetAudience = "all" | "group" | "qualification";

// Type for notification from the query
interface BroadcastNotification {
  _id: Id<"broadcastNotifications">;
  _creationTime: number;
  title: string;
  body: string;
  data?: string;
  targetAudience: string;
  targetId?: string;
  scheduledAt?: number;
  sentAt?: number;
  status: string;
  recipientCount?: number;
  createdBy: Id<"users">;
  createdAt: number;
  creator: { name: string; image: string | undefined } | null;
}

interface NotificationForm {
  title: string;
  body: string;
  targetAudience: TargetAudience;
  targetId: string;
  scheduledAt: string;
}

const initialForm: NotificationForm = {
  title: "",
  body: "",
  targetAudience: "all",
  targetId: "",
  scheduledAt: "",
};

export default function NotificationsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<Id<"broadcastNotifications"> | null>(
    null
  );
  const [form, setForm] = useState<NotificationForm>(initialForm);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSending, setIsSending] = useState<string | null>(null);

  // Queries
  const notifications = useQuery(api.pushNotifications.getBroadcastNotifications, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const stats = useQuery(api.pushNotifications.getNotificationStats);
  const targetGroups = useQuery(api.pushNotifications.getTargetGroups);
  const targetQualifications = useQuery(
    api.pushNotifications.getTargetQualifications
  );

  // Mutations
  const createNotification = useMutation(
    api.pushNotifications.createBroadcastNotification
  );
  const updateNotification = useMutation(
    api.pushNotifications.updateBroadcastNotification
  );
  const deleteNotification = useMutation(
    api.pushNotifications.deleteBroadcastNotification
  );
  const sendNotification = useMutation(
    api.pushNotifications.sendBroadcastNotification
  );

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.body) {
      alert("Please fill in title and body");
      return;
    }

    try {
      const scheduledAt = form.scheduledAt
        ? new Date(form.scheduledAt).getTime()
        : undefined;

      if (editingId) {
        await updateNotification({
          id: editingId,
          title: form.title,
          body: form.body,
          targetAudience: form.targetAudience,
          targetId: form.targetId || undefined,
          scheduledAt,
        });
      } else {
        await createNotification({
          title: form.title,
          body: form.body,
          targetAudience: form.targetAudience,
          targetId: form.targetId || undefined,
          scheduledAt,
        });
      }

      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save notification:", error);
      alert("Failed to save notification");
    }
  };

  const handleEdit = (notification: BroadcastNotification) => {
    setForm({
      title: notification.title,
      body: notification.body,
      targetAudience: notification.targetAudience as TargetAudience,
      targetId: notification.targetId || "",
      scheduledAt: notification.scheduledAt
        ? new Date(notification.scheduledAt).toISOString().slice(0, 16)
        : "",
    });
    setEditingId(notification._id);
    setShowModal(true);
  };

  const handleDelete = async (id: Id<"broadcastNotifications">) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      await deleteNotification({ id });
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete notification");
    }
  };

  const handleSend = async (id: Id<"broadcastNotifications">) => {
    if (!confirm("Send this notification now? This cannot be undone.")) return;

    setIsSending(id);
    try {
      const result = await sendNotification({ id });
      alert(`Notification sent to ${result.recipientCount} users!`);
    } catch (error) {
      console.error("Failed to send:", error);
      alert("Failed to send notification");
    }
    setIsSending(null);
  };

  const isLoading = notifications === undefined || stats === undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Push Notifications
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage broadcast notifications
          </p>
        </div>
        <button
          onClick={() => {
            setForm(initialForm);
            setEditingId(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Notification
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button
          onClick={() => setStatusFilter("draft")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            statusFilter === "draft"
              ? "border-muted-foreground bg-muted/50"
              : "border-border bg-card hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats?.draft ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Draft</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("scheduled")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            statusFilter === "scheduled"
              ? "border-amber-500 bg-amber-500/10"
              : "border-border bg-card hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats?.scheduled ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("sent")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            statusFilter === "sent"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-border bg-card hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats?.sent ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("all")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            statusFilter === "all"
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats?.usersWithTokens ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Subscribers</p>
            </div>
          </div>
        </button>
      </div>

      {/* Notifications List */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">
            {statusFilter === "all"
              ? "All Notifications"
              : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Notifications`}
          </h3>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-64 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))
          ) : notifications?.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">No notifications found</p>
              <button
                onClick={() => {
                  setForm(initialForm);
                  setEditingId(null);
                  setShowModal(true);
                }}
                className="mt-4 text-primary hover:underline"
              >
                Create your first notification
              </button>
            </div>
          ) : (
            notifications?.map((notification) => (
              <div
                key={notification._id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    notification.status === "sent"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : notification.status === "scheduled"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {notification.status === "sent" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : notification.status === "scheduled" ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {notification.body}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {notification.targetAudience === "all"
                        ? "All Users"
                        : notification.targetAudience === "group"
                        ? `Group: ${notification.targetId}`
                        : `Qualification: ${notification.targetId}`}
                    </span>
                    {notification.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(notification.scheduledAt)}
                      </span>
                    )}
                    {notification.status === "sent" && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Users className="h-3 w-3" />
                        {notification.recipientCount} recipients
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {notification.status !== "sent" && (
                    <>
                      <button
                        onClick={() => handleSend(notification._id)}
                        disabled={isSending === notification._id}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isSending === notification._id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Send
                      </button>
                      <button
                        onClick={() => handleEdit(notification)}
                        className="rounded-lg bg-muted p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="rounded-lg bg-red-500/10 p-1.5 text-red-500 transition-colors hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">
                {editingId ? "Edit Notification" : "New Notification"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(initialForm);
                  setEditingId(null);
                }}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Notification title..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Body
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Notification message..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target Audience
                </label>
                <select
                  value={form.targetAudience}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      targetAudience: e.target.value as TargetAudience,
                      targetId: "",
                    })
                  }
                  className="input-field"
                >
                  <option value="all">All Users</option>
                  <option value="group">Specific Group</option>
                  <option value="qualification">By Qualification</option>
                </select>
              </div>

              {form.targetAudience === "group" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Group
                  </label>
                  <select
                    value={form.targetId}
                    onChange={(e) =>
                      setForm({ ...form, targetId: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="">Select a group...</option>
                    {targetGroups?.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.memberCount} members)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.targetAudience === "qualification" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Qualification
                  </label>
                  <select
                    value={form.targetId}
                    onChange={(e) =>
                      setForm({ ...form, targetId: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="">Select a qualification...</option>
                    {targetQualifications?.map((q) => (
                      <option key={q.name} value={q.name}>
                        {q.name} ({q.userCount} users)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Schedule (optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm({ ...form, scheduledAt: e.target.value })
                  }
                  className="input-field"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to save as draft
                </p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(initialForm);
                  setEditingId(null);
                }}
                className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
