import { Id } from "@/convex/_generated/dataModel";

export type FilterOption = {
  _id: Id<"FilterOption">;
  name: string;
  type:
    | "qualification"
    | "category"
    | "sector"
    | "subSector"
    | "branch"
    | "role";
  parentId: Id<"FilterOption"> | null;
  isActive?: boolean;

  // NEW: Career content fields
  description?: string;
  requirements?: string;
  avgSalary?: string;
  relevantExams?: string;
  image?: string;

  // Ranking & vacancy data
  ranking?: number | null;
  annualVacancies?: number | null;

  // Engagement counters
  likes?: number;
  comments?: number;
};

export type CommunityPost = {
  _id: Id<"communityPosts">;
  userId: Id<"users">;

  // Content fields
  title: string;
  content: string;
  imageUrl?: string;
  storageId?: Id<"_storage">;
  linkedFilterOptionIds: Id<"FilterOption">[];

  // Status workflow
  status: "draft" | "published";
  publishedAt?: number;

  // Engagement counters
  likes: number;
  comments: number;
  createdAt: number;
  updatedAt: number;
  isActive?: boolean;

  // Populated fields
  user?: {
    _id: Id<"users">;
    username?: string;
    fullname?: string;
    profileImage?: string;
    isAdmin?: boolean;
  } | null;
  linkedFilterOptionNames?: string[];
};

export type Post = {
  _id: Id<"communityPosts">; // Updated to use communityPosts
  title: string;
  description: string;
  filterOptionIds: Id<"FilterOption">[];
  sourceUrl?: string;
  imageUrl?: string;
  postType: "job" | "skill" | "course";
  location?: string[];
  experience?: string;
  salary?: string;
  likes: number;
  comments: number;
  createdBy: {
    _id: Id<"users">;
    username?: string;
    fullname?: string;
    name?: string;
    profileImage?: string;
  } | null;
  filterOptionNames?: string[];
  createdAt: number;
  updatedAt: number;
  isActive?: boolean;
};

export type Comment = {
  _id: Id<"comments">;
  userId: Id<"users">;
  content: string;
  parentCommentId?: Id<"comments">;
  communityPostId?: Id<"communityPosts">;
  filterOptionId?: Id<"FilterOption">;
  createdAt: number;

  // Populated fields
  user?: {
    _id: Id<"users">;
    username?: string;
    fullname?: string;
    profileImage?: string;
  } | null;
};

export type Like = {
  _id: Id<"likes">;
  userId: Id<"users">;
  communityPostId?: Id<"communityPosts">;
  filterOptionId?: Id<"FilterOption">;
  createdAt?: number;
};

export type SavedContent = {
  _id: Id<"savedContent">;
  userId: Id<"users">;
  communityPostId?: Id<"communityPosts">;
  filterOptionId?: Id<"FilterOption">;
  createdAt: number;
};

// ===========================================
// PHASE 3: CAREER ROADMAPS TYPES
// ===========================================

export type RoadmapDifficulty = "beginner" | "intermediate" | "advanced";

export type RoadmapContentType = "video" | "article" | "practice" | "quiz" | "project";

export type Roadmap = {
  _id: Id<"roadmaps">;
  groupId: Id<"groups">;
  filterOptionId?: Id<"FilterOption">;
  title: string;
  description?: string;
  totalSteps: number;
  estimatedDays?: number;
  difficulty?: RoadmapDifficulty;
  isPublished: boolean;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
};

export type RoadmapWithDetails = Roadmap & {
  groupName?: string;
  filterOptionName?: string;
  milestones: MilestoneWithSteps[];
  completedSteps: number;
  progressPercent: number;
};

export type Milestone = {
  _id: Id<"milestones">;
  roadmapId: Id<"roadmaps">;
  title: string;
  description?: string;
  order: number;
  stepCount: number;
  createdAt: number;
  updatedAt: number;
};

export type MilestoneWithSteps = Milestone & {
  steps: RoadmapStepWithProgress[];
  totalSteps: number;
  completedSteps: number;
  isCompleted: boolean;
};

export type RoadmapStep = {
  _id: Id<"roadmapSteps">;
  milestoneId: Id<"milestones">;
  roadmapId: Id<"roadmaps">;
  title: string;
  description?: string;
  order: number;
  resourceUrl?: string;
  contentType?: RoadmapContentType;
  estimatedMinutes?: number;
  createdAt: number;
  updatedAt: number;
};

export type RoadmapStepWithProgress = RoadmapStep & {
  isCompleted: boolean;
};

export type UserRoadmapProgress = {
  _id: Id<"userRoadmapProgress">;
  userId: Id<"users">;
  roadmapId: Id<"roadmaps">;
  stepId: Id<"roadmapSteps">;
  completedAt: number;
};

export type RoadmapProgressSummary = {
  completed: number;
  total: number;
  percent: number;
};

export type MyRoadmapProgress = {
  roadmapId: string;
  title: string;
  groupName: string;
  completed: number;
  total: number;
  percent: number;
};

export type RoadmapStats = {
  usersStarted: number;
  totalGroupMembers: number;
  avgCompletion: number;
  totalProgress: number;
};

