// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Users table: For user profiles
  users: defineTable({
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    clerkId: v.string(),
    isAdmin: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    // Temporary fields for migration
    image: v.optional(v.string()),
    followers: v.optional(v.number()),
    following: v.optional(v.number()),
    posts: v.optional(v.number()),
  }).index("by_clerk_id", ["clerkId"]),

  // 2. FilterOption table: Stores career path definitions and their own engagement
  FilterOption: defineTable({
    name: v.string(), // "Frontend Development"
    type: v.union(
      v.literal("qualification"),
      v.literal("category"),
      v.literal("sector"),
      v.literal("subSector"),
      v.literal("branch"),
      v.literal("role")
    ),
    parentId: v.optional(v.id("FilterOption")),

    // NEW: Descriptive content for the career path itself
    description: v.optional(v.string()),
    requirements: v.optional(v.string()),
    avgSalary: v.optional(v.string()),
    relevantExams: v.optional(v.string()),
    image: v.optional(v.string()), // An image for the path/sector

    // Engagement counters for the career path definition
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  }).index("by_parentId", ["parentId"]),

  // 3. communityPosts table: For user-generated content linked to career paths
  communityPosts: defineTable({
    userId: v.id("users"),

    // Content fields
    title: v.string(), // Post title (required)
    content: v.string(), // Post body content
    imageUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    linkedFilterOptionIds: v.array(v.id("FilterOption")),

    // Status workflow
    status: v.union(
      v.literal("draft"),
      v.literal("published")
    ),
    publishedAt: v.optional(v.number()), // When first published

    // Engagement counters
    likes: v.number(),
    comments: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.optional(v.boolean()),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_published_at", ["publishedAt"])
    .index("by_linked_filter_option", [
      "linkedFilterOptionIds",
    ]),

  // 4. likes table: Tracks likes on BOTH career paths and community posts
  likes: defineTable({
    userId: v.id("users"),
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
    createdAt: v.optional(v.number()),
    // Temporary field for migration - will be removed
    postId: v.optional(v.string()),
  })
    .index("by_community_post", ["communityPostId"])
    .index("by_filter_option", ["filterOptionId"])
    .index("by_user_and_community_post", [
      "userId",
      "communityPostId",
    ])
    .index("by_user_and_filter_option", [
      "userId",
      "filterOptionId",
    ])
    .index("by_user", ["userId"]),

  // 5. comments table: For both career paths and community posts
  comments: defineTable({
    userId: v.id("users"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
    createdAt: v.number(),
    // Temporary field for migration - will be removed
    postId: v.optional(v.string()),
  })
    .index("by_community_post", ["communityPostId"])
    .index("by_filter_option", ["filterOptionId"])
    .index("by_parent", ["parentCommentId"]),

  // 6. notifications table: Updated for the hybrid model
  notifications: defineTable({
    receiverId: v.id("users"),
    senderId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow")
    ),
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
    commentId: v.optional(v.id("comments")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_sender", ["senderId"]),

  // 7. savedContent table: For saving both career paths and community posts
  savedContent: defineTable({
    userId: v.id("users"),
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_community_post", [
      "userId",
      "communityPostId",
    ])
    .index("by_user_and_filter_option", [
      "userId",
      "filterOptionId",
    ]),
});
