"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatsCard } from "@/components/admin/StatsCard";
import { 
  FileText, 
  ListTree, 
  Users, 
  Plus, 
  Settings,
  ArrowRight 
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  // Fetch data from Convex
  const posts = useQuery(api.communityPosts.getCommunityPosts, { statusFilter: "all" });
  const filters = useQuery(api.filter.getAllFilterOptions);

  // Calculate stats
  const totalPosts = posts?.length ?? 0;
  const publishedPosts = posts?.filter(p => p.status === "published").length ?? 0;
  const draftPosts = posts?.filter(p => p.status === "draft").length ?? 0;
  const totalFilters = filters?.length ?? 0;

  // Loading states
  const postsLoading = posts === undefined;
  const filtersLoading = filters === undefined;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to the Skills App Admin Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Posts"
          value={totalPosts}
          icon={FileText}
          change={`${publishedPosts} published`}
          changeType="positive"
          loading={postsLoading}
        />
        <StatsCard
          title="Draft Posts"
          value={draftPosts}
          icon={FileText}
          change="Pending review"
          changeType="neutral"
          loading={postsLoading}
        />
        <StatsCard
          title="Total Filters"
          value={totalFilters}
          icon={ListTree}
          change="Categories & Skills"
          changeType="neutral"
          loading={filtersLoading}
        />
        <StatsCard
          title="Active Users"
          value="—"
          icon={Users}
          change="Coming soon"
          changeType="neutral"
          loading={false}
        />
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
