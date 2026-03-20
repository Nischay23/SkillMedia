"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import Link from "next/link";
import {
  Users2,
  MessageSquare,
  Search,
  Filter,
  Eye,
  Power,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [deleteGroupId, setDeleteGroupId] = useState<Id<"groups"> | null>(null);
  const [toggleGroupId, setToggleGroupId] = useState<Id<"groups"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch groups and stats
  const groups = useQuery(api.groups.getGroupsForAdmin, { status: statusFilter });
  const stats = useQuery(api.groups.getGroupStats);

  // Mutations
  const deleteGroup = useMutation(api.groups.deleteGroup);
  const toggleStatus = useMutation(api.groups.toggleGroupStatus);

  // Filter groups by search query
  const filteredGroups = groups?.filter((group) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.filterOptionName?.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    );
  });

  // Handle delete
  const handleDelete = async () => {
    if (!deleteGroupId) return;
    setIsDeleting(true);
    try {
      await deleteGroup({ groupId: deleteGroupId });
      setDeleteGroupId(null);
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Failed to delete group. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!toggleGroupId) return;
    setIsToggling(true);
    try {
      await toggleStatus({ groupId: toggleGroupId });
      setToggleGroupId(null);
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("Failed to change group status. Please try again.");
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isLoading = groups === undefined || stats === undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Group Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage community groups and moderation
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats?.totalGroups ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Groups</p>
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
                {isLoading ? "..." : stats?.activeGroups ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Active Groups</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats?.totalMembers ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <MessageSquare className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats?.totalMessages ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="input-field w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filteredGroups?.length ?? 0} groups
        </div>
      </div>

      {/* Groups Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Group
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Career Path
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Users2 className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <AlertTriangle className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse-subtle">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted" />
                        <div className="space-y-1">
                          <div className="h-4 w-32 rounded bg-muted" />
                          <div className="h-3 w-24 rounded bg-muted" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-28 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-4 w-8 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-4 w-8 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-4 w-8 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-8 w-24 rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : filteredGroups && filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <tr key={group._id} className="transition-colors hover:bg-muted/50">
                    {/* Group */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-white">
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{group.name}</p>
                          {group.description && (
                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Career Path */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {group.filterOptionName}
                      </span>
                    </td>

                    {/* Members */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-foreground">
                        {group.memberCount}
                      </span>
                    </td>

                    {/* Messages */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-foreground">
                        {group.messageCount ?? 0}
                      </span>
                    </td>

                    {/* Reports */}
                    <td className="px-6 py-4 text-center">
                      {group.pendingReportsCount > 0 ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-500">
                          {group.pendingReportsCount}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">0</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${
                          group.isActive ? "badge-success" : "badge-warning"
                        }`}
                      >
                        {group.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(group.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/groups/${group._id}`}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setToggleGroupId(group._id)}
                          className={`rounded-lg p-2 text-muted-foreground transition-colors ${
                            group.isActive
                              ? "hover:bg-amber-500/10 hover:text-amber-500"
                              : "hover:bg-emerald-500/10 hover:text-emerald-500"
                          }`}
                          title={group.isActive ? "Disable" : "Enable"}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteGroupId(group._id)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-error-muted hover:text-error"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Users2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? "No groups match your search"
                          : "No groups found"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={toggleGroupId !== null}
        onClose={() => setToggleGroupId(null)}
        onConfirm={handleToggleStatus}
        title={
          filteredGroups?.find((g) => g._id === toggleGroupId)?.isActive
            ? "Disable Group"
            : "Enable Group"
        }
        description={
          filteredGroups?.find((g) => g._id === toggleGroupId)?.isActive
            ? "Disabling this group will prevent members from sending messages. Members will still see the group but won't be able to interact."
            : "Enabling this group will allow members to send messages again."
        }
        confirmText={
          filteredGroups?.find((g) => g._id === toggleGroupId)?.isActive
            ? "Disable"
            : "Enable"
        }
        cancelText="Cancel"
        variant={
          filteredGroups?.find((g) => g._id === toggleGroupId)?.isActive
            ? "warning"
            : "default"
        }
        isLoading={isToggling}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteGroupId !== null}
        onClose={() => setDeleteGroupId(null)}
        onConfirm={handleDelete}
        title="Delete Group"
        description="Are you sure you want to delete this group? This action cannot be undone. All messages, memberships, and associated data will be permanently removed."
        confirmText="Delete Group"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
