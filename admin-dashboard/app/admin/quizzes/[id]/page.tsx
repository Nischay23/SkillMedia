"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function QuizAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as Id<"quizzes">;

  const [deleteQuizId, setDeleteQuizId] =
    useState<Id<"quizzes"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch quiz analytics
  const analytics = useQuery(api.quizzes.getQuizAnalytics, {
    quizId,
  });

  // Mutations
  const deleteQuiz = useMutation(api.quizzes.deleteQuiz);
  const updateQuiz = useMutation(api.quizzes.updateQuiz);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteQuizId) return;
    setIsDeleting(true);
    try {
      await deleteQuiz({ quizId: deleteQuizId });
      router.push("/admin/quizzes");
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      alert("Failed to delete quiz. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle publish
  const handleTogglePublish = async () => {
    if (!analytics) return;
    try {
      await updateQuiz({
        quizId,
        isPublished: !analytics.isPublished,
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Chart data
  const chartData = analytics?.scoreDistribution
    ? [
        {
          name: "0-25%",
          value: analytics.scoreDistribution[0],
          color: "#ef4444",
        },
        {
          name: "26-50%",
          value: analytics.scoreDistribution[1],
          color: "#f97316",
        },
        {
          name: "51-75%",
          value: analytics.scoreDistribution[2],
          color: "#eab308",
        },
        {
          name: "76-100%",
          value: analytics.scoreDistribution[3],
          color: "#22c55e",
        },
      ]
    : [];

  if (analytics === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (analytics === null) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <HelpCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          Quiz Not Found
        </h2>
        <p className="text-muted-foreground">
          This quiz may have been deleted or doesn&apos;t
          exist.
        </p>
        <Link
          href="/admin/quizzes"
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/quizzes"
          className="mt-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {analytics.title}
            </h1>
            <span
              className={`badge ${analytics.isPublished ? "badge-success" : "badge-warning"}`}
            >
              {analytics.isPublished
                ? "Published"
                : "Draft"}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {analytics.groupName} • Created{" "}
            {formatDate(analytics.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePublish}
            className={`inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${
              analytics.isPublished
                ? "text-amber-500"
                : "text-emerald-500"
            }`}
          >
            {analytics.isPublished ? (
              <>
                <EyeOff className="h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Publish
              </>
            )}
          </button>
          <button
            onClick={() => setDeleteQuizId(quizId)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
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
                {analytics.questions.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Questions
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
                {analytics.attemptCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Attempts
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {analytics.attemptCount > 0
                  ? analytics.avgScore
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg Score
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {analytics.timeLimit
                  ? `${analytics.timeLimit}m`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Time Limit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Questions Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Distribution Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Score Distribution
          </h2>
          {analytics.attemptCount > 0 ? (
            <div className="h-64">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                    itemStyle={{ color: "#9ca3af" }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No attempts yet
            </div>
          )}
        </div>

        {/* Questions Preview */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Questions ({analytics.questions.length})
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analytics.questions.map((question, index) => (
              <div
                key={question._id}
                className="rounded-lg border border-border bg-muted/50 p-3"
              >
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {question.text}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {question.options.length} options •{" "}
                      <span className="text-emerald-500">
                        Correct:{" "}
                        {
                          question.options[
                            question.correctIndex
                          ]
                        }
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Attempts Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Attempts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Time
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {analytics.recentAttempts.length > 0 ? (
                analytics.recentAttempts.map((attempt) => {
                  const percentage =
                    attempt.totalQuestions > 0
                      ? Math.round(
                          (attempt.score /
                            attempt.totalQuestions) *
                            100,
                        )
                      : 0;
                  const passed =
                    analytics.passingScore !== undefined
                      ? attempt.score >=
                        analytics.passingScore
                      : percentage >= 50;

                  return (
                    <tr
                      key={attempt._id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {attempt.user?.profileImage ? (
                            <img
                              src={
                                attempt.user.profileImage
                              }
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {attempt.user?.fullname?.[0]?.toUpperCase() ??
                                "?"}
                            </div>
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {attempt.user?.fullname ??
                              "Unknown User"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-foreground">
                          {attempt.score}/
                          {attempt.totalQuestions}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({percentage}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-muted-foreground">
                          {formatTime(attempt.timeTaken)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {passed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                            <CheckCircle className="h-3 w-3" />
                            Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(attempt.completedAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No attempts yet
                      </p>
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
