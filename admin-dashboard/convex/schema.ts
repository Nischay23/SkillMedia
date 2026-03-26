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
      v.literal("role"),
    ),
    parentId: v.optional(v.id("FilterOption")),

    // NEW: Descriptive content for the career path itself
    description: v.optional(v.string()),
    requirements: v.optional(v.string()),
    avgSalary: v.optional(v.string()),
    relevantExams: v.optional(v.string()),
    image: v.optional(v.string()), // An image for the path/sector

    // Ranking & vacancy data
    ranking: v.optional(v.number()), // Position by job demand (1 = highest)
    annualVacancies: v.optional(v.number()), // Approximate openings per year

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
      v.literal("published"),
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
      v.literal("follow"),
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

  // 8. adminArticles table: Admin-posted articles/tips linked to career paths
  adminArticles: defineTable({
    filterOptionId: v.id("FilterOption"), // Which career path this belongs to
    title: v.string(), // Article title
    content: v.string(), // Article body (markdown)
    authorId: v.id("users"), // Admin who wrote it
    order: v.optional(v.number()), // Display order
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_filter_option", ["filterOptionId"]),

  // 9. groups table: Community groups linked to career paths
  groups: defineTable({
    filterOptionId: v.id("FilterOption"),
    name: v.string(),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    memberCount: v.number(),
    messageCount: v.optional(v.number()),
    createdBy: v.id("users"),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_filter_option", ["filterOptionId"])
    .index("by_active", ["isActive"]),

  // 10. groupMembers table: Tracks group membership
  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("moderator"), v.literal("member")),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_and_user", ["groupId", "userId"]),

  // 11. messages table: Group chat messages
  messages: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("announcement"),
      v.literal("image"),
    ),
    // Image message fields
    storageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    // Reactions
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          userId: v.id("users"),
        }),
      ),
    ),
    isPinned: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_group_and_created", [
      "groupId",
      "createdAt",
    ]),

  // 12. reports table: Message reports
  reports: defineTable({
    reporterId: v.id("users"),
    messageId: v.id("messages"),
    groupId: v.id("groups"),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("dismissed"),
    ),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_status", ["status"])
    .index("by_message", ["messageId"])
    .index("by_reporter_and_message", [
      "reporterId",
      "messageId",
    ]),

  // ===========================================
  // PHASE 3: CAREER ROADMAPS
  // ===========================================

  // 13. roadmaps table: Career learning roadmaps for groups
  roadmaps: defineTable({
    groupId: v.id("groups"),
    filterOptionId: v.optional(v.id("FilterOption")),
    title: v.string(),
    description: v.optional(v.string()),
    totalSteps: v.number(),
    estimatedDays: v.optional(v.number()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
      ),
    ),
    isPublished: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_filter_option", ["filterOptionId"])
    .index("by_published", ["isPublished"]),

  // 14. milestones table: Major sections within a roadmap
  milestones: defineTable({
    roadmapId: v.id("roadmaps"),
    title: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    stepCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_roadmap", ["roadmapId"]),

  // 15. roadmapSteps table: Individual learning steps within milestones
  roadmapSteps: defineTable({
    milestoneId: v.id("milestones"),
    roadmapId: v.id("roadmaps"),
    title: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    resourceUrl: v.optional(v.string()),
    contentType: v.optional(
      v.union(
        v.literal("video"),
        v.literal("article"),
        v.literal("practice"),
        v.literal("quiz"),
        v.literal("project"),
      ),
    ),
    estimatedMinutes: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_milestone", ["milestoneId"])
    .index("by_roadmap", ["roadmapId"]),

  // 16. userRoadmapProgress table: Track user progress on roadmap steps
  userRoadmapProgress: defineTable({
    userId: v.id("users"),
    roadmapId: v.id("roadmaps"),
    stepId: v.id("roadmapSteps"),
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_roadmap", ["roadmapId"])
    .index("by_user_and_roadmap", ["userId", "roadmapId"])
    .index("by_user_and_step", ["userId", "stepId"]),

  // ===========================================
  // PHASE 4: QUIZZES, TESTS & ENGAGEMENT
  // ===========================================

  // 17. quizzes table: Quiz definitions for groups
  quizzes: defineTable({
    groupId: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    timeLimit: v.optional(v.number()),
    passingScore: v.optional(v.number()),
    isPublished: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_group", ["groupId"]),

  // 18. questions table: Quiz questions
  questions: defineTable({
    quizId: v.id("quizzes"),
    text: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    explanation: v.optional(v.string()),
    order: v.number(),
  }).index("by_quiz", ["quizId"]),

  // 19. quizAttempts table: User quiz attempts and scores
  quizAttempts: defineTable({
    quizId: v.id("quizzes"),
    userId: v.id("users"),
    answers: v.array(v.number()),
    score: v.number(),
    totalQuestions: v.number(),
    timeTaken: v.optional(v.number()),
    completedAt: v.number(),
  })
    .index("by_quiz", ["quizId"])
    .index("by_user", ["userId"])
    .index("by_quiz_and_user", ["quizId", "userId"]),

  // 20. challenges table: Group challenges
  challenges: defineTable({
    groupId: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("quiz"), v.literal("steps"), v.literal("streak")),
    targetValue: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_group", ["groupId"]),

  // 21. challengeSubmissions table: User challenge submissions
  challengeSubmissions: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    value: v.number(),
    completedAt: v.optional(v.number()),
    isCompleted: v.boolean(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"]),

  // 22. streaks table: User activity streaks
  streaks: defineTable({
    userId: v.id("users"),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActiveDate: v.string(),
    totalActiveDays: v.number(),
  }).index("by_user", ["userId"]),
});
