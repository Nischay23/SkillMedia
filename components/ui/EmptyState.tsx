/**
 * EmptyState — Reusable centred placeholder with icon, title,
 * description, optional action button, and entrance animation.
 *
 * Usage:
 *   <EmptyState
 *     type="no-posts"
 *     title="Nothing here yet"
 *     description="Be the first to share a post!"
 *     actionLabel="Open Filter"
 *     onAction={() => setShowFilterModal(true)}
 *   />
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { Typography } from "@/components/ui/Typography";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";

// ── Type → icon mapping ──────────────────────────────────
export type EmptyStateType =
  | "no-filters"
  | "no-posts"
  | "no-saved"
  | "no-notifications"
  | "error";

const ICON_MAP: Record<
  EmptyStateType,
  keyof typeof Ionicons.glyphMap
> = {
  "no-filters": "compass-outline",
  "no-posts": "document-text-outline",
  "no-saved": "bookmark-outline",
  "no-notifications": "notifications-outline",
  error: "warning-outline",
};

// ── Props ────────────────────────────────────────────────
export interface EmptyStateProps {
  type: EmptyStateType;
  title: string;
  description: string;
  /** Label for the optional CTA button */
  actionLabel?: string;
  /** Callback when the CTA is pressed */
  onAction?: () => void;
  /** Override the default icon (80 px) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon size — default 80 */
  iconSize?: number;
}

// ── Component ────────────────────────────────────────────
export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  icon,
  iconSize = 80,
}: EmptyStateProps) {
  const { theme } = useTheme();

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: t.spacing["4xl"],
      paddingHorizontal: t.spacing.xl,
    },
    title: {
      marginTop: t.spacing.xl,
    },
    description: {
      marginTop: t.spacing.sm,
      maxWidth: 300,
    },
    action: {
      marginTop: t.spacing.xl,
    },
  }));

  // Gentle pulse animation for the icon
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, [pulse]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.85 + (pulse.value - 1) * 1.5, // subtle opacity shift 0.85–0.97
  }));

  const resolvedIcon = icon ?? ICON_MAP[type];
  const iconColor =
    type === "error"
      ? theme.colors.warning
      : theme.colors.primary + "88";

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      {/* Pulsing icon */}
      <Animated.View style={iconAnimStyle}>
        <Ionicons
          name={resolvedIcon}
          size={iconSize}
          color={iconColor}
        />
      </Animated.View>

      {/* Title */}
      <Typography
        variant="h2"
        color="text"
        weight="bold"
        align="center"
        style={styles.title}
      >
        {title}
      </Typography>

      {/* Description */}
      <Typography
        variant="body"
        color="textMuted"
        align="center"
        style={styles.description}
      >
        {description}
      </Typography>

      {/* Optional CTA */}
      {actionLabel && onAction && (
        <AnimatedButton
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          style={styles.action}
        />
      )}
    </Animated.View>
  );
}
