/**
 * AnimatedLikeButton — Heart icon with spring scale, colour flip,
 * particle burst and haptic feedback.
 *
 * Usage:
 *   <AnimatedLikeButton isLiked={liked} count={42} onPress={toggle} />
 */
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Typography } from "@/components/ui/Typography";
import { useTheme } from "@/providers/ThemeProvider";

// ── Constants ────────────────────────────────────────────
const LIKED_COLOR = "#EF4444"; // red-500
const PARTICLE_COUNT = 6;
const PARTICLE_DISTANCE = 22;
const PARTICLE_SIZE = 8;
const PARTICLE_DURATION = 450;

// ── Particle sub-component ──────────────────────────────
function Particle({
  angle,
  trigger,
}: {
  angle: number;
  trigger: Animated.SharedValue<number>;
}) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * PARTICLE_DISTANCE;
  const ty = Math.sin(rad) * PARTICLE_DISTANCE;

  const style = useAnimatedStyle(() => {
    const t = trigger.value; // 0 → 1
    return {
      position: "absolute" as const,
      width: PARTICLE_SIZE,
      height: PARTICLE_SIZE,
      borderRadius: PARTICLE_SIZE / 2,
      backgroundColor: LIKED_COLOR,
      opacity: t > 0 ? 1 - t : 0,
      transform: [
        { translateX: tx * t - PARTICLE_SIZE / 2 },
        { translateY: ty * t - PARTICLE_SIZE / 2 },
        { scale: 1 - t * 0.6 },
      ],
    };
  });

  return <Animated.View style={style} />;
}

// ── Props ────────────────────────────────────────────────
export interface AnimatedLikeButtonProps {
  isLiked: boolean;
  count: number;
  onPress: () => void;
  /** Icon size — default 20 */
  size?: number;
  /** Show count label — default true */
  showCount?: boolean;
}

// ── Component ────────────────────────────────────────────
export function AnimatedLikeButton({
  isLiked,
  count,
  onPress,
  size = 20,
  showCount = true,
}: AnimatedLikeButtonProps) {
  const { theme } = useTheme();

  // Shared values
  const heartScale = useSharedValue(1);
  const countBounce = useSharedValue(0);
  const particleTrigger = useSharedValue(0);

  // Animated transforms
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const countStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: countBounce.value }],
  }));

  // Press handler
  const handlePress = useCallback(() => {
    const liking = !isLiked;

    // Haptic
    if (liking) {
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Medium,
      );
    } else {
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light,
      );
    }

    // Heart scale spring
    heartScale.value = withSequence(
      withSpring(1.35, { damping: 8, stiffness: 500 }),
      withSpring(1, { damping: 10, stiffness: 300 }),
    );

    // Count bounce
    countBounce.value = withSequence(
      withTiming(-4, { duration: 100 }),
      withSpring(0, { damping: 12, stiffness: 400 }),
    );

    // Particle burst (only when liking)
    if (liking) {
      particleTrigger.value = 0;
      particleTrigger.value = withTiming(1, {
        duration: PARTICLE_DURATION,
      });
    }

    onPress();
  }, [
    isLiked,
    onPress,
    heartScale,
    countBounce,
    particleTrigger,
  ]);

  // Particle angles evenly distributed
  const angles = Array.from(
    { length: PARTICLE_COUNT },
    (_, i) => (360 / PARTICLE_COUNT) * i,
  );

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={styles.container}
    >
      {/* Particles layer (behind the heart) */}
      <View style={styles.particleAnchor}>
        {angles.map((angle) => (
          <Particle
            key={angle}
            angle={angle}
            trigger={particleTrigger}
          />
        ))}
      </View>

      {/* Heart icon */}
      <Animated.View style={heartStyle}>
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={size}
          color={
            isLiked ? LIKED_COLOR : theme.colors.textMuted
          }
        />
      </Animated.View>

      {/* Count */}
      {showCount && (
        <Animated.View style={countStyle}>
          <Typography
            variant="caption"
            weight="medium"
            color={isLiked ? "primary" : "textMuted"}
            style={
              isLiked ? { color: LIKED_COLOR } : undefined
            }
          >
            {count}
          </Typography>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  particleAnchor: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    // Positioned behind heart via stacking order
    zIndex: -1,
  },
});
