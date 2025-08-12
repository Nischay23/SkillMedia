// app/components/Post.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Image } from "expo-image"; // Ensure expo-image is installed
import { Ionicons } from "@expo/vector-icons"; // Ensure @expo/vector-icons is installed

import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";

import { Post as PostType } from "@/types"; // Import your Post type from app/types/index.ts
import { Id } from "@/convex/_generated/dataModel";
// import CommentsModal from './CommentsModal'; // Uncomment if you have this component

interface PostProps {
  post: PostType; // Use the new PostType
}

export default function Post({ post }: PostProps) {
  const { user: clerkUser } = useUser(); // Get current Clerk user data

  // Query if the current user has liked this post
  const isLiked = useQuery(
    api.likes.getIsLiked,
    clerkUser ? { postId: post._id as Id<"posts"> } : "skip"
  );
  // Query if the current user has saved this post
  const isSaved = useQuery(
    api.savedPosts.getIsSaved,
    clerkUser ? { postId: post._id as Id<"posts"> } : "skip"
  );

  // Get current logged-in user's Convex ID and isAdmin status for delete button logic
  const currentUserConvex = useQuery(
    api.users.getUserByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );

  // Mutations for interaction
  const toggleLikeMutation = useMutation(api.posts.toggleLike);
  const toggleSavePostMutation = useMutation(api.savedPosts.toggleSavePost);
  const deletePostMutation = useMutation(api.posts.deletePost); // For admin/owner to delete

  // State for comments modal (if you have one)
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (!clerkUser) {
      console.warn("User not logged in. Cannot like post.");
      // Optionally show a toast/alert to the user
      return;
    }
    try {
      await toggleLikeMutation({ postId: post._id as Id<"posts"> });
      // Convex's useQuery will automatically re-fetch 'isLiked' and 'likes' count
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async () => {
    if (!clerkUser) {
      console.warn("User not logged in. Cannot save post.");
      return;
    }
    try {
      await toggleSavePostMutation({ postId: post._id as Id<"posts"> });
      // 'isSaved' state will automatically re-fetch.
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleDelete = async () => {
    // Only allow delete if current user is an admin AND the creator of the post
    if (
      !clerkUser ||
      !currentUserConvex?.isAdmin ||
      post.createdBy?._id !== currentUserConvex?._id
    ) {
      console.warn(
        "Unauthorized delete attempt: User is not an admin or not the post owner."
      );
      // Optionally show an error message to the user
      return;
    }
    try {
      await deletePostMutation({ postId: post._id as Id<"posts"> });
      // Post will automatically disappear from the feed due to Convex reactivity.
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleSourceLink = () => {
    if (post.sourceUrl) {
      Linking.openURL(post.sourceUrl).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  };

  // Show loader or skip if isLiked/isSaved are still loading
  if (isLiked === undefined || isSaved === undefined) {
    return null; // Or render a small skeleton/placeholder for a moment
  }

  return (
    <View style={styles.postContainer}>
      {/* POST HEADER (Admin Info) */}
      <View style={styles.postHeader}>
        {post.createdBy && ( // Ensure createdBy data is available
          <View style={styles.postHeaderLeft}>
            <Image
              source={
                post.createdBy.profileImage ||
                "https://via.placeholder.com/150/AAAAAA/FFFFFF?text=ADMIN"
              } // Fallback image
              style={styles.postAvatar}
              contentFit="cover"
              transition={200}
            />
            <Text style={styles.postUsername}>
              {post.createdBy.name ||
                post.createdBy.fullname ||
                post.createdBy.username ||
                "Admin"}
            </Text>
          </View>
        )}

        {/* Delete button (only for admin who created the post) */}
        {currentUserConvex?._id === post.createdBy?._id &&
        currentUserConvex?.isAdmin ? (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        ) : (
          // Optional: A placeholder icon or empty view if no other actions are present
          <View style={{ width: 20, height: 20 }} /> // Empty space to keep layout consistent
          // <TouchableOpacity>
          //   <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.gray} />
          // </TouchableOpacity>
        )}
      </View>

      {/* POST IMAGE (e.g., Company Logo, Banner) */}
      {post.imageUrl && (
        <Image
          source={post.imageUrl}
          style={styles.postImage}
          contentFit="cover"
          transition={200}
        />
      )}

      {/* POST MAIN CONTENT */}
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postDescription}>{post.description}</Text>

        {/* New Job/Skill Specific Details */}
        {post.postType && (
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Type:</Text>{" "}
            {post.postType.charAt(0).toUpperCase() + post.postType.slice(1)}
          </Text>
        )}
        {post.location && post.location.length > 0 && (
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Location:</Text>{" "}
            {post.location.join(", ")}
          </Text>
        )}
        {post.experience && (
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Experience:</Text>{" "}
            {post.experience}
          </Text>
        )}
        {post.salary && (
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Salary:</Text> {post.salary}
          </Text>
        )}

        {/* Source Link Button */}
        {post.sourceUrl && (
          <TouchableOpacity
            onPress={handleSourceLink}
            style={styles.sourceLinkButton}
          >
            <Ionicons name="link-outline" size={16} color={COLORS.link} />
            <Text style={styles.sourceLinkText}>Apply/View Source</Text>
          </TouchableOpacity>
        )}

        {/* Filter Tags (e.g., Graduation • Private • IT & Software) */}
        {post.filterOptionNames && post.filterOptionNames.length > 0 && (
          <Text style={styles.filterTags}>
            Tags: {post.filterOptionNames.join(" • ")}
          </Text>
        )}
      </View>

      {/* POST ACTIONS (Like, Comment, Save) */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? COLORS.primary : COLORS.gray}
            />
            <Text style={styles.actionCount}>{post.likes}</Text>
          </TouchableOpacity>
          {/* Comment button - Uncomment if you use CommentsModal */}
          <TouchableOpacity
            /* onPress={() => setShowComments(true)} */ style={
              styles.actionButton
            }
          >
            <Ionicons name="chatbubble-outline" size={22} color={COLORS.gray} />
            <Text style={styles.actionCount}>{post.comments}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isSaved ? COLORS.accent : COLORS.gray}
          />
        </TouchableOpacity>
      </View>

      {/* Comments Modal (if you have one) */}
      {/* <CommentsModal
        postId={post._id}
        visible={showComments}
        onClose={() => setShowComments(false)}
      /> */}
    </View>
  );
}

// --- Styles for Post Component ---
const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 15,
    overflow: "hidden", // Ensures image corners are rounded
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingBottom: 10,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  postAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
    backgroundColor: COLORS.lightGray, // Placeholder background
  },
  postUsername: {
    fontWeight: "bold",
    color: COLORS.white,
    fontSize: 16,
  },
  postImage: {
    width: "100%",
    aspectRatio: 16 / 9, // Common aspect ratio for banners/logos
    backgroundColor: COLORS.darkGray, // Placeholder for loading image
  },
  postContent: {
    padding: 15,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    color: COLORS.gray, // Readable on card background
    marginBottom: 10,
    lineHeight: 20,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.gray, // Readable on card background
    marginBottom: 3,
  },
  detailLabel: {
    fontWeight: "bold",
    color: COLORS.white, // Ensure label is white
  },
  sourceLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: COLORS.headerBackground, // A subtle background for the link button
    borderRadius: 5,
    alignSelf: "flex-start", // Only take as much width as needed
  },
  sourceLinkText: {
    color: COLORS.link, // Link color
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "bold",
  },
  filterTags: {
    fontSize: 12,
    color: COLORS.gray, // Readable on card background
    marginTop: 10,
    fontStyle: "italic",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.lightGray, // Subtle divider
    paddingTop: 10,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  postActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionCount: {
    marginLeft: 5,
    color: COLORS.white, // White text for counts
    fontSize: 14,
  },
});
