// components/ui/AnimatedCard.tsx
import { useThemedStyles } from "@/providers/ThemeProvider";
import { getThemedCardStyle } from "@/constants/CardStyles";
import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  variant?: "default" | "elevated" | "outlined" | "transparent";
  pressable?: boolean;
  onPress?: () => void;
  /**
   * Use entering animation from Reanimated for list items
   * Provides smoother cascade animations
   * @default true
   */
  useEnteringAnimation?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  variant = "default",
  pressable = false,
  onPress,
  useEnteringAnimation = true,
}) => {
  const opacity = useSharedValue(
    useEnteringAnimation ? 1 : 0,
  );
  const translateY = useSharedValue(
    useEnteringAnimation ? 0 : 30,
  );
  const scale = useSharedValue(1);

  const styles = useThemedStyles((theme) => ({
    card: {
      ...getThemedCardStyle("base", theme.colors.shadow),
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
    },
    default: {
      ...theme.shadows.md,
      shadowColor: theme.colors.shadow,
    },
    elevated: {
      ...getThemedCardStyle(
        "elevated",
        theme.colors.shadow,
      ),
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
    },
    outlined: {
      ...getThemedCardStyle("flat", theme.colors.shadow),
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
    },
    transparent: {
      backgroundColor: "transparent",
      padding: 0,
    },
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const getVariantStyle = () => {
    switch (variant) {
      case "elevated":
        return styles.elevated;
      case "outlined":
        return styles.outlined;
      case "transparent":
        return styles.transparent;
      default:
        return styles.default;
    }
  };

  // Only use manual animation if not using entering animation
  useEffect(() => {
    if (!useEnteringAnimation) {
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 600 }),
      );
      translateY.value = withDelay(
        delay,
        withSpring(0, {
          damping: 20,
          stiffness: 90,
        }),
      );
    }
  }, [delay, opacity, translateY, useEnteringAnimation]);

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withSpring(0.98, {
        damping: 10,
        stiffness: 400,
      });
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withSpring(1, {
        damping: 10,
        stiffness: 400,
      });
    }
  };

  // Calculate entering animation with staggered delay
  const enteringAnimation = useEnteringAnimation
    ? FadeInDown.delay(delay)
        .duration(400)
        .springify()
        .damping(15)
    : undefined;

  if (pressable && onPress) {
    return (
      <Animated.View
        entering={enteringAnimation}
        style={[
          variant !== "transparent" && styles.card,
          getVariantStyle(),
          !useEnteringAnimation && animatedStyle,
          style,
        ]}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={enteringAnimation}
      style={[
        variant !== "transparent" && styles.card,
        getVariantStyle(),
        !useEnteringAnimation && animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};
