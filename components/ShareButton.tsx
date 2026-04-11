// components/ShareButton.tsx
import React from "react";
import { Share, Pressable, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme, useThemedStyles } from "@/providers/ThemeProvider";
import { Typography } from "@/components/ui/Typography";
import { Id } from "@/convex/_generated/dataModel";

interface ShareButtonProps {
  filterOptionId: Id<"FilterOption"> | string;
  filterOptionName: string;
  /** "icon" = 40×40 circle (default), "pill" = pill with "Share" label */
  variant?: "icon" | "pill";
  /** Override the icon color (defaults to theme primary) */
  iconColor?: string;
  style?: ViewStyle;
}

export default function ShareButton({
  filterOptionId,
  filterOptionName,
  variant = "pill",
  iconColor,
  style,
}: ShareButtonProps) {
  const { theme } = useTheme();
  const color = iconColor ?? theme.colors.primary;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = useThemedStyles((t) => ({
    // ── Icon variant ────────────────────────────────────
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${t.colors.primary}18`,
      borderWidth: 1.5,
      borderColor: `${t.colors.primary}40`,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    // ── Pill variant ────────────────────────────────────
    pill: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: t.colors.primary,
      gap: 6,
      backgroundColor: "transparent",
    },
  }));

  const handlePress = async () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 200 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });

    const deepLink = `skillmedia://career/${filterOptionId}`;
    const message = `Check out ${filterOptionName} career path on SkillMedia!\n${deepLink}`;

    try {
      await Share.share({ message });
    } catch (_err) {
      // User dismissed share sheet — no-op
    }
  };

  if (variant === "icon") {
    return (
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 12, stiffness: 200 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1.0, { damping: 12, stiffness: 200 });
        }}
        onPress={handlePress}
        style={style}
        accessibilityLabel="Share career path"
        accessibilityRole="button"
      >
        <Animated.View style={[styles.iconCircle, animatedStyle]}>
          <Ionicons name="share-social-outline" size={18} color={color} />
        </Animated.View>
      </Pressable>
    );
  }

  // Pill variant (default)
  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 12, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0, { damping: 12, stiffness: 200 });
      }}
      onPress={handlePress}
      style={style}
      accessibilityLabel="Share career path"
      accessibilityRole="button"
    >
      <Animated.View style={[styles.pill, animatedStyle]}>
        <Ionicons name="share-social-outline" size={18} color={color} />
        <Typography variant="body" weight="medium" color="primary">
          Share
        </Typography>
      </Animated.View>
    </Pressable>
  );
}
