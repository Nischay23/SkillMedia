import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useThemedStyles } from "@/providers/ThemeProvider";
import { Typography } from "@/components/ui/Typography";

interface VacancyChipProps {
  annualVacancies: number;
  style?: ViewStyle;
}

// Format number: 45000 → "45k", 1200000 → "1.2M"
function formatVacancies(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + "k";
  }
  return num.toString();
}

export default function VacancyChip({
  annualVacancies,
  style,
}: VacancyChipProps) {
  const scale = useSharedValue(0);

  // Spring scale-in animation on mount
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = useThemedStyles((t) => ({
    container: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: "rgba(34, 197, 94, 0.12)",
      borderWidth: 1,
      borderColor: "rgba(34, 197, 94, 0.25)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
    },
    text: {
      color: "#22C55E",
      fontSize: 11,
    },
  }));

  // Don't render if no vacancies
  if (!annualVacancies || annualVacancies <= 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.container, animatedStyle, style]}
    >
      <Ionicons name="briefcase-outline" size={12} color="#22C55E" />
      <Typography
        variant="label"
        style={styles.text}
      >
        {formatVacancies(annualVacancies)} vacancies/yr
      </Typography>
    </Animated.View>
  );
}
