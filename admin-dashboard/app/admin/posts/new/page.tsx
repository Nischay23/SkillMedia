"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FilterSelector } from "@/components/admin/FilterSelector";
import { useToast } from "@/components/admin/Toast";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Image as ImageIcon,
  ListTree,
  Loader2,
} from "lucide-react";

export default function NewPostPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFilterIds, setSelectedFilterIds] = useState<Id<"FilterOption">[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch filters
  const filters = useQuery(api.filter.getAllFilterOptions);

  // Create mutation
  const createPost = useMutation(api.communityPosts.createCommunityPost);

  // Form validation
  const isValid = title.trim().length > 0 && content.trim().length > 0;

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        linkedFilterOptionIds: selectedFilterIds.length > 0 ? selectedFilterIds : undefined,
        status,
      });

      addToast({
        type: "success",
        title: "Post Created!",
        description: status === "published" 
          ? "Your post has been published successfully." 
          : "Your post has been saved as a draft.",
      });

      router.push("/admin/posts");
    } catch (error) {
      console.error("Failed to create post:", error);
      addToast({
        type: "error",
        title: "Failed to Create Post",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save as draft
  const handleSaveDraft = async () => {
    setStatus("draft");
    // Small delay to ensure state is updated
    setTimeout(() => {
      document.getElementById("post-form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }, 0);
  };

  // Handle publish
  const handlePublish = async () => {
    setStatus("published");
    setTimeout(() => {
      document.getElementById("post-form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }, 0);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/posts"
            className="rounded-lg p-2 text-[#9ca3af] transition-colors hover:bg-[#2d3748] hover:text-[#e5e7eb]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#e5e7eb]">Create New Post</h1>
            <p className="mt-1 text-[#9ca3af]">Add a new community post</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!isValid || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2d3748] bg-transparent px-4 py-2.5 text-sm font-medium text-[#e5e7eb] transition-colors hover:bg-[#2d3748] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && status === "draft" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!isValid || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-4 py-2.5 text-sm font-medium text-[#0b0f19] transition-colors hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && status === "published" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Publish
          </button>
        </div>
      </div>

      {/* Form */}
      <form id="post-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="rounded-xl border border-[#2d3748] bg-[#111827] p-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#e5e7eb]">
            <FileText className="h-4 w-4 text-[#10b981]" />
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-3 text-[#e5e7eb] placeholder-[#9ca3af] transition-colors focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
          />
          <p className="mt-2 text-xs text-[#9ca3af]">
            A clear, descriptive title for your post
          </p>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-[#2d3748] bg-[#111827] p-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#e5e7eb]">
            <FileText className="h-4 w-4 text-[#10b981]" />
            Content <span className="text-red-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here..."
            rows={12}
            className="w-full resize-none rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-3 text-[#e5e7eb] placeholder-[#9ca3af] transition-colors focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-[#9ca3af]">
            <span>Supports plain text content</span>
            <span>{content.length} characters</span>
          </div>
        </div>

        {/* Image URL */}
        <div className="rounded-xl border border-[#2d3748] bg-[#111827] p-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#e5e7eb]">
            <ImageIcon className="h-4 w-4 text-[#10b981]" />
            Image URL <span className="text-[#9ca3af]">(optional)</span>
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-3 text-[#e5e7eb] placeholder-[#9ca3af] transition-colors focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
          />
          <p className="mt-2 text-xs text-[#9ca3af]">
            Add an image URL to display with your post
          </p>

          {/* Image Preview */}
          {imageUrl && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-[#9ca3af]">Preview:</p>
              <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-[#2d3748] bg-[#0b0f19]">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Filter Selection */}
        <div className="rounded-xl border border-[#2d3748] bg-[#111827] p-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#e5e7eb]">
            <ListTree className="h-4 w-4 text-[#10b981]" />
            Career Paths / Filters <span className="text-[#9ca3af]">(optional)</span>
          </label>
          <p className="mb-4 text-xs text-[#9ca3af]">
            Link this post to specific career paths, skills, or categories
          </p>

          {filters === undefined ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#9ca3af]" />
              <span className="text-sm text-[#9ca3af]">Loading filters...</span>
            </div>
          ) : filters.length > 0 ? (
            <FilterSelector
              filters={filters}
              selectedIds={selectedFilterIds}
              onChange={setSelectedFilterIds}
              placeholder="Select career paths or filters..."
            />
          ) : (
            <div className="rounded-lg border border-[#2d3748] bg-[#0b0f19] px-4 py-3">
              <p className="text-sm text-[#9ca3af]">
                No filters available. Create filters first in the Filters section.
              </p>
            </div>
          )}
        </div>

        {/* Form Summary */}
        <div className="rounded-xl border border-[#2d3748] bg-[#111827]/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-[#e5e7eb]">Summary</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af]">Title</span>
              <span className={title ? "text-[#e5e7eb]" : "text-[#9ca3af]"}>
                {title ? `${title.slice(0, 30)}${title.length > 30 ? "..." : ""}` : "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af]">Content Length</span>
              <span className={content ? "text-[#e5e7eb]" : "text-[#9ca3af]"}>
                {content ? `${content.length} characters` : "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af]">Image</span>
              <span className={imageUrl ? "text-[#10b981]" : "text-[#9ca3af]"}>
                {imageUrl ? "Added" : "None"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af]">Linked Filters</span>
              <span className={selectedFilterIds.length > 0 ? "text-[#10b981]" : "text-[#9ca3af]"}>
                {selectedFilterIds.length > 0 ? `${selectedFilterIds.length} selected` : "None"}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
