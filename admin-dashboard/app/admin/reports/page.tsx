"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  XCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  MessageSquare,
  Users2,
} from "lucide-react";

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed" | "dismissed">("pending");

  // Queries
  const reports = useQuery(api.reports.getReports, { status: statusFilter });
  const counts = useQuery(api.reports.getReportCounts);

  // Mutations
  const dismissReport = useMutation(api.reports.dismissReport);
  const deleteReportedMessage = useMutation(api.reports.deleteReportedMessage);

  // Filter reports by search
  const filteredReports = reports?.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.reporter?.fullname?.toLowerCase().includes(query) ||
      report.reporter?.username?.toLowerCase().includes(query) ||
      report.reportedUser?.fullname?.toLowerCase().includes(query) ||
      report.reportedUser?.username?.toLowerCase().includes(query) ||
      report.groupName.toLowerCase().includes(query) ||
      report.reason.toLowerCase().includes(query) ||
      report.message?.content?.toLowerCase().includes(query)
    );
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDismiss = async (reportId: Id<"reports">) => {
    try {
      await dismissReport({ reportId });
    } catch (error) {
      console.error("Failed to dismiss report:", error);
      alert("Failed to dismiss report.");
    }
  };

  const handleDelete = async (reportId: Id<"reports">, messageId: Id<"messages">) => {
    try {
      await deleteReportedMessage({ reportId, messageId });
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message.");
    }
  };

  const isLoading = reports === undefined || counts === undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-muted-foreground">
            Review and moderate reported messages
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button
          onClick={() => setStatusFilter("pending")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            statusFilter === "pending"
              ? "border-amber-500 bg-amber-500/10"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : counts?.pending ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("reviewed")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            statusFilter === "reviewed"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : counts?.reviewed ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Reviewed</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("dismissed")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            statusFilter === "dismissed"
              ? "border-muted-foreground bg-muted/50"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : counts?.dismissed ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Dismissed</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("all")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            statusFilter === "all"
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : counts?.total ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports by user, group, reason, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredReports?.length ?? 0} reports
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-48 rounded bg-muted" />
                  <div className="h-20 w-full rounded bg-muted" />
                </div>
              </div>
            </div>
          ))
        ) : filteredReports && filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div
              key={report._id}
              className={`rounded-xl border transition-colors ${
                report.status === "pending"
                  ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent"
                  : report.status === "reviewed"
                  ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent"
                  : "border-border bg-card"
              }`}
            >
              <div className="p-4">
                {/* Status + Time + Group */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {report.status === "pending" && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-500">
                      <Clock className="h-3 w-3" />
                      Pending Review
                    </span>
                  )}
                  {report.status === "reviewed" && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-500">
                      <CheckCircle className="h-3 w-3" />
                      Reviewed
                    </span>
                  )}
                  {report.status === "dismissed" && (
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <XCircle className="h-3 w-3" />
                      Dismissed
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(report.createdAt)}
                  </span>
                  <Link
                    href={`/admin/groups/${report.groupId}`}
                    className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <Users2 className="h-3 w-3" />
                    {report.groupName}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Left Column - Report Details */}
                  <div className="space-y-3">
                    {/* Reporter */}
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                      {report.reporter?.profileImage ? (
                        <img
                          src={report.reporter.profileImage}
                          alt={report.reporter.fullname}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {report.reporter?.fullname?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Reported by</p>
                        <p className="font-medium text-foreground">
                          {report.reporter?.fullname || "Unknown User"}
                        </p>
                      </div>
                    </div>

                    {/* Reported User */}
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-xs font-medium text-red-500">
                        {report.reportedUser?.fullname?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Message from</p>
                        <p className="font-medium text-foreground">
                          {report.reportedUser?.fullname || "Unknown User"}
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Report Reason</p>
                      <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">
                        {report.reason}
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Message + Actions */}
                  <div className="space-y-3">
                    {/* Reported Message */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">
                        Reported Message
                      </p>
                      <div className="rounded-lg border-l-4 border-amber-500 bg-muted/50 p-3">
                        {report.message?.type === "image" ? (
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            Image message
                          </span>
                        ) : report.message?.isDeleted ? (
                          <span className="text-sm text-muted-foreground italic">
                            [Message has been deleted]
                          </span>
                        ) : (
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {report.message?.content || "Message not found"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {report.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleDelete(report._id, report.messageId)}
                          disabled={report.message?.isDeleted}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Message
                        </button>
                        <button
                          onClick={() => handleDismiss(report._id)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <XCircle className="h-4 w-4" />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">
              {searchQuery ? "No matching reports" : "No reports found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : statusFilter === "pending"
                ? "Great job! No pending reports to review"
                : `No ${statusFilter} reports`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
