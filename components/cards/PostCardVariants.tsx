import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { AnimatedLikeButton } from "@/components/ui/AnimatedLikeButton";
import { Typography } from "@/components/ui/Typography";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";

// ── Shared types ──────────────────────────────────────
interface SharedPostProps {
  postId: string;
  authorName: string;
  authorImage?: string;
  imageUrl?: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  saves: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
}

// ── Shared helpers ────────────────────────────────────
const AnimatedPressable =
  Animated.createAnimatedComponent(Pressable);

function useScalePress() {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const onPressIn = () => {
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 400,
      overshootClamping: true,
    });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 300,
      overshootClamping: true,
    });
  };
  return { animatedStyle, onPressIn, onPressOut };
}

function EngagementBar({
  likes,
  comments,
  saves,
  isLiked = false,
  isSaved = false,
  onLike,
  onComment,
  onSave,
}: Pick<
  SharedPostProps,
  | "likes"
  | "comments"
  | "saves"
  | "isLiked"
  | "isSaved"
  | "onLike"
  | "onComment"
  | "onSave"
>) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    bar: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 20,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    item: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
    },
  }));

  return (
    <View style={styles.bar}>
      <AnimatedLikeButton
        isLiked={isLiked}
        count={likes}
        onPress={onLike}
        size={18}
      />

      <Pressable onPress={onComment} style={styles.item}>
        <Ionicons
          name="chatbubble-outline"
          size={18}
          color={theme.colors.textMuted}
        />
        <Typography
          variant="caption"
          color="textMuted"
          weight="medium"
        >
          {comments}
        </Typography>
      </Pressable>

      <Pressable onPress={onSave} style={styles.item}>
        <Ionicons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={18}
          color={isSaved ? theme.colors.primary : theme.colors.textMuted}
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
  );
}

function PostImage({ uri }: { uri?: string }) {
  const s = useThemedStyles((t) => ({
    imageWrapper: {
      width: "100%" as const,
      borderRadius: 12,
      overflow: "hidden" as const,
      marginBottom: 10,
    },
    image: {
      width: "100%" as const,
      height: 200,
      backgroundColor: t.colors.surfaceLight,
    },
  }));

  if (!uri) return null;

  return (
    <View style={s.imageWrapper}>
      <Image
        source={{ uri }}
        style={s.image}
        contentFit="cover"
        placeholder={{ blurhash: "LGFFaXYk^6#M@-5c,1J5@[or[Q6." }}
        cachePolicy="memory-disk"
        recyclingKey={uri}
        transition={300}
      />
    </View>
  );
}

function Avatar({
  uri,
  size,
  fallbackIcon,
}: {
  uri?: string;
  size: number;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}) {
  const { theme } = useTheme();
  const s = useThemedStyles((t) => ({
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: t.colors.surfaceLight,
    },
    placeholder: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: t.colors.primary + "20",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
  }));

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={s.image}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={s.placeholder}>
      <Ionicons
        name={fallbackIcon ?? "person"}
        size={size * 0.5}
        color={theme.colors.primary}
      />
    </View>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. EXPERT POST CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface ExpertPostCardProps extends SharedPostProps {
  tags?: string[];
}

