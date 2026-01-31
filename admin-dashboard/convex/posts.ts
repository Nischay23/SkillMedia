// convex/posts.ts - Backward compatibility layer
import { 
  getCommunityPosts, 
  getCommunityPostsByUser,
  createCommunityPost, 
  deleteCommunityPost, 
  getCommunityPostById,
  getCommunityPostsByFilterOption 
} from "./communityPosts";

// Backward compatibility exports
export const getPosts = getCommunityPosts;
export const getPostsByUser = getCommunityPostsByUser;
export const createPost = createCommunityPost;
export const deletePost = deleteCommunityPost;
export const getPostById = getCommunityPostById;
export const getPostsByFilterOption = getCommunityPostsByFilterOption;
