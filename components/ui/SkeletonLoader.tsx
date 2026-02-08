/**
 * SkeletonLoader — Shimmer placeholders for loading states.
 *
 * Exports:
 *   <SkeletonText />          – single animated bar
 *   <SkeletonPostCard />      – mimics a post card layout
 *   <SkeletonCareerCard />    – mimics the career hero card
 *   <FeedSkeletonLoader />    – 3 post-card skeletons stacked
 *   <FilteredFeedSkeleton />  – career card + 2 post-card skeletons
 */
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import {
  CARD_BORDER_RADIUS,
  CARD_PADDING,
} from "@/constants/CardStyles";
import { useTheme } from "@/providers/ThemeProvider";

// ── Constants ────────────────────────────────────────────
const SHIMMER_DURATION = 1500;

// ── Shimmer wrapper ──────────────────────────────────────
function Shimmer({
  style,
}: {
  style?: ViewStyle | ViewStyle[];
}) {
  const { isDark } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [-200, 200],
        ),
      },
    ],
  }));

  const baseColor = isDark ? "#202329" : "#E8E8EE";
  const highlightColor = isDark ? "#2D3139" : "#F5F5FA";

  return (
    <View style={[styles.shimmerContainer, style]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, animatedStyle]}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

// ── SkeletonText ─────────────────────────────────────────
export interface SkeletonTextProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonText({
  width = "100%",
  height = 12,
  borderRadius = 6,
  style,
}: SkeletonTextProps) {
  return (
    <Shimmer
      style={{
        width: width as ViewStyle["width"],
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

// ── SkeletonPostCard ─────────────────────────────────────
export function SkeletonPostCard() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: CARD_BORDER_RADIUS,
          padding: CARD_PADDING,
        },
      ]}
    >
      {/* Header: avatar + name & date */}
      <View style={styles.postHeader}>
        <Shimmer style={styles.avatar} />
        <View style={styles.headerMeta}>
          <SkeletonText width="55%" height={12} />
          <SkeletonText
            width="30%"
            height={10}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>

      {/* Content lines */}
      <View style={styles.contentBlock}>
        <SkeletonText width="100%" height={13} />
        <SkeletonText
          width="90%"
          height={13}
          style={{ marginTop: 8 }}
        />
        <SkeletonText
          width="70%"
          height={13}
          style={{ marginTop: 8 }}
        />
      </View>

      {/* Image placeholder */}
      <Shimmer
        style={{
          width: "100%" as unknown as number,
          height: 160,
          borderRadius: 12,
          marginTop: 14,
        }}
      />

      {/* Engagement row */}
      <View style={styles.engagementRow}>
        <Shimmer style={styles.engagementPill} />
        <Shimmer style={styles.engagementPill} />
        <Shimmer style={styles.engagementPill} />
      </View>
    </View>
  );
}

// ── SkeletonCareerCard ───────────────────────────────────
export function SkeletonCareerCard() {
  return (
    <Shimmer
      style={{
        width: "100%" as unknown as number,
        height: 280,
        borderRadius: CARD_BORDER_RADIUS,
      }}
    />
  );
}

// ── Compound: Feed skeleton (explore) ────────────────────
export function FeedSkeletonLoader({
  count = 3,
}: {
  count?: number;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        backgroundColor: theme.colors.background,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{ marginBottom: theme.spacing.lg }}
        >
          <SkeletonPostCard />
        </View>
      ))}
    </View>
  );
}

// ── Compound: Filtered feed skeleton ─────────────────────
export function FilteredFeedSkeleton() {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Hero card placeholder */}
      <View style={{ marginBottom: theme.spacing.xl }}>
        <SkeletonCareerCard />
      </View>

      {/* Section header placeholder */}
      <SkeletonText
        width="45%"
        height={14}
        style={{ marginBottom: theme.spacing.lg }}
      />

      {/* Two post card placeholders */}
      <View style={{ marginBottom: theme.spacing.lg }}>
        <SkeletonPostCard />
      </View>
      <SkeletonPostCard />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  shimmerContainer: {
    overflow: "hidden",
    backgroundColor: "#E8E8EE", // overridden by theme in Shimmer
  },
  gradient: {
    width: 400,
    height: "100%",
  },
  card: {
    // shadow will come from the card system; skeleton keeps it simple
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerMeta: {
    flex: 1,
    marginLeft: 10,
  },
  contentBlock: {
    marginTop: 2,
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
  },
  engagementPill: {
    width: 48,
    height: 20,
    borderRadius: 10,
  },
});
