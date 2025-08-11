import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    clerkId: v.string(),
    isAdmin: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),

    // Legacy fields that might exist
    image: v.optional(v.string()),
    followers: v.optional(v.number()),
    following: v.optional(v.number()),
    posts: v.optional(v.number()),
  }).index("by_clerk_id", ["clerkId"]),

  FilterOption: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("qualification"),
      v.literal("category"),
      v.literal("sector"),
      v.literal("subSector"),
      v.literal("branch"),
      v.literal("role")
    ),
    parentId: v.optional(v.id("FilterOption")),
    isActive: v.optional(v.boolean()),
  }).index("by_parentId", ["parentId"]),

  posts: defineTable({
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    filterOptionIds: v.optional(
      v.array(v.id("FilterOption"))
    ),
    sourceUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),

    postType: v.optional(
      v.union(
        v.literal("job"),
        v.literal("skill"),
        v.literal("course")
      )
    ),
    location: v.optional(v.array(v.string())),
    experience: v.optional(v.string()),
    salary: v.optional(v.string()),

    likes: v.optional(v.number()),
    comments: v.optional(v.number()),

    // Legacy fields that might be missing
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),

    // Legacy fields from old schema
    caption: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  })
    .index("by_filterOptionIds", ["filterOptionIds"])
    .index("by_createdAt", ["createdAt"])
    .index("by_postType", ["postType"]),

  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  comments: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
    createdAt: v.number(),
  }).index("by_post", ["postId"]),

  notifications: defineTable({
    receiverId: v.id("users"),
    senderId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("post_new_job"),
      v.literal("admin_message")
    ),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    isRead: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_receiver_read", ["receiverId", "isRead"]),

  savedPosts: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),
});
