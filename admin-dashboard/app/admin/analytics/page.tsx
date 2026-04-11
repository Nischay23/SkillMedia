"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Award,
  BarChart3,
  Bookmark,
  Download,
  FileText,
  Heart,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Trophy,
  Users,
  Users2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ContentPost {
  id: string;
  title: string;
  likes: number;
  saves: number;
  comments: number;
  engagementScore: number;
  createdAt: number;
  author: { name: string; image?: string } | null;
  careerPaths: string[];
  status: string;
}

interface TopGroup {
  id: string;
  name: string;
  memberCount: number;
  messageCount: number;
  careerPath: string | null;
  activityScore: number;
}

// Helper function to convert data to CSV
function convertToCSV<T extends Record<string, unknown>>(data: T[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if needed
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ];
  return csvRows.join("\n");
}

// Helper function to download CSV
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AnalyticsPage() {
  const [exportingType, setExportingType] = useState<string | null>(null);

  const stats = useQuery(api.analytics.getDashboardStats);
  const contentPerformance = useQuery(api.analytics.getContentPerformance, {
    limit: 10,
  });

  // Export queries
  const exportUsers = useQuery(api.analytics.exportUsers);
  const exportPosts = useQuery(api.analytics.exportPosts);
  const exportGroups = useQuery(api.analytics.exportGroups);
  const exportAnalytics = useQuery(api.analytics.exportAnalytics, { days: 30 });

  const isLoading = stats === undefined;
  const isContentLoading = contentPerformance === undefined;

  const handleExport = (type: "users" | "posts" | "groups" | "analytics") => {
    setExportingType(type);

    let data: Record<string, unknown>[] | undefined;
    let filename = "";

    switch (type) {
      case "users":
        data = exportUsers;
        filename = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "posts":
        data = exportPosts;
        filename = `posts_export_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "groups":
        data = exportGroups;
        filename = `groups_export_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "analytics":
        data = exportAnalytics;
        filename = `analytics_export_${new Date().toISOString().split("T")[0]}.csv`;
        break;
    }

    if (data && data.length > 0) {
      const csv = convertToCSV(data);
      downloadCSV(csv, filename);
    }

    setTimeout(() => setExportingType(null), 1000);
  };

  // Format date for chart
  const formatDateString = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  // Process daily signups data for chart
  const chartData =
    stats?.dailySignups?.map((d: { date: string; count: number }) => ({
      name: formatDateString(d.date),
      users: d.count,
    })) || [];

  // Process popular career paths for bar chart
  const careerPathsData =
    stats?.popularCareerPaths?.map((cp: { id: string; name: string; count: number }) => ({
      name:
        cp.name.length > 15
          ? cp.name.slice(0, 15) + "..."
          : cp.name,
      posts: cp.count,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Analytics
          </h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your platform performance
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          Last updated: Now
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Users */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <div className="flex items-center gap-3 pl-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground animate-in fade-in duration-500">
                {isLoading
                  ? "..."
                  : (stats?.totalUsers ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Users
              </p>
            </div>
          </div>
        </div>

        {/* Active Today */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
          <div className="flex items-center gap-3 pl-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.activeUsersToday ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Active Today
              </p>
            </div>
          </div>
        </div>

        {/* New This Week */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
          <div className="flex items-center gap-3 pl-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.newUsersThisWeek ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                New This Week
              </p>
            </div>
          </div>
        </div>

        {/* Total Posts */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
          <div className="flex items-center gap-3 pl-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.totalPosts ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Posts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            New Users (Last 7 Days)
          </h2>
          <div className="h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#333"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#888"
                    fontSize={12}
                  />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#6C5DD3"
                    strokeWidth={2}
                    dot={{ fill: "#6C5DD3" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Popular Career Paths */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Popular Career Paths (by posts)
          </h2>
          <div className="h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : careerPathsData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={careerPathsData}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#333"
                  />
                  <XAxis
                    type="number"
                    stroke="#888"
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#888"
                    fontSize={11}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="posts"
                    fill="url(#gradient)"
                    radius={[0, 4, 4, 0]}
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6C5DD3"
                      />
                      <stop
                        offset="100%"
                        stopColor="#8676FF"
                      />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Groups */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Users2 className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.totalGroups ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Groups
              </p>
            </div>
          </div>
        </div>

        {/* Total Messages */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <MessageSquare className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.totalMessages ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Messages
              </p>
            </div>
          </div>
        </div>

        {/* New Users Today */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading
                  ? "..."
                  : (stats?.newUsersToday ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                New Users Today
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder for future stat */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Award className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : "∞"}
              </p>
              <p className="text-xs text-muted-foreground">
                Potential Careers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Comparison */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Quick Stats Summary
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                User Activity
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-primary">
              {isLoading
                ? "..."
                : stats && stats.totalUsers > 0
                  ? Math.round(
                      (stats.activeUsersToday /
                        stats.totalUsers) *
                        100,
                    )
                  : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground">
              Active rate today
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">
                Growth
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-500">
              +
              {isLoading
                ? "..."
                : (stats?.newUsersThisWeek ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Users this week
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-foreground">
                Engagement
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-500">
              {isLoading
                ? "..."
                : stats && stats.totalGroups > 0
                  ? Math.round(
                      stats.totalMessages /
                        stats.totalGroups,
                    )
                  : 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Avg messages/group
            </p>
          </div>
        </div>
      </div>

      {/* Content Performance Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Content Performance
        </h2>

        {/* Content Engagement Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {isContentLoading
                    ? "..."
                    : contentPerformance?.totalMetrics?.likes ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Bookmark className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {isContentLoading
                    ? "..."
                    : contentPerformance?.totalMetrics?.saves ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Saves</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <MessageSquare className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {isContentLoading
                    ? "..."
                    : contentPerformance?.totalMetrics?.comments ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Comments</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Users2 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {isContentLoading
                    ? "..."
                    : contentPerformance?.totalMetrics?.groups ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Active Groups</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Posts & Groups */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Performing Posts */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="font-semibold text-foreground">
                Top Performing Posts
              </h3>
              <p className="text-sm text-muted-foreground">
                By engagement score (likes + saves + comments)
              </p>
            </div>
            <div className="divide-y divide-border">
              {isContentLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))
              ) : contentPerformance?.topPosts?.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground">
                  No posts yet
                </div>
              ) : (
                contentPerformance?.topPosts?.slice(0, 5).map((post: ContentPost, i: number) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                        i === 0
                          ? "bg-amber-500/20 text-amber-500"
                          : i === 1
                          ? "bg-slate-400/20 text-slate-400"
                          : i === 2
                          ? "bg-orange-600/20 text-orange-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bookmark className="h-3 w-3" />
                          {post.saves}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.comments}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {post.engagementScore}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Most Active Groups */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="font-semibold text-foreground">
                Most Active Groups
              </h3>
              <p className="text-sm text-muted-foreground">
                By activity score (members + messages)
              </p>
            </div>
            <div className="divide-y divide-border">
              {isContentLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))
              ) : contentPerformance?.topGroups?.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground">
                  No groups yet
                </div>
              ) : (
                contentPerformance?.topGroups?.map((group: TopGroup, i: number) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                        i === 0
                          ? "bg-amber-500/20 text-amber-500"
                          : i === 1
                          ? "bg-slate-400/20 text-slate-400"
                          : i === 2
                          ? "bg-orange-600/20 text-orange-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {group.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.memberCount} members
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {group.messageCount} messages
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {group.activityScore}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Data Section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </h3>
          <p className="text-sm text-muted-foreground">
            Download data as CSV files for reporting
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <button
              onClick={() => handleExport("users")}
              disabled={!exportUsers || exportingType === "users"}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Users className="h-8 w-8 text-primary" />
              <span className="font-medium text-foreground">Users</span>
              <span className="text-xs text-muted-foreground">
                {exportingType === "users"
                  ? "Downloading..."
                  : `${exportUsers?.length || 0} records`}
              </span>
            </button>

            <button
              onClick={() => handleExport("posts")}
              disabled={!exportPosts || exportingType === "posts"}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-muted disabled:opacity-50"
            >
              <FileText className="h-8 w-8 text-emerald-500" />
              <span className="font-medium text-foreground">Posts</span>
              <span className="text-xs text-muted-foreground">
                {exportingType === "posts"
                  ? "Downloading..."
                  : `${exportPosts?.length || 0} records`}
              </span>
            </button>

            <button
              onClick={() => handleExport("groups")}
              disabled={!exportGroups || exportingType === "groups"}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Users2 className="h-8 w-8 text-amber-500" />
              <span className="font-medium text-foreground">Groups</span>
              <span className="text-xs text-muted-foreground">
                {exportingType === "groups"
                  ? "Downloading..."
                  : `${exportGroups?.length || 0} records`}
              </span>
            </button>

            <button
              onClick={() => handleExport("analytics")}
              disabled={!exportAnalytics || exportingType === "analytics"}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-muted disabled:opacity-50"
            >
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <span className="font-medium text-foreground">Analytics</span>
              <span className="text-xs text-muted-foreground">
                {exportingType === "analytics"
                  ? "Downloading..."
                  : "Last 30 days"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
