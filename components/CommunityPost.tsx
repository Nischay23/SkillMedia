// app/components/CommunityPost.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";

import { AnimatedLikeButton } from "@/components/ui/AnimatedLikeButton";
import { Typography } from "@/components/ui/Typography";
import {
  SpacingValues,
  CardSpacing,
  ComponentSpacing,
} from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { CommunityPost as CommunityPostType } from "@/types";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";

interface CommunityPostProps {
  post: CommunityPostType;
}

export default function CommunityPost({
  post,
}: CommunityPostProps) {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [showFullContent, setShowFullContent] =
    useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Check if the post author is an admin
  const postAuthor = useQuery(
    api.users.getUserProfile,
    post.userId ? { id: post.userId } : "skip",
  );
  const isAdminPost = postAuthor?.isAdmin === true;

  // Query if the current user has liked this post (temporarily disabled)
  const isLiked = false;

  // Query if the current user has saved this post
  const isSaved = useQuery(
    api.savedContent.getIsSaved,
    clerkUser ? { communityPostId: post._id } : "skip",
  );

  // Get current logged-in user for delete permissions
  const currentUserConvex = useQuery(
    api.users.getUserByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip",
  );

  const toggleSaveMutation = useMutation(
    api.savedContent.toggleSave,
  );
  const deleteCommunityPostMutation = useMutation(
    api.communityPosts.deleteCommunityPost,
  );

  // ── Handlers ────────────────────────────────────────
  const handleLike = async () => {
    if (!clerkUser) return;
    console.log("Like functionality coming soon");
  };

  const handleSave = async () => {
    if (!clerkUser) return;
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
      ],
    );
  };

  const canDeletePost = () => {
    if (!currentUserConvex || !post.user) return false;
    return (
      currentUserConvex._id === post.userId ||
      currentUserConvex.isAdmin
    );
  };

  // ── Helpers ─────────────────────────────────────────
  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diffH = (now - timestamp) / 3_600_000;
    if (diffH < 1) return `${Math.floor(diffH * 60)}m ago`;
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  };

  const truncateContent = (text: string, max = 200) =>
    text.length <= max ? text : text.slice(0, max) + "…";

  // ── Themed styles ───────────────────────────────────
  const styles = useThemedStyles((t) => ({
    card: {
      width: "100%" as const,
    },

    /* ── Header ─────────────────────────────── */
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: CardSpacing.gap,
      paddingHorizontal: 16,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
      backgroundColor: t.colors.surfaceLight,
    },
    avatarPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
      backgroundColor: t.colors.primary + "20",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    headerMeta: {
      flex: 1,
    },
    deleteButton: {
      padding: 6,
    },
    separator: {
      height: 1,
      backgroundColor: t.colors.border,
      marginBottom: CardSpacing.gap,
      marginHorizontal: 16,
    },

    /* ── Content ────────────────────────────── */
    titleContainer: {
      marginBottom: 6,
      paddingHorizontal: 16,
    },
    content: {
      marginBottom: CardSpacing.gap,
      paddingHorizontal: 16,
    },

    /* ── Image ──────────────────────────────── */
    imageWrapper: {
      overflow: "hidden" as const,
      marginBottom: CardSpacing.gap,
      backgroundColor: t.colors.surfaceLight,
    },
    postImage: {
      width: "100%" as const,
      aspectRatio: 16 / 9,
    },
    imagePlaceholder: {
      width: "100%" as const,
      aspectRatio: 16 / 9,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: t.colors.surfaceLight,
    },

    /* ── Linked paths ───────────────────────── */
    linkedPaths: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 6,
      marginBottom: CardSpacing.gap,
      paddingHorizontal: 16,
    },
    pathTag: {
      backgroundColor: t.colors.primary + "14",
      paddingHorizontal: 10,
      paddingVertical: SpacingValues.xs,
      borderRadius: 12,
    },

    /* ── Engagement bar ─────────────────────── */
    engagementBar: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      paddingTop: CardSpacing.gap,
      gap: SpacingValues.lg,
      paddingHorizontal: 16,
    },
    engagementItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
    },
  }));

  // ── Render ──────────────────────────────────────────
  const authorName =
    post.user?.fullname ||
    post.user?.username ||
    "Anonymous";

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {post.user?.profileImage ? (
          <Image
            source={{ uri: post.user.profileImage }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="person"
              size={18}
              color={theme.colors.primary}
            />
          </View>
        )}

        <View style={styles.headerMeta}>
          <Typography
            variant="body"
            weight="semibold"
            numberOfLines={1}
          >
            {authorName}
          </Typography>
          <Typography variant="caption" color="textMuted">
            {formatDate(post.createdAt)}
          </Typography>
        </View>

        {canDeletePost() && (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Separator ── */}
      <View style={styles.separator} />

      {/* ── Title ── */}
      {post.title ? (
        <View style={styles.titleContainer}>
          <Typography variant="h3" weight="bold">
            {post.title}
          </Typography>
        </View>
      ) : null}

      {/* ── Body text ── */}
      <View style={styles.content}>
        <Typography variant="body" color="text">
          {showFullContent
            ? post.content
            : truncateContent(post.content)}
        </Typography>

        {post.content.length > 200 && (
          <Pressable
            onPress={() =>
              setShowFullContent(!showFullContent)
            }
          >
            <Typography
              variant="body"
              color="primary"
              weight="medium"
              style={{ marginTop: SpacingValues.xs }}
            >
              {showFullContent ? "Show less" : "Read more"}
            </Typography>
          </Pressable>
        )}
      </View>

      {/* ── Image ── */}
      {post.imageUrl ? (
        <View style={styles.imageWrapper}>
          {imageLoading && (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={28}
                color={theme.colors.textMuted}
              />
            </View>
          )}
          <Image
            source={{ uri: post.imageUrl }}
            style={[
              styles.postImage,
              imageLoading && {
                position: "absolute",
                opacity: 0,
              },
            ]}
            contentFit="cover"
            onLoad={() => setImageLoading(false)}
          />
        </View>
      ) : null}

      {/* ── Linked career paths ── */}
      {post.linkedFilterOptionNames &&
        post.linkedFilterOptionNames.length > 0 && (
          <View style={styles.linkedPaths}>
            {post.linkedFilterOptionNames.map((name, i) => (
              <View key={i} style={styles.pathTag}>
                <Typography
                  variant="caption"
                  color="primary"
                  weight="medium"
                >
                  {name}
                </Typography>
              </View>
            ))}
          </View>
        )}

      {/* ── Engagement bar ── */}
      <View style={styles.engagementBar}>
        <AnimatedLikeButton
          isLiked={isLiked === true}
          count={post.likes}
          onPress={handleLike}
          size={20}
        />

        <Pressable style={styles.engagementItem}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={theme.colors.textMuted}
          />
          <Typography
            variant="caption"
            color="textMuted"
            weight="medium"
          >
            {post.comments}
          </Typography>
        </Pressable>

        <Pressable
          onPress={handleSave}
          style={styles.engagementItem}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={
              isSaved
                ? theme.colors.primary
                : theme.colors.textMuted
            }
          />
          <Typography
            variant="caption"
            color={isSaved ? "primary" : "textMuted"}
            weight="medium"
          >
            {isSaved ? "Saved" : "Save"}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}