export function ExpertPostCard({
  authorName,
  authorImage,
  imageUrl,
  content,
  createdAt,
  likes,
  comments,
  saves,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onSave,
  tags,
}: ExpertPostCardProps) {
  const { isDark } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } =
    useScalePress();

  const accentColor = isDark ? "#4ECDC4" : "#10B981"; // green/teal

  const styles = useThemedStyles((t) => ({
    wrapper: {
      width: "100%" as const,
    },
    inner: {
      flexDirection: "row" as const,
    },
    accentBar: {
      width: 4,
    },
    body: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: 10,
    },
    headerMeta: {
      flex: 1,
      marginLeft: 10,
    },
    content: {
      marginBottom: 10,
    },
    tagsRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 6,
    },
    tag: {
      backgroundColor: t.colors.primary + "14",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(350)
        .springify()
        .damping(18)}
    >
      <AnimatedPressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.wrapper, animatedStyle]}
      >
        <View style={styles.inner}>
          {/* Left accent bar */}
          <View
            style={[
              styles.accentBar,
              { backgroundColor: accentColor },
            ]}
          />

          <View style={styles.body}>
            {/* Header */}
            <View style={styles.header}>
              <Avatar uri={authorImage} size={32} />

              <View style={styles.headerMeta}>
                <Typography
                  variant="body"
                  weight="semibold"
                  numberOfLines={1}
                >
                  {authorName}
                </Typography>
                <Typography
                  variant="caption"
                  color="textMuted"
                >
                  {createdAt}
                </Typography>
              </View>
            </View>

            {/* Content — larger title-like text */}
            <View style={styles.content}>
              <Typography
                variant="h4"
                weight="bold"
                numberOfLines={4}
              >
                {content}
              </Typography>
            </View>

            {/* Post Image */}
            <PostImage uri={imageUrl} />

            {/* Tags */}
            {tags && tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Typography
                      variant="caption"
                      color="primary"
                      weight="medium"
                    >
                      #{tag}
                    </Typography>
                  </View>
                ))}
              </View>
            )}

            {/* Engagement */}
            <EngagementBar
              likes={likes}
              comments={comments}
              saves={saves}
              isLiked={isLiked}
              isSaved={isSaved}
              onLike={onLike}
              onComment={onComment}
              onSave={onSave}
            />
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. DISCUSSION POST CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface DiscussionPostCardProps extends SharedPostProps {
  reputation?: number;
  answerCount?: number;
  isTrending?: boolean;
  onViewAnswers?: () => void;
}

export function DiscussionPostCard({
  authorName,
  authorImage,
  imageUrl,
  content,
  createdAt,
  likes,
  comments,
  saves,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onSave,
  reputation = 0,
  answerCount = 0,
  isTrending = false,
  onViewAnswers,
}: DiscussionPostCardProps) {
  const { theme, isDark } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } =
    useScalePress();

  const trendingColor = isDark ? "#FFB84D" : "#F59E0B";

  const styles = useThemedStyles((t) => ({
    card: {
      width: "100%" as const,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: 10,
    },
    headerMeta: {
      flex: 1,
      marginLeft: 8,
    },
    nameRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
    repBadge: {
      backgroundColor: t.colors.primary + "18",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    trendingBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 3,
      backgroundColor: trendingColor + "18",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    content: {
      marginBottom: 10,
    },
    answersRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      backgroundColor: t.colors.surfaceLight,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 4,
    },
    answersLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(350)
        .springify()
        .damping(18)}
    >
      <AnimatedPressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, animatedStyle]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Avatar uri={authorImage} size={28} />

          <View style={styles.headerMeta}>
            <View style={styles.nameRow}>
              <Typography
                variant="body"
                weight="semibold"
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                {authorName}
              </Typography>

              {reputation > 0 && (
                <View style={styles.repBadge}>
                  <Typography
                    variant="caption"
                    color="primary"
                    weight="semibold"
                  >
                    ★ {reputation}
                  </Typography>
                </View>
              )}
            </View>

            <Typography variant="caption" color="textMuted">
              {createdAt}
            </Typography>
          </View>

          {isTrending && (
            <View style={styles.trendingBadge}>
              <Ionicons
                name="flame"
                size={13}
                color={trendingColor}
              />
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: trendingColor }}
              >
                Trending
              </Typography>
            </View>
          )}
        </View>

        {/* Question preview — compact, 3 lines */}
        <View style={styles.content}>
          <Typography variant="body" numberOfLines={3}>
            {content}
          </Typography>
        </View>

        {/* Post Image */}
        <PostImage uri={imageUrl} />

        {/* Answer count row */}
        {answerCount > 0 && (
          <Pressable
            onPress={onViewAnswers}
            style={styles.answersRow}
          >
            <View style={styles.answersLeft}>
              <Ionicons
                name="chatbubbles-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Typography
                variant="caption"
                color="primary"
                weight="semibold"
              >
                {answerCount}{" "}
                {answerCount === 1 ? "answer" : "answers"}
              </Typography>
            </View>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.primary}
            />
          </Pressable>
        )}

        {/* Engagement */}
        <EngagementBar
          likes={likes}
          comments={comments}
          saves={saves}
          isLiked={isLiked}
          isSaved={isSaved}
          onLike={onLike}
          onComment={onComment}
          onSave={onSave}
        />
      </AnimatedPressable>
    </Animated.View>
  );
}
