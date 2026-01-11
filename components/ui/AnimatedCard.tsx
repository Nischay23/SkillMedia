// components/ui/AnimatedCard.tsx
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useThemedStyles } from '@/providers/ThemeProvider';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  variant?: 'default' | 'elevated' | 'outlined';
  pressable?: boolean;
  onPress?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  variant = 'default',
  pressable = false,
  onPress,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(pressable ? 1 : 1);

  const styles = useThemedStyles((theme) => ({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      overflow: 'hidden' as const,
    },
    default: {
      ...theme.shadows.md,
      shadowColor: theme.colors.shadow,
    },
    elevated: {
      ...theme.shadows.lg,
      shadowColor: theme.colors.shadow,
      elevation: 8,
    },
    outlined: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
      shadowColor: theme.colors.shadow,
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
      case 'elevated':
        return styles.elevated;
      case 'outlined':
        return styles.outlined;
      default:
        return styles.default;
    }
  };

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600 })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 20,
        stiffness: 90,
      })
    );
  }, [delay, opacity, translateY]);

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withSpring(0.98, { damping: 10, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withSpring(1, { damping: 10, stiffness: 400 });
    }
  };

  if (pressable && onPress) {
    return (
      <Animated.View
        style={[
          styles.card,
          getVariantStyle(),
          animatedStyle,
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
      style={[
        styles.card,
        getVariantStyle(),
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};
