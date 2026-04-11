"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Ban,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MessageSquare,
  FileText,
  Heart,
  Users2,
  MoreVertical,
  X,
  Activity,
} from "lucide-react";

type SortBy = "createdAt" | "lastActiveAt" | "postsCount" | "name";
type SortOrder = "asc" | "desc";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null);
  const [banReason, setBanReason] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const limit = 20;

  // Queries
  const usersData = useQuery(api.users.getAllUsersWithStats, {
    limit,
    offset,
    search: searchQuery || undefined,
    sortBy,
    sortOrder,
  });

  const userActivity = useQuery(
    api.users.getUserActivityTimeline,
    selectedUser ? { userId: selectedUser, limit: 10 } : "skip"
  );

  // Mutations
  const toggleAdmin = useMutation(api.users.toggleAdminStatus);
  const toggleBan = useMutation(api.users.toggleBanStatus);

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleToggleAdmin = async (userId: Id<"users">) => {
    try {
      await toggleAdmin({ userId });
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
      alert("Failed to update admin status");
    }
  };

  const handleBan = async () => {
    if (!selectedUser) return;
    try {
      await toggleBan({ userId: selectedUser, reason: banReason || undefined });
      setShowBanModal(false);
      setBanReason("");
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to toggle ban status:", error);
      alert("Failed to update ban status");
    }
  };

  const handleUnban = async (userId: Id<"users">) => {
    try {
      await toggleBan({ userId });
    } catch (error) {
      console.error("Failed to unban user:", error);
      alert("Failed to unban user");
    }
  };

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setOffset(0);
  };

  const isLoading = usersData === undefined;
  const users = usersData?.users || [];
  const total = usersData?.total || 0;
  const hasMore = usersData?.hasMore || false;

  // Calculate stats
  const totalUsers = total;
  const activeUsers = users.filter(
    (u) => u.lastActiveAt && Date.now() - u.lastActiveAt < 7 * 24 * 60 * 60 * 1000
  ).length;
  const adminCount = users.filter((u) => u.isAdmin).length;
  const bannedCount = users.filter((u) => u.isBanned).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage users, admins, and moderation
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : totalUsers}
              </p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : activeUsers}
              </p>
              <p className="text-xs text-muted-foreground">Active (7d)</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : adminCount}
              </p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <Ban className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : bannedCount}
              </p>
              <p className="text-xs text-muted-foreground">Banned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0);
            }}
            className="input-field pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  User
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-1">
                    Joined
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("lastActiveAt")}
                >
                  <div className="flex items-center gap-1">
                    Last Active
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort("postsCount")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Activity
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="mx-auto h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="mx-auto h-6 w-16 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="ml-auto h-8 w-8 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className={`border-b border-border transition-colors hover:bg-muted/30 ${
                      user.isBanned ? "bg-red-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.fullname}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {user.fullname?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {user.fullname}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{user.username} • {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {user.lastActiveAt
                        ? formatRelativeTime(user.lastActiveAt)
                        : "Never"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1" title="Posts">
                          <FileText className="h-3.5 w-3.5" />
                          {user.postsCount}
                        </span>
                        <span className="flex items-center gap-1" title="Comments">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {user.commentsCount}
                        </span>
                        <span className="flex items-center gap-1" title="Groups">
                          <Users2 className="h-3.5 w-3.5" />
                          {user.groupsJoined}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {user.isAdmin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-500">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                        {user.isBanned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-500">
                            <Ban className="h-3 w-3" />
                            Banned
                          </span>
                        )}
                        {!user.isAdmin && !user.isBanned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-500">
                            <UserCheck className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleAdmin(user._id)}
                          className={`rounded-lg p-2 transition-colors ${
                            user.isAdmin
                              ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                          }`}
                          title={user.isAdmin ? "Remove Admin" : "Make Admin"}
                        >
                          {user.isAdmin ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </button>
                        {user.isBanned ? (
                          <button
                            onClick={() => handleUnban(user._id)}
                            className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500 transition-colors hover:bg-emerald-500/20"
                            title="Unban User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user._id);
                              setShowBanModal(true);
                            }}
                            className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20"
                            title="Ban User"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setSelectedUser(
                              selectedUser === user._id ? null : user._id
                            )
                          }
                          className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                          title="View Activity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="mt-4 text-lg font-medium text-foreground">
                        No users found
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {searchQuery
                          ? "Try adjusting your search query"
                          : "No users have signed up yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={!hasMore}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* User Activity Panel */}
      {selectedUser && userActivity && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-medium text-foreground">Recent Activity</h3>
            <button
              onClick={() => setSelectedUser(null)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            {userActivity.length > 0 ? (
              <div className="space-y-3">
                {userActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        activity.type === "post"
                          ? "bg-primary/10 text-primary"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {activity.type === "post" ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">Ban User</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to ban this user? They will not be able to
              access the app.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Reason (optional)
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for ban..."
                className="input-field min-h-[80px] resize-none"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setSelectedUser(null);
                }}
                className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
