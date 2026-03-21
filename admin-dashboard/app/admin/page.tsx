"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatsCard } from "@/components/admin/StatsCard";
import {
  FileText,
  ListTree,
  Plus,
  Settings,
  ArrowRight,
  Heart,
  Bookmark,
  MessageCircle,
  TrendingUp,
  ExternalLink,
  Trophy,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  // Fetch data from Convex
  const posts = useQuery(api.communityPosts.getCommunityPosts, { statusFilter: "all" });
  const filters = useQuery(api.filter.getAllFilterOptions);
  const engagementStats = useQuery(api.adminFilters.getEngagementStats);
  const topCareerPaths = useQuery(api.filter.getFilterOptionsWithStats, { limit: 10 });

  // Loading states
  const postsLoading = posts === undefined;
  const filtersLoading = filters === undefined;
  const engagementLoading = engagementStats === undefined;
  const topPathsLoading = topCareerPaths === undefined;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to the Skills App Admin Dashboard
        </p>
      </div>

      {/* Stats Grid - Top Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Paths"
          value={engagementStats?.totalCards ?? "—"}
          icon={TrendingUp}
          change="All career levels"
          changeType="neutral"
          loading={engagementLoading}
        />
        <StatsCard
          title="Total Likes"
          value={engagementStats?.totalLikes ?? 0}
          icon={Heart}
          change="On career cards"
          changeType="positive"
          loading={engagementLoading}
        />
        <StatsCard
          title="Total Saves"
          value={engagementStats?.totalSaves ?? 0}
          icon={Bookmark}
          change="Bookmarked cards"
          changeType="positive"
          loading={engagementLoading}
        />
        <StatsCard
          title="Total Comments"
          value={engagementStats?.totalComments ?? 0}
          icon={MessageCircle}
          change="On career cards"
          changeType="positive"
          loading={engagementLoading}
        />
      </div>

      {/* Top Career Paths by Engagement Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Top Career Paths by Engagement
            </h2>
          </div>
          <Link
            href="/admin/filters"
            className="text-sm text-primary hover:underline"
          >
            View all paths
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Career Path
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Qualification
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Heart className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <MessageCircle className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topPathsLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-8 w-8 rounded-full bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-4 w-8 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-4 w-8 rounded bg-muted" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-8 w-16 rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : topCareerPaths && topCareerPaths.length > 0 ? (
                topCareerPaths.map((path, index) => (
                  <tr key={path._id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          index === 0
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                            : index === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800"
                            : index === 2
                            ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{path.name}</p>
                      {path.parentPath && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[200px]">
                          {path.parentPath}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {path.qualification}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-foreground">
                        {path.likes}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-foreground">
                        {path.comments}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/filters`}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <p className="text-muted-foreground">
                      No engagement data yet. Career paths will appear here once users interact with them.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Common admin tasks
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Create New Post */}
          <Link
            href="/admin/posts/new"
            className="group flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:bg-primary-muted"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-muted transition-colors group-hover:bg-primary/20">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Create New Post</p>
              <p className="text-xs text-muted-foreground">Add content to the app</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>

          {/* Manage Filters */}
          <Link
            href="/admin/filters"
            className="group flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:bg-primary-muted"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-muted transition-colors group-hover:bg-primary/20">
              <ListTree className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Manage Filters</p>
              <p className="text-xs text-muted-foreground">Categories, Skills, Paths</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>

          {/* Manage Posts */}
          <Link
            href="/admin/posts"
            className="group flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:bg-primary-muted"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-muted transition-colors group-hover:bg-primary/20">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Manage Posts</p>
              <p className="text-xs text-muted-foreground">Edit, Delete, Review</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Posts */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Posts</h2>
            <Link
              href="/admin/posts"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {postsLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-background p-3">
                  <div className="h-10 w-10 animate-pulse rounded bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))
            ) : posts && posts.length > 0 ? (
              posts.slice(0, 5).map((post) => (
                <div
                  key={post._id}
                  className="flex items-center gap-3 rounded-lg bg-background p-3 transition-colors hover:bg-muted"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {post.status === "published" ? "Published" : "Draft"} • {post.user?.username || "Unknown"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      post.status === "published"
                        ? "badge-success"
                        : "badge-warning"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No posts yet. Create your first post!
              </p>
            )}
          </div>
        </div>

        {/* Filter Categories Overview */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Filter Categories</h2>
            <Link
              href="/admin/filters"
              className="text-sm text-primary hover:underline"
            >
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {filtersLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-background p-3">
                  <div className="h-10 w-10 animate-pulse rounded bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))
            ) : filters && filters.length > 0 ? (
              // Show root-level filters (no parentId)
              filters
                .filter((f) => !f.parentId)
                .slice(0, 5)
                .map((filter) => {
                  const childCount = filters.filter(
                    (f) => f.parentId === filter._id
                  ).length;
                  return (
                    <div
                      key={filter._id}
                      className="flex items-center gap-3 rounded-lg bg-background p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <ListTree className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {filter.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {childCount} sub-categories
                        </p>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No filters configured yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
