"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  Heart,
  MessageCircle,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
} from "lucide-react";

export default function PostsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [deletePostId, setDeletePostId] = useState<Id<"communityPosts"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch posts
  const posts = useQuery(api.communityPosts.getCommunityPosts, {
    statusFilter: statusFilter,
  });

  // Delete mutation
  const deletePost = useMutation(api.communityPosts.adminDeleteCommunityPost);

  // Filter posts by search query
  const filteredPosts = posts?.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.user?.username?.toLowerCase().includes(query)
    );
  });

  // Handle delete
  const handleDelete = async () => {
    if (!deletePostId) return;

    setIsDeleting(true);
    try {
      await deletePost({ postId: deletePostId });
      setDeletePostId(null);
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Truncate content
  const truncate = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  const isLoading = posts === undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e7eb]">Posts</h1>
          <p className="mt-1 text-[#9ca3af]">
            Manage all community posts
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-4 py-2.5 text-sm font-medium text-[#0b0f19] transition-colors hover:bg-[#059669]"
        >
          <Plus className="h-4 w-4" />
          Create Post
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#2d3748] bg-[#111827] p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] py-2 pl-10 pr-4 text-sm text-[#e5e7eb] placeholder-[#9ca3af] transition-colors focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#9ca3af]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-[#2d3748] bg-[#0b0f19] px-3 py-2 text-sm text-[#e5e7eb] transition-colors focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-[#9ca3af]">
          {filteredPosts?.length ?? 0} posts
        </div>
      </div>

      {/* Posts Table */}
      <div className="overflow-hidden rounded-xl border border-[#2d3748] bg-[#111827]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d3748] bg-[#0b0f19]/50">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
                  Content
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
                  Author
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
                  <Heart className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
                  <MessageCircle className="mx-auto h-4 w-4" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
                  <Calendar className="inline h-4 w-4" /> Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d3748]">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-48 rounded bg-[#2d3748]" />
                        <div className="h-3 w-64 rounded bg-[#2d3748]" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded bg-[#2d3748]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-4 w-8 rounded bg-[#2d3748]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="mx-auto h-4 w-8 rounded bg-[#2d3748]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-20 rounded bg-[#2d3748]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded bg-[#2d3748]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-8 w-24 rounded bg-[#2d3748]" />
                    </td>
                  </tr>
                ))
              ) : filteredPosts && filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <tr
                    key={post._id}
                    className="transition-colors hover:bg-[#1f2937]"
                  >
                    {/* Content */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-[#e5e7eb]">
                          {truncate(post.title, 50)}
                        </p>
                        <p className="mt-1 text-sm text-[#9ca3af]">
                          {truncate(post.content, 80)}
                        </p>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {post.user?.profileImage ? (
                          <img
                            src={post.user.profileImage}
                            alt={post.user.username}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2d3748] text-xs font-medium text-[#9ca3af]">
                            {post.user?.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="text-sm text-[#e5e7eb]">
                          {post.user?.username || "Unknown"}
                        </span>
                      </div>
                    </td>

                    {/* Likes */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-[#e5e7eb]">
                        {post.likes || 0}
                      </span>
                    </td>

                    {/* Comments */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-[#e5e7eb]">
                        {post.comments || 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          post.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {post.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#9ca3af]">
                        {formatDate(post.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/posts/${post._id}`}
                          className="rounded-lg p-2 text-[#9ca3af] transition-colors hover:bg-[#2d3748] hover:text-[#e5e7eb]"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/posts/${post._id}/edit`}
                          className="rounded-lg p-2 text-[#9ca3af] transition-colors hover:bg-[#2d3748] hover:text-[#10b981]"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeletePostId(post._id)}
                          className="rounded-lg p-2 text-[#9ca3af] transition-colors hover:bg-red-500/10 hover:text-red-400"
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
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2d3748]">
                        <Search className="h-6 w-6 text-[#9ca3af]" />
                      </div>
                      <p className="text-[#9ca3af]">
                        {searchQuery
                          ? "No posts match your search"
                          : "No posts found"}
                      </p>
                      <Link
                        href="/admin/posts/new"
                        className="text-sm text-[#10b981] hover:underline"
                      >
                        Create your first post
                      </Link>
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
        isOpen={deletePostId !== null}
        onClose={() => setDeletePostId(null)}
        onConfirm={handleDelete}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone. All associated comments, likes, and saved content will also be removed."
        confirmText="Delete Post"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
