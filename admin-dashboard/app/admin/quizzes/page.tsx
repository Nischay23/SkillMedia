"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  BarChart3,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  HelpCircle,
  Plus,
  Search,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function QuizzesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [deleteQuizId, setDeleteQuizId] =
    useState<Id<"quizzes"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch quizzes and stats
  const quizzes = useQuery(
    api.quizzes.getAllQuizzesForAdmin,
  );
  const stats = useQuery(api.quizzes.getQuizStats);

  // Mutations
  const deleteQuiz = useMutation(api.quizzes.deleteQuiz);
  const updateQuiz = useMutation(api.quizzes.updateQuiz);

  // Filter quizzes
  const filteredQuizzes = quizzes?.filter((quiz) => {
    if (statusFilter === "published" && !quiz.isPublished)
      return false;
    if (statusFilter === "draft" && quiz.isPublished)
      return false;

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      quiz.title.toLowerCase().includes(query) ||
      quiz.groupName?.toLowerCase().includes(query) ||
      quiz.description?.toLowerCase().includes(query)
    );
  });

  // Handle delete
  const handleDelete = async () => {
    if (!deleteQuizId) return;
    setIsDeleting(true);
    try {
      await deleteQuiz({ quizId: deleteQuizId });
      setDeleteQuizId(null);
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      alert("Failed to delete quiz. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle publish
  const handleTogglePublish = async (
    quizId: Id<"quizzes">,
    currentStatus: boolean,
  ) => {
    try {
      await updateQuiz({
        quizId,
        isPublished: !currentStatus,
      });
    } catch (error) {
      console.error(
        "Failed to toggle publish status:",
        error,
      );
      alert("Failed to update quiz status.");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isLoading =
    quizzes === undefined || stats === undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quiz Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage quizzes for career groups
          </p>
        </div>
        <Link
          href="/admin/quizzes/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Quiz
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.totalQuizzes ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Quizzes
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
                {isLoading
                  ? "..."
                  : (stats?.publishedQuizzes ?? 0)}
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
                {isLoading
                  ? "..."
                  : (stats?.draftQuizzes ?? 0)}
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
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.totalAttempts ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Attempts
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
            placeholder="Search quizzes..."
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
          {filteredQuizzes?.length ?? 0} quizzes
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Quiz
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Group
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Questions
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Users className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Avg Score
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Clock className="mx-auto h-4 w-4" />
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
                      <div className="mx-auto h-4 w-12 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-4 w-12 rounded bg-muted" />
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
              ) : filteredQuizzes &&
                filteredQuizzes.length > 0 ? (
                filteredQuizzes.map((quiz) => (
                  <tr
                    key={quiz._id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    {/* Quiz */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-white">
                          <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {quiz.title}
                          </p>
                          {quiz.description && (
                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
                              {quiz.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Group */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {quiz.groupName}
                      </span>
                    </td>

                    {/* Questions */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-foreground">
                        {quiz.questionCount}
                      </span>
                    </td>

                    {/* Attempts */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-foreground">
                        {quiz.attemptCount}
                      </span>
                    </td>

                    {/* Avg Score */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-sm font-medium ${
                          quiz.avgScore >= 70
                            ? "text-emerald-500"
                            : quiz.avgScore >= 50
                              ? "text-amber-500"
                              : "text-foreground"
                        }`}
                      >
                        {quiz.attemptCount > 0
                          ? `${quiz.avgScore}%`
                          : "-"}
                      </span>
                    </td>

                    {/* Time Limit */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-muted-foreground">
                        {quiz.timeLimit
                          ? `${quiz.timeLimit}m`
                          : "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          handleTogglePublish(
                            quiz._id,
                            quiz.isPublished,
                          )
                        }
                        className={`badge cursor-pointer transition-colors ${
                          quiz.isPublished
                            ? "badge-success hover:bg-emerald-500/30"
                            : "badge-warning hover:bg-amber-500/30"
                        }`}
                      >
                        {quiz.isPublished
                          ? "Published"
                          : "Draft"}
                      </button>
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(quiz.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/quizzes/${quiz._id}`}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="View Analytics"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteQuizId(quiz._id)
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
                    colSpan={9}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <HelpCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? "No quizzes match your search"
                          : "No quizzes found"}
                      </p>
                      {!searchQuery && (
                        <Link
                          href="/admin/quizzes/new"
                          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Quiz
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteQuizId !== null}
        onClose={() => setDeleteQuizId(null)}
        onConfirm={handleDelete}
        title="Delete Quiz"
        description="Are you sure you want to delete this quiz? This will remove all questions and attempt history. This action cannot be undone."
        confirmText="Delete Quiz"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
