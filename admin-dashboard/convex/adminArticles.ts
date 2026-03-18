import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAdmin } from "./adminAuth";

// Get published articles for a specific career path (public query)
export const getArticlesByFilterOption = query({
  args: {
    filterOptionId: v.id("FilterOption"),
  },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("adminArticles")
      .withIndex("by_filter_option", (q) =>
        q.eq("filterOptionId", args.filterOptionId)
      )
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // Sort by order field (nulls last), then by createdAt
    return articles.sort((a, b) => {
      const orderA = a.order ?? Infinity;
      const orderB = b.order ?? Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return a.createdAt - b.createdAt;
    });
  },
});

// Get all articles (admin only — includes unpublished)
export const getAllArticles = query({
  args: {},
  handler: async (ctx) => {
    await getAdmin(ctx);
    const articles = await ctx.db.query("adminArticles").collect();

    // Fetch filter option names for display
    const articlesWithFilterNames = await Promise.all(
      articles.map(async (article) => {
        const filterOption = await ctx.db.get(article.filterOptionId);
        return {
          ...article,
          filterOptionName: filterOption?.name ?? "Unknown",
        };
      })
    );

    return articlesWithFilterNames;
  },
});

// Create a new article (admin only)
export const createArticle = mutation({
  args: {
    filterOptionId: v.id("FilterOption"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAdmin(ctx);

    if (!args.title.trim()) {
      throw new Error("Title cannot be empty");
    }

    const now = Date.now();
    const articleId = await ctx.db.insert("adminArticles", {
      filterOptionId: args.filterOptionId,
      title: args.title.trim(),
      content: args.content.trim(),
      authorId: userId,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    });

    return { _id: articleId };
  },
});

// Update an existing article (admin only)
export const updateArticle = mutation({
  args: {
    articleId: v.id("adminArticles"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAdmin(ctx);

    const article = await ctx.db.get(args.articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    if (args.title !== undefined && !args.title.trim()) {
      throw new Error("Title cannot be empty");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.content !== undefined) updates.content = args.content.trim();
    if (args.isPublished !== undefined) updates.isPublished = args.isPublished;
    if (args.order !== undefined) updates.order = args.order;

    await ctx.db.patch(args.articleId, updates);
    return { success: true };
  },
});

// Delete an article (admin only)
export const deleteArticle = mutation({
  args: {
    articleId: v.id("adminArticles"),
  },
  handler: async (ctx, args) => {
    await getAdmin(ctx);

    const article = await ctx.db.get(args.articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    await ctx.db.delete(args.articleId);
    return { success: true };
  },
});
