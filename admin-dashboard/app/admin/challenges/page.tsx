"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle,
  Filter,
  Flame,
  Footprints,
  HelpCircle,
  Plus,
  Power,
  Search,
  Target,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

// Type configuration
const typeConfig = {
  quiz: {
    icon: HelpCircle,
    label: "Quiz",
    color: "text-primary bg-primary/10",
  },
  steps: {
    icon: Footprints,
    label: "Steps",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  streak: {
    icon: Flame,
    label: "Streak",
    color: "text-amber-500 bg-amber-500/10",
  },
};

// Challenge type
type Challenge = {
  _id: Id<"challenges">;
  title: string;
  description?: string;
  type: "quiz" | "steps" | "streak";
  targetValue: number;
  startDate: number;
  endDate: number;
  isActive: boolean;
  groupName: string;
  participantCount: number;
  completedCount: number;
  createdAt: number;
};

export default function ChallengesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "quiz" | "steps" | "streak"
  >("all");

  const [deleteChallengeId, setDeleteChallengeId] =
    useState<Id<"challenges"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create modal state
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [selectedGroupId, setSelectedGroupId] =
    useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<
    "quiz" | "steps" | "streak"
  >("quiz");
  const [newTargetValue, setNewTargetValue] =
    useState<number>(5);
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch data
  const challenges = useQuery(
    api.challenges.getAllChallengesForAdmin,
  );
  const stats = useQuery(api.challenges.getChallengeStats);
  const groups = useQuery(
    api.challenges.getGroupsForChallenge,
  );

  // Mutations
  const createChallenge = useMutation(
    api.challenges.createChallenge,
  );
  const updateChallenge = useMutation(
    api.challenges.updateChallenge,
  );
  const deleteChallenge = useMutation(
    api.challenges.deleteChallenge,
  );

  // Filter challenges
  const filteredChallenges = challenges?.filter(
    (challenge: Challenge) => {
      // Status filter
      const now = Date.now();
      const isActive =
        challenge.isActive &&
        challenge.startDate <= now &&
        challenge.endDate >= now;
      if (statusFilter === "active" && !isActive)
        return false;
      if (statusFilter === "inactive" && isActive)
        return false;

      // Type filter
      if (
        typeFilter !== "all" &&
        challenge.type !== typeFilter
      )
        return false;

      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        challenge.title.toLowerCase().includes(query) ||
        challenge.groupName
          ?.toLowerCase()
          .includes(query) ||
        challenge.description?.toLowerCase().includes(query)
      );
    },
  );

  // Handle create
  const handleCreate = async () => {
    if (
      !selectedGroupId ||
      !newTitle.trim() ||
      !newStartDate ||
      !newEndDate
    )
      return;

    setIsCreating(true);
    try {
      await createChallenge({
        groupId: selectedGroupId as any,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        type: newType,
        targetValue: newTargetValue,
        startDate: new Date(newStartDate).getTime(),
        endDate: new Date(newEndDate).getTime(),
      });

      // Reset form
      setShowCreateModal(false);
      setSelectedGroupId("");
      setNewTitle("");
      setNewDescription("");
      setNewType("quiz");
      setNewTargetValue(5);
      setNewStartDate("");
      setNewEndDate("");
    } catch (error) {
      console.error("Failed to create challenge:", error);
      alert(
        "Failed to create challenge. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (
    challengeId: Id<"challenges">,
    currentStatus: boolean,
  ) => {
    try {
      await updateChallenge({
        challengeId,
        isActive: !currentStatus,
      });
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("Failed to update challenge status.");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteChallengeId) return;
    setIsDeleting(true);
    try {
      await deleteChallenge({
        challengeId: deleteChallengeId,
      });
      setDeleteChallengeId(null);
    } catch (error) {
      console.error("Failed to delete challenge:", error);
      alert(
        "Failed to delete challenge. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getChallengeStatus = (challenge: {
    isActive: boolean;
    startDate: number;
    endDate: number;
  }) => {
    const now = Date.now();
    if (!challenge.isActive)
      return { label: "Disabled", color: "badge-warning" };
    if (challenge.startDate > now)
      return {
        label: "Scheduled",
        color: "bg-blue-500/10 text-blue-500",
      };
    if (challenge.endDate < now)
      return {
        label: "Ended",
        color: "bg-muted text-muted-foreground",
      };
    return { label: "Active", color: "badge-success" };
  };

  const isLoading =
    challenges === undefined || stats === undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Challenge Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage group challenges
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Challenge
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.totalChallenges ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Challenges
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Target className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.activeChallenges ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Active Now
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.totalParticipants ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Participants
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <CheckCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.completedSubmissions ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Completions
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
            placeholder="Search challenges..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(
              e.target.value as typeof typeFilter,
            )
          }
          className="input-field w-auto"
        >
          <option value="all">All Types</option>
          <option value="quiz">Quiz</option>
          <option value="steps">Steps</option>
          <option value="streak">Streak</option>
        </select>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filteredChallenges?.length ?? 0} challenges
        </div>
      </div>

      {/* Challenges Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Challenge
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Group
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Target
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Users className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <CheckCircle className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={i}
                    className="animate-pulse-subtle"
                  >
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-6 w-16 rounded bg-muted" />
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
                      <div className="h-4 w-32 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-8 w-20 rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : filteredChallenges &&
                filteredChallenges.length > 0 ? (
                filteredChallenges.map(
                  (challenge: Challenge) => {
                    const TypeIcon =
                      typeConfig[challenge.type].icon;
                    const status =
                      getChallengeStatus(challenge);

                    return (
                      <tr
                        key={challenge._id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        {/* Challenge */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {challenge.title}
                            </p>
                            {challenge.description && (
                              <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
                                {challenge.description}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Group */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {challenge.groupName}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${typeConfig[challenge.type].color}`}
                          >
                            <TypeIcon className="h-3.5 w-3.5" />
                            {
                              typeConfig[challenge.type]
                                .label
                            }
                          </span>
                        </td>

                        {/* Target */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-foreground">
                            {challenge.targetValue}
                          </span>
                        </td>

                        {/* Participants */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-foreground">
                            {challenge.participantCount}
                          </span>
                        </td>

                        {/* Completed */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-emerald-500">
                            {challenge.completedCount}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {formatDate(
                                challenge.startDate,
                              )}{" "}
                              -{" "}
                              {formatDate(
                                challenge.endDate,
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`badge ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                handleToggleActive(
                                  challenge._id,
                                  challenge.isActive,
                                )
                              }
                              className={`rounded-lg p-2 text-muted-foreground transition-colors ${
                                challenge.isActive
                                  ? "hover:bg-amber-500/10 hover:text-amber-500"
                                  : "hover:bg-emerald-500/10 hover:text-emerald-500"
                              }`}
                              title={
                                challenge.isActive
                                  ? "Disable"
                                  : "Enable"
                              }
                            >
                              <Power className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteChallengeId(
                                  challenge._id,
                                )
                              }
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-error-muted hover:text-error"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Trophy className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? "No challenges match your search"
                          : "No challenges found"}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() =>
                            setShowCreateModal(true)
                          }
                          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Challenge
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

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Create New Challenge
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up a challenge for group members
            </p>

            <div className="mt-6 space-y-4">
              {/* Group Selection */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Select Group{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) =>
                    setSelectedGroupId(e.target.value)
                  }
                  className="input-field"
                >
                  <option value="">
                    Choose a group...
                  </option>
                  {groups?.map(
                    (group: {
                      _id: string;
                      name: string;
                    }) => (
                      <option
                        key={group._id}
                        value={group._id}
                      >
                        {group.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Challenge Title{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) =>
                    setNewTitle(e.target.value)
                  }
                  placeholder="e.g., Weekly Quiz Master"
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) =>
                    setNewDescription(e.target.value)
                  }
                  placeholder="Brief description..."
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              {/* Type and Target */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Challenge Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) =>
                      setNewType(
                        e.target.value as typeof newType,
                      )
                    }
                    className="input-field"
                  >
                    <option value="quiz">
                      Quiz (complete quizzes)
                    </option>
                    <option value="steps">
                      Steps (roadmap steps)
                    </option>
                    <option value="streak">
                      Streak (consecutive days)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={newTargetValue}
                    onChange={(e) =>
                      setNewTargetValue(
                        Number(e.target.value),
                      )
                    }
                    min={1}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Start Date{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) =>
                      setNewStartDate(e.target.value)
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    End Date{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) =>
                      setNewEndDate(e.target.value)
                    }
                    className="input-field"
                  />
                </div>
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
                  !newStartDate ||
                  !newEndDate ||
                  isCreating
                }
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating
                  ? "Creating..."
                  : "Create Challenge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteChallengeId !== null}
        onClose={() => setDeleteChallengeId(null)}
        onConfirm={handleDelete}
        title="Delete Challenge"
        description="Are you sure you want to delete this challenge? This will remove all participant submissions. This action cannot be undone."
        confirmText="Delete Challenge"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
