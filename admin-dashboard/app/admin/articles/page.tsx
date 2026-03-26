"use client";

import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  BookOpen,
  Edit,
  Eye,
  EyeOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export default function ArticlesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteArticleId, setDeleteArticleId] =
    useState<Id<"adminArticles"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<{
    _id: Id<"adminArticles">;
    title: string;
    content: string;
    isPublished: boolean;
    order?: number;
    filterOptionId: Id<"FilterOption">;
    filterOptionName: string;
  } | null>(null);

  // Filter option selector for new articles
  const [selectedFilterId, setSelectedFilterId] = useState<
    Id<"FilterOption"> | ""
  >("");

  // Fetch data
  const articles = useQuery(
    api.adminArticles.getAllArticles,
  );
  const filters = useQuery(api.filter.getAllFilterOptions);

  // Delete mutation
  const deleteArticle = useMutation(
    api.adminArticles.deleteArticle,
  );

  // Article type from query (matches Convex return type)
  type Article = {
    _id: Id<"adminArticles">;
    _creationTime: number;
    title: string;
    content: string;
    filterOptionId: Id<"FilterOption">;
    filterOptionName: string;
    isPublished: boolean;
    order?: number;
    createdAt: number;
    updatedAt: number;
    authorId: Id<"users">;
  };

  // Filter articles by search
  const filteredArticles = articles?.filter(
    (article: Article) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.filterOptionName
          .toLowerCase()
          .includes(query)
      );
    },
  );

  // Group articles by career path
  type ArticleAccumulator = Record<
    string,
    { name: string; articles: Article[] }
  >;
  const groupedArticles = filteredArticles?.reduce(
    (acc: ArticleAccumulator, article: Article) => {
      const key = article.filterOptionId;
      if (!acc[key]) {
        acc[key] = {
          name: article.filterOptionName,
          articles: [],
        };
      }
      acc[key].articles.push(article);
      return acc;
    },
    {} as ArticleAccumulator,
  );

  const handleDelete = async () => {
    if (!deleteArticleId) return;
    setIsDeleting(true);
    try {
      await deleteArticle({ articleId: deleteArticleId });
      setDeleteArticleId(null);
    } catch (error) {
      console.error("Failed to delete article:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewArticle = () => {
    if (!selectedFilterId) return;
    const filterName =
      filters?.find((f) => f._id === selectedFilterId)
        ?.name ?? "Unknown";
    setEditingArticle(null);
    setEditorOpen(true);
    // Store the selected filter info for the editor
    setEditingArticle(null);
    setEditorOpen(true);
  };

  const handleEditArticle = (
    article: NonNullable<typeof filteredArticles>[number],
  ) => {
    setEditingArticle({
      _id: article._id,
      title: article.title,
      content: article.content,
      isPublished: article.isPublished,
      order: article.order,
      filterOptionId: article.filterOptionId,
      filterOptionName: article.filterOptionName,
    });
    setSelectedFilterId(article.filterOptionId);
    setEditorOpen(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncate = (
    text: string,
    maxLength: number = 100,
  ) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  const isLoading = articles === undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Articles
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage admin articles linked to career paths
          </p>
        </div>

        {/* New Article Controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedFilterId}
            onChange={(e) =>
              setSelectedFilterId(
                e.target.value as Id<"FilterOption"> | "",
              )
            }
            className="input-field w-auto max-w-[200px]"
          >
            <option value="">Select career path...</option>
            {filters?.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleNewArticle}
            disabled={!selectedFilterId}
            className="btn-primary disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Article
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredArticles?.length ?? 0} articles
        </div>
      </div>

      {/* Articles grouped by career path */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-6"
            >
              <div className="h-5 w-48 rounded bg-muted mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : groupedArticles &&
        Object.keys(groupedArticles).length > 0 ? (
        <div className="space-y-6">
          {(
            Object.entries(groupedArticles) as [
              string,
              { name: string; articles: Article[] },
            ][]
          ).map(([filterOptionId, group]) => (
            <div
              key={filterOptionId}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Group Header */}
              <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-6 py-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  {group.name}
                </h3>
                <span className="rounded-full bg-primary-muted px-2 py-0.5 text-xs font-medium text-primary">
                  {group.articles.length} article
                  {group.articles.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Articles List */}
              <div className="divide-y divide-border">
                {group.articles.map((article) => (
                  <div
                    key={article._id}
                    className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {article.title}
                        </p>
                        {article.isPublished ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                            <Eye className="h-3 w-3" />{" "}
                            Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                            <EyeOff className="h-3 w-3" />{" "}
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {truncate(article.content)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created{" "}
                        {formatDate(article.createdAt)}
                        {article.order != null &&
                          ` · Order: ${article.order}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          handleEditArticle(article)
                        }
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteArticleId(article._id)
                        }
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-error-muted hover:text-error"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {searchQuery
              ? "No articles match your search"
              : "No articles yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            Select a career path above and create your first
            article
          </p>
        </div>
      )}

      {/* Article Editor Modal */}
      {editorOpen && (
        <ArticleEditor
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setEditingArticle(null);
          }}
          onSuccess={() => {}}
          filterOptionId={
            (editingArticle?.filterOptionId ??
              selectedFilterId) as Id<"FilterOption">
          }
          filterOptionName={
            editingArticle?.filterOptionName ??
            filters?.find((f) => f._id === selectedFilterId)
              ?.name ??
            "Unknown"
          }
          article={editingArticle}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteArticleId !== null}
        onClose={() => setDeleteArticleId(null)}
        onConfirm={handleDelete}
        title="Delete Article"
        description="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete Article"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
