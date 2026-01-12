// app/components/CommunityPost.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";

import { CommunityPost as CommunityPostType } from "@/types";

interface CommunityPostProps {
  post: CommunityPostType;
}

export default function CommunityPost({
  post,
}: CommunityPostProps) {
  const { user: clerkUser } = useUser();
  const [showFullContent, setShowFullContent] =
    useState(false);

  // Query if the current user has liked this post (temporarily disabled)
  const isLiked = false; // useQuery(api.likes.getIsLiked, clerkUser ? { communityPostId: post._id } : "skip");

  // Query if the current user has saved this post
  const isSaved = useQuery(
    api.savedContent.getIsSaved,
    clerkUser ? { communityPostId: post._id } : "skip"
  );

  // Get current logged-in user for delete permissions
  const currentUserConvex = useQuery(
    api.users.getUserByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );

  // Mutations for interaction (likes temporarily disabled)
  // const toggleLikeMutation = useMutation(api.likes.toggleLike);
  const toggleSaveMutation = useMutation(
    api.savedContent.toggleSave
  );
  const deleteCommunityPostMutation = useMutation(
    api.communityPosts.deleteCommunityPost
  );

  const handleLike = async () => {
    if (!clerkUser) {
      console.warn("User not logged in. Cannot like post.");
      return;
    }
    // TODO: Implement likes functionality when API is available
    console.log("Like functionality coming soon");
  };

  const handleSave = async () => {
    if (!clerkUser) {
      console.warn("User not logged in. Cannot save post.");
      return;
    }
    try {
      await toggleSaveMutation({
        communityPostId: post._id,
      });
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCommunityPostMutation({
                postId: post._id,
              });
            } catch (error) {
              console.error("Error deleting post:", error);
            }
          },
        },
      ]
    );
  };

  const canDeletePost = () => {
    if (!currentUserConvex || !post.user) return false;
    return (
      currentUserConvex._id === post.userId ||
      currentUserConvex.isAdmin
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const truncateContent = (
    content: string,
    maxLength: number = 200
  ) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const renderLinkedPaths = () => {
    if (
      !post.linkedFilterOptionNames ||
      post.linkedFilterOptionNames.length === 0
    ) {
      return null;
    }

    return (
      <View style={styles.linkedPathsContainer}>
        <Text style={styles.linkedPathsLabel}>
          Related to:
        </Text>
        <View style={styles.pathTagsContainer}>
          {post.linkedFilterOptionNames.map(
            (pathName, index) => (
              <View key={index} style={styles.pathTag}>
                <Text style={styles.pathTagText}>
                  {pathName}
                </Text>
              </View>
            )
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with user info and delete button */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {post.user?.profileImage && (
            <Image
              source={{ uri: post.user.profileImage }}
              style={styles.avatar}
              contentFit="cover"
            />
          )}
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {post.user?.fullname ||
                post.user?.username ||
                "Anonymous"}
            </Text>
            <Text style={styles.timestamp}>
              {formatDate(post.createdAt)}
            </Text>
          </View>
        </View>

        {canDeletePost() && (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={COLORS.danger}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Post title (if exists) */}
      {post.title && (
        <View style={styles.titleContainer}>
          <Text style={styles.postTitle}>{post.title}</Text>
        </View>
      )}

      {/* Post content */}
      <View style={styles.content}>
        <Text style={styles.postText}>
          {showFullContent
            ? post.content
            : truncateContent(post.content)}
        </Text>

        {post.content.length > 200 && (
          <TouchableOpacity
            onPress={() =>
              setShowFullContent(!showFullContent)
            }
          >
            <Text style={styles.readMoreText}>
              {showFullContent ? "Show less" : "Read more"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Post image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          contentFit="cover"
        />
      )}

      {/* Linked career paths */}
      {renderLinkedPaths()}

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isLiked && styles.likedButton,
          ]}
          onPress={handleLike}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? COLORS.white : COLORS.gray}
          />
          <Text
            style={[
              styles.actionText,
              isLiked && styles.likedText,
            ]}
          >
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={COLORS.gray}
          />
          <Text style={styles.actionText}>
            {post.comments}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isSaved && styles.savedButton,
          ]}
          onPress={handleSave}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isSaved ? COLORS.white : COLORS.gray}
          />
          <Text
            style={[
              styles.actionText,
              isSaved && styles.savedText,
            ]}
          >
            {isSaved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  readMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: "500",
  },
  postImage: {
    width: "100%",
    height: 250,
    marginBottom: 12,
  },
  linkedPathsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  linkedPathsLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 8,
  },
  pathTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pathTag: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pathTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "500",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  likedButton: {
    backgroundColor: COLORS.primary,
  },
  savedButton: {
    backgroundColor: COLORS.primary,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "500",
  },
  likedText: {
    color: COLORS.white,
  },
  savedText: {
    color: COLORS.white,
  },
});
