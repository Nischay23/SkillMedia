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
};

export type Post = {
  _id: Id<"posts">;
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
