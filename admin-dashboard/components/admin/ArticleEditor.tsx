"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/admin/Toast";
import { X, Loader2, Save } from "lucide-react";

interface ArticleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  filterOptionId: Id<"FilterOption">;
  filterOptionName: string;
  article?: {
    _id: Id<"adminArticles">;
    title: string;
    content: string;
    isPublished: boolean;
    order?: number;
  } | null;
}

export function ArticleEditor({
  isOpen,
  onClose,
  onSuccess,
  filterOptionId,
  filterOptionName,
  article,
}: ArticleEditorProps) {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState(article?.title ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? true);
  const [order, setOrder] = useState(article?.order?.toString() ?? "");

  const createArticle = useMutation(api.adminArticles.createArticle);
  const updateArticle = useMutation(api.adminArticles.updateArticle);

  const isEditing = !!article;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast({ type: "error", title: "Validation Error", description: "Title is required." });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateArticle({
          articleId: article._id,
          title: title.trim(),
          content: content.trim(),
          isPublished,
          order: order ? parseInt(order, 10) : undefined,
        });
        addToast({ type: "success", title: "Article Updated", description: `"${title}" updated.` });
      } else {
        await createArticle({
          filterOptionId,
          title: title.trim(),
          content: content.trim(),
        });
        addToast({ type: "success", title: "Article Created", description: `"${title}" created.` });
      }

      onSuccess();
      onClose();
    } catch (error) {
      addToast({
        type: "error",
        title: isEditing ? "Update Failed" : "Creation Failed",
        description: error instanceof Error ? error.message : "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-border bg-card shadow-theme-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? "Edit Article" : "New Article"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              For: {filterOptionName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title..."
                className="input-field"
                autoFocus
              />
            </div>

            {/* Content */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Content <span className="text-xs text-muted-foreground">(Markdown supported)</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here..."
                rows={10}
                className="input-field resize-none font-mono text-sm"
              />
            </div>

            {/* Two columns: Order & Published */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Display Order
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="e.g., 1"
                  min="1"
                  className="input-field"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Published</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Update Article" : "Create Article"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
