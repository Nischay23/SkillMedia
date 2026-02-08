import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";

const AnimatedPressable =
  Animated.createAnimatedComponent(Pressable);

const CHIP_HEIGHT = 32;
const CHIP_PADDING_H = 12;
const CHIP_RADIUS = 16;

interface FilterChipProps {
  label: string;
  onPress?: () => void;
  onRemove?: () => void;
  isActive?: boolean;
}

export default function FilterChip({
  label,
  onPress,
  onRemove,
  isActive = false,
}: FilterChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const styles = useThemedStyles((t) => ({
    chip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      height: CHIP_HEIGHT,
      paddingHorizontal: CHIP_PADDING_H,
      borderRadius: CHIP_RADIUS,
      borderWidth: 1,
    },
    active: {
      backgroundColor: t.colors.primary,
      borderColor: t.colors.primary,
    },
    inactive: {
      backgroundColor: t.colors.surface + "CC",
      borderColor: t.colors.border,
    },
    label: {
      fontSize: t.typography.size.sm,
      fontFamily: t.typography.fontFamily.semibold,
      fontWeight: t.typography.weight.medium as "500",
    },
    activeLabel: {
      color: "#FFFFFF",
    },
    inactiveLabel: {
      color: t.colors.primary,
    },
    removeButton: {
      marginLeft: 6,
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    activeRemove: {
      backgroundColor: "rgba(255,255,255,0.25)",
    },
    inactiveRemove: {
      backgroundColor: t.colors.borderLight,
    },
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 300,
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        isActive ? styles.active : styles.inactive,
        animatedStyle,
      ]}
    >
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.label,
          isActive
            ? styles.activeLabel
            : styles.inactiveLabel,
        ]}
      >
        {label}
      </Animated.Text>

      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={6}
          style={[
            styles.removeButton,
            isActive
              ? styles.activeRemove
              : styles.inactiveRemove,
          ]}
        >
          <Ionicons
            name="close"
            size={10}
            color={
              isActive ? "#FFFFFF" : theme.colors.textMuted
            }
          />
        </Pressable>
      )}
    </AnimatedPressable>
  );
}
