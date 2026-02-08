import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Typography } from "@/components/ui/Typography";
import { useThemedStyles } from "@/providers/ThemeProvider";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  labels,
}: ProgressBarProps) {
  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const fraction = Math.min(
    Math.max(currentStep / totalSteps, 0),
    1,
  );

  useEffect(() => {
    // Smooth fill
    progress.value = withTiming(fraction, {
      duration: 300,
    });

    // Pulse effect on step change
    pulseScale.value = withSequence(
      withSpring(1.04, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
  }, [currentStep, fraction, progress, pulseScale]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const barContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: pulseScale.value }],
  }));

  const styles = useThemedStyles((t) => ({
    container: {
      width: "100%" as const,
    },
    metaRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginBottom: 8,
    },
    labelsText: {
      flex: 1,
      marginRight: 8,
    },
    trackWrapper: {
      borderRadius: 2,
      overflow: "hidden" as const,
    },
    track: {
      width: "100%" as const,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.colors.border,
    },
    fill: {
      height: 4,
      borderRadius: 2,
      backgroundColor: t.colors.primary,
    },
  }));

  // Build breadcrumb string from labels up to current step
  const breadcrumb =
    labels && labels.length > 0
      ? labels.slice(0, currentStep).join(" › ")
      : undefined;

  return (
    <View style={styles.container}>
      {/* Meta row: step counter + breadcrumb */}
      <View style={styles.metaRow}>
        {breadcrumb ? (
          <Typography
            variant="caption"
            color="textSecondary"
            numberOfLines={1}
            style={styles.labelsText}
          >
            {breadcrumb}
          </Typography>
        ) : (
          <View style={styles.labelsText} />
        )}

        <Typography
          variant="caption"
          color="textMuted"
          weight="medium"
        >
          Step {currentStep} of {totalSteps}
        </Typography>
      </View>

      {/* Track */}
      <Animated.View
        style={[styles.trackWrapper, barContainerStyle]}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}
