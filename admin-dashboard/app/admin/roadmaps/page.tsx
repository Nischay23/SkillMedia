"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import Link from "next/link";
import {
  Map,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Target,
  TrendingUp,
} from "lucide-react";

export default function RoadmapsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [deleteRoadmapId, setDeleteRoadmapId] =
    useState<Id<"roadmaps"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] =
    useState(false);

  // Create roadmap form state
  const [selectedGroupId, setSelectedGroupId] = useState<
    Id<"groups"> | ""
  >("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch roadmaps and groups
  const roadmaps = useQuery(api.roadmaps.getAllRoadmaps);
  const groups = useQuery(api.roadmaps.getGroupsForRoadmap);

  // Mutations
  const deleteRoadmap = useMutation(
    api.roadmaps.deleteRoadmap,
  );
  const createRoadmap = useMutation(
    api.roadmaps.createRoadmap,
  );
  const updateRoadmap = useMutation(
    api.roadmaps.updateRoadmap,
  );

  // Filter roadmaps
  const filteredRoadmaps = roadmaps?.filter((roadmap) => {
    // Status filter
    if (
      statusFilter === "published" &&
      !roadmap.isPublished
    )
      return false;
    if (statusFilter === "draft" && roadmap.isPublished)
      return false;

    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      roadmap.title.toLowerCase().includes(query) ||
      roadmap.groupName?.toLowerCase().includes(query) ||
      roadmap.description?.toLowerCase().includes(query)
    );
  });

  // Stats
  const stats = {
    total: roadmaps?.length ?? 0,
    published:
      roadmaps?.filter((r) => r.isPublished).length ?? 0,
    draft:
      roadmaps?.filter((r) => !r.isPublished).length ?? 0,
    totalUsers:
      roadmaps?.reduce(
        (sum, r) => sum + (r.usersStarted ?? 0),
        0,
      ) ?? 0,
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteRoadmapId) return;
    setIsDeleting(true);
    try {
      await deleteRoadmap({ roadmapId: deleteRoadmapId });
      setDeleteRoadmapId(null);
    } catch (error) {
      console.error("Failed to delete roadmap:", error);
      alert("Failed to delete roadmap. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle publish
  const handleTogglePublish = async (
    roadmapId: Id<"roadmaps">,
    currentStatus: boolean,
  ) => {
    try {
      await updateRoadmap({
        roadmapId,
        isPublished: !currentStatus,
      });
    } catch (error) {
      console.error(
        "Failed to toggle publish status:",
        error,
      );
      alert("Failed to update roadmap status.");
    }
  };

  // Handle create
  const handleCreate = async () => {
    if (!selectedGroupId || !newTitle.trim()) return;
    setIsCreating(true);
    try {
      await createRoadmap({
        groupId: selectedGroupId as Id<"groups">,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        difficulty: newDifficulty,
      });
      setShowCreateModal(false);
      setSelectedGroupId("");
      setNewTitle("");
      setNewDescription("");
      setNewDifficulty("beginner");
    } catch (error) {
      console.error("Failed to create roadmap:", error);
      alert("Failed to create roadmap. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isLoading = roadmaps === undefined;

  // Groups without roadmaps for dropdown
  const availableGroups =
    groups?.filter((g) => !g.hasRoadmap) ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Roadmap Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage learning roadmaps for career
            groups
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Roadmap
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats.total}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Roadmaps
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats.published}
              </p>
              <p className="text-xs text-muted-foreground">
                Published
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : stats.draft}
              </p>
              <p className="text-xs text-muted-foreground">
                Drafts
              </p>
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
                {isLoading ? "..." : stats.totalUsers}
              </p>
              <p className="text-xs text-muted-foreground">
                Users Started
              </p>
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
            placeholder="Search roadmaps..."
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
            onChange={(e) =>
              setStatusFilter(
                e.target.value as typeof statusFilter,
              )
            }
            className="input-field w-auto"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filteredRoadmaps?.length ?? 0} roadmaps
        </div>
      </div>

      {/* Roadmaps Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Roadmap
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Group
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Milestones
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Steps
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Users className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Updated
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
                  <tr
                    key={i}
                    className="animate-pulse-subtle"
                  >
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
              ) : filteredRoadmaps &&
                filteredRoadmaps.length > 0 ? (
                filteredRoadmaps.map((roadmap) => (
                  <tr
                    key={roadmap._id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    {/* Roadmap */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-white">
                          <Map className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {roadmap.title}
                          </p>
                          {roadmap.difficulty && (
                            <span
                              className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                roadmap.difficulty ===
                                "beginner"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : roadmap.difficulty ===
                                      "intermediate"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-red-500/10 text-red-500"
                              }`}
                            >
                              {roadmap.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Group */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {roadmap.groupName}
                      </span>
                    </td>

                    {/* Milestones */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-foreground">
                        {roadmap.milestoneCount}
                      </span>
                    </td>

                    {/* Steps */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-foreground">
                        {roadmap.stepCount}
                      </span>
                    </td>

                    {/* Users */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-foreground">
                        {roadmap.usersStarted}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          handleTogglePublish(
                            roadmap._id,
                            roadmap.isPublished,
                          )
                        }
                        className={`badge cursor-pointer transition-colors ${
                          roadmap.isPublished
                            ? "badge-success hover:bg-emerald-500/30"
                            : "badge-warning hover:bg-amber-500/30"
                        }`}
                      >
                        {roadmap.isPublished
                          ? "Published"
                          : "Draft"}
                      </button>
                    </td>

                    {/* Updated */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(roadmap.updatedAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/roadmaps/${roadmap._id}`}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit Roadmap"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteRoadmapId(roadmap._id)
                          }
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
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Map className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? "No roadmaps match your search"
                          : "No roadmaps found"}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() =>
                            setShowCreateModal(true)
                          }
                          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Roadmap
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Roadmap Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Create New Roadmap
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a learning roadmap for a career group
            </p>

            <div className="mt-6 space-y-4">
              {/* Group Selection */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Select Group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) =>
                    setSelectedGroupId(
                      e.target.value as Id<"groups"> | "",
                    )
                  }
                  className="input-field"
                >
                  <option value="">
                    Choose a group...
                  </option>
                  {availableGroups.map((group) => (
                    <option
                      key={group._id}
                      value={group._id}
                    >
                      {group.name} ({group.filterOptionName}
                      )
                    </option>
                  ))}
                </select>
                {availableGroups.length === 0 && (
                  <p className="mt-1 text-xs text-amber-500">
                    All groups already have roadmaps
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Roadmap Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) =>
                    setNewTitle(e.target.value)
                  }
                  placeholder="e.g., NDA Preparation Roadmap"
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) =>
                    setNewDescription(e.target.value)
                  }
                  placeholder="Brief description of this roadmap..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Difficulty Level
                </label>
                <select
                  value={newDifficulty}
                  onChange={(e) =>
                    setNewDifficulty(
                      e.target
                        .value as typeof newDifficulty,
                    )
                  }
                  className="input-field"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">
                    Intermediate
                  </option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  !selectedGroupId ||
                  !newTitle.trim() ||
                  isCreating
                }
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating
                  ? "Creating..."
                  : "Create Roadmap"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteRoadmapId !== null}
        onClose={() => setDeleteRoadmapId(null)}
        onConfirm={handleDelete}
        title="Delete Roadmap"
        description="Are you sure you want to delete this roadmap? This will remove all milestones, steps, and user progress. This action cannot be undone."
        confirmText="Delete Roadmap"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
