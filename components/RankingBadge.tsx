import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useThemedStyles, useTheme } from "@/providers/ThemeProvider";
import { Typography } from "@/components/ui/Typography";

interface RankingBadgeProps {
  ranking: number;
  variant?: "sm" | "lg";
  style?: ViewStyle;
}

export default function RankingBadge({
  ranking,
  variant = "sm",
  style,
}: RankingBadgeProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(0);

  // Spring scale-in animation on mount
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = useThemedStyles((t) => ({
    // Small variant (for cards)
    smContainer: {
      borderRadius: 10,
      overflow: "hidden" as const,
    },
    smGradient: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    // Large variant (for detail view)
    lgContainer: {
      borderRadius: t.borderRadius.xl,
      overflow: "hidden" as const,
    },
    lgGradient: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 2,
    },
  }));

  if (variant === "lg") {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.lgContainer, animatedStyle, style]}
      >
        <LinearGradient
          colors={["#6C5DD3", "#8676FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lgGradient}
        >
          <Typography
            variant="body"
            style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}
          >
            #
          </Typography>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: "#FFFFFF", fontSize: 22 }}
          >
            {ranking}
          </Typography>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Small variant (default)
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.smContainer, animatedStyle, style]}
    >
      <LinearGradient
        colors={["#6C5DD3", "#8676FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.smGradient}
      >
        <Typography
          variant="label"
          weight="bold"
          style={{ color: "#FFFFFF", fontSize: 11, letterSpacing: 0 }}
        >
          #{ranking}
        </Typography>
      </LinearGradient>
    </Animated.View>
  );
}
