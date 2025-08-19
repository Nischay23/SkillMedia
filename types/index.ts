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
  
  // Engagement counters
  likes?: number;
  comments?: number;
};

export type CommunityPost = {
  _id: Id<"communityPosts">;
  userId: Id<"users">;
  content: string;
  imageUrl?: string;
  storageId?: Id<"_storage">;
  linkedFilterOptionIds: Id<"FilterOption">[];
  
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
