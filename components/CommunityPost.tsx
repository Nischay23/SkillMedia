// components/CommunityPost.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState, useEffect, memo } from "react";
import {
  Alert,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";

import { AnimatedLikeButton } from "@/components/ui/AnimatedLikeButton";
import { Typography } from "@/components/ui/Typography";
import { useToast } from "@/components/ui/Toast";
import {
  SpacingValues,
  CardSpacing,
} from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { CommunityPost as CommunityPostType } from "@/types";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";

interface CommunityPostProps {
  post: CommunityPostType;
  onOpenComments?: () => void;
}

function CommunityPostComponent({
  post,
  onOpenComments,
}: CommunityPostProps) {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const { showToast } = useToast();
  const [showFullContent, setShowFullContent] =
    useState(false);

  // ── Optimistic like state ───────────────────────────
  // Keep a local copy so UI updates instantly without waiting
  // for the feed query to re-run.
  const isLikedQuery = useQuery(
    api.likes.getIsLiked,
    clerkUser ? { communityPostId: post._id } : "skip",
  );
  const [optimisticLiked, setOptimisticLiked] = useState<
    boolean | null
  >(null);
  const [optimisticCount, setOptimisticCount] = useState(
    post.likes ?? 0,
  );

  // Sync optimistic state once the real query resolves
  useEffect(() => {
    if (isLikedQuery !== undefined) {
      setOptimisticLiked(isLikedQuery);
    }
  }, [isLikedQuery]);

  // Keep count in sync if feed refreshes
  useEffect(() => {
    setOptimisticCount(post.likes ?? 0);
  }, [post.likes]);

  // ── Other queries ───────────────────────────────────
  const isSavedQuery = useQuery(
    api.savedContent.getIsSaved,
    clerkUser ? { communityPostId: post._id } : "skip",
  );
  // Optimistic save state — flip instantly, revert on error
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const isSaved = optimisticSaved ?? isSavedQuery === true;

  // Sync optimistic saved if server state changes
  useEffect(() => {
    if (isSavedQuery !== undefined) setOptimisticSaved(isSavedQuery);
  }, [isSavedQuery]);

  const currentUserConvex = useQuery(
    api.users.getUserByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip",
  );

  // ── Mutations ───────────────────────────────────────
  const toggleLikeMutation = useMutation(
    api.likes.toggleLike,
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

    // Optimistic update — flip state & count immediately
    const wasLiked = optimisticLiked === true;
    setOptimisticLiked(!wasLiked);
    setOptimisticCount((c) =>
      wasLiked ? Math.max(0, c - 1) : c + 1,
    );

    try {
      await toggleLikeMutation({
        communityPostId: post._id,
      });
    } catch (error) {
      // Revert on error
      setOptimisticLiked(wasLiked);
      setOptimisticCount((c) =>
        wasLiked ? c + 1 : Math.max(0, c - 1),
      );
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async () => {
    if (!clerkUser) return;
    const wasSaved = isSaved;
    // Optimistic: flip immediately
    setOptimisticSaved(!wasSaved);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await toggleSaveMutation({
        communityPostId: post._id,
      });
      showToast(
        wasSaved ? "Removed from saved" : "Post saved!",
        wasSaved ? "info" : "success",
        2000,
      );
    } catch {
      // Revert on error
      setOptimisticSaved(wasSaved);
      showToast("Couldn't save post. Try again.", "error");
    }
  };

  const handleDelete = () => {
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
              showToast("Post deleted", "info", 2000);
            } catch {
              showToast(
                "Couldn't delete post. Try again.",
                "error",
              );
            }
          },
        },
      ],
    );
  };

  const canDeletePost = () => {
    if (!currentUserConvex) return false;
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

  // ── Styles ──────────────────────────────────────────
  const styles = useThemedStyles((t) => ({
    card: {
      width: "100%" as const,
      borderLeftWidth: 4,
      borderLeftColor: t.colors.primary,
      paddingBottom: 16,
    },
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
      borderWidth: 1.5,
      borderColor: t.colors.primary + "33",
    },
    avatarPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
      backgroundColor: t.colors.primary + "20",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 1.5,
      borderColor: t.colors.primary + "33",
    },
    headerMeta: { flex: 1 },
    deleteButton: { padding: 6 },
    separator: {
      height: 1,
      backgroundColor: t.colors.border,
      marginBottom: CardSpacing.gap,
      marginHorizontal: 16,
    },
    titleContainer: {
      marginBottom: 6,
      paddingHorizontal: 16,
    },
    content: {
      marginBottom: CardSpacing.gap,
      paddingHorizontal: 16,
    },
    // Image: simple approach — show placeholder until loaded, then swap
    imageWrapper: {
      overflow: "hidden" as const,
      marginBottom: CardSpacing.gap,
      backgroundColor: t.colors.surfaceLight,
      width: "100%" as const,
      aspectRatio: 16 / 9,
    },
    postImage: {
      width: "100%" as const,
      height: "100%" as const,
    },
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

  const authorName =
    post.user?.fullname ||
    post.user?.username ||
    "Anonymous";

  // The real liked state: optimistic if set, else query result
  const displayLiked =
    optimisticLiked ?? isLikedQuery === true;

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {post.user?.profileImage ? (
          <Image
            source={{ uri: post.user.profileImage }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={post.user.profileImage}
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

      {/* ── Body ── */}
      <View style={styles.content}>
        <Typography variant="body" color="text">
          {showFullContent
            ? post.content
            : truncateContent(post.content)}
        </Typography>
        {post.content.length > 200 && (
          <Pressable
            onPress={() => setShowFullContent((v) => !v)}
            style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4, marginTop: SpacingValues.xs }}
          >
            <Typography
              variant="body"
              color="primary"
              weight="medium"
            >
              {showFullContent ? "Show less" : "Read more"}
            </Typography>
            <Ionicons
              name={showFullContent ? "chevron-up" : "chevron-down"}
              size={14}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
      </View>

      {/* ── Image ── */}
      {/* FIX: use a simple wrapper with fixed aspect ratio.
          expo-image handles its own loading state internally.
          No more invisible-image bug from stacked absolute positioning. */}
      {post.imageUrl ? (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={post._id}
            // Show a blurhash placeholder while loading
            placeholder={{
              blurhash: "LGFFaXYk^6#M@-5c,1J5@[or[Q6.",
            }}
            transition={300}
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
          isLiked={displayLiked}
          count={optimisticCount}
          onPress={handleLike}
          size={20}
        />

        <Pressable
          onPress={onOpenComments}
          style={styles.engagementItem}
          hitSlop={10}
        >
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
          hitSlop={10}
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

// Memoize to prevent unnecessary re-renders when parent updates
const CommunityPost = memo(CommunityPostComponent);
export default CommunityPost;
