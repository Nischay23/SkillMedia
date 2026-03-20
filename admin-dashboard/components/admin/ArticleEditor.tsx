"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/admin/Toast";
import {
  X,
  Loader2,
  Save,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
} from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(article?.title ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? true);
  const [order, setOrder] = useState(article?.order?.toString() ?? "");

  const createArticle = useMutation(api.adminArticles.createArticle);
  const updateArticle = useMutation(api.adminArticles.updateArticle);

  const isEditing = !!article;

  // Markdown helper functions
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const newText =
      content.slice(0, start) +
      before +
      selectedText +
      after +
      content.slice(end);

    setContent(newText);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText
        ? start + before.length + selectedText.length + after.length
        : start + before.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find the start of the current line
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = content.indexOf("\n", end);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;

    const selectedLines = content.slice(lineStart, actualLineEnd);
    const lines = selectedLines.split("\n");
    const newLines = lines.map((line) => prefix + line).join("\n");

    const newText = content.slice(0, lineStart) + newLines + content.slice(actualLineEnd);
    setContent(newText);

    // Restore focus
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      label: "Bold",
      action: () => insertMarkdown("**", "**"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertMarkdown("_", "_"),
    },
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => insertLinePrefix("# "),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => insertLinePrefix("## "),
    },
    {
      icon: List,
      label: "Bullet List",
      action: () => insertLinePrefix("- "),
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => insertLinePrefix("1. "),
    },
  ];

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

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-theme-xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
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

            {/* Content with Markdown Toolbar */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Content <span className="text-xs text-muted-foreground">(Markdown supported)</span>
              </label>

              {/* Markdown Toolbar */}
              <div className="flex items-center gap-1 rounded-t-lg border border-b-0 border-border bg-muted/50 px-2 py-1.5">
                {toolbarButtons.map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={btn.action}
                    title={btn.label}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <btn.icon className="h-4 w-4" />
                  </button>
                ))}
                <div className="mx-2 h-5 w-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  **bold** · _italic_ · # heading
                </span>
              </div>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here...

Use markdown for formatting:
# Heading 1
## Heading 2
**bold text**
_italic text_
- bullet point
1. numbered list"
                rows={14}
                className="input-field resize-none rounded-t-none border-t-0 font-mono text-sm"
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
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Lower number appears first
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border bg-muted/50 px-4 py-3 w-full hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">Published</span>
                    <span className="text-xs text-muted-foreground">
                      {isPublished ? "Visible to users" : "Only admins can see"}
                    </span>
                  </div>
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
