/**
 * GradientButton Component
 * A modern gradient button with press animation
 *
 * Dark Mode: Gradient from Purple to Blue
 * Light Mode: Solid Primary Color with soft shadow
 * Both: Smooth scale animation on press (0.98)
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
  View,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface GradientButtonProps {
  /**
   * Button label text
   */
  label: string;

  /**
   * Callback when button is pressed
   */
  onPress: () => void;

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Style overrides for the container
   */
  style?: ViewStyle;

  /**
   * Style overrides for the text
   */
  textStyle?: ViewStyle;

  /**
   * Left icon component
   */
  leftIcon?: React.ReactNode;

  /**
   * Right icon component
   */
  rightIcon?: React.ReactNode;
}

const sizeConfig = {
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    borderRadius: 12,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    fontSize: 16,
    borderRadius: 14,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    fontSize: 18,
    borderRadius: 16,
  },
};

export const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  onPress,
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const { theme, isDark } = useTheme();
  const config = sizeConfig[size];

  // Animated scale
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1);
  }, [scale]);

  const isDisabled = disabled || loading;

  // Determine button style based on theme
  const gradientColors = isDark
    ? [theme.colors.primary, '#8676FF'] // Purple to Blue
    : [theme.colors.primary, theme.colors.primaryLight]; // Solid gradient

  const buttonContent = (
    <View style={styles.content}>
      {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
      <Text
        style={[
          styles.text,
          {
            fontSize: config.fontSize,
            color: isDark ? '#FFFFFF' : '#FFFFFF',
            fontFamily: theme.typography.fontFamily.semibold,
            opacity: isDisabled ? 0.6 : 1,
          },
        ]}
      >
        {loading ? 'Loading...' : label}
      </Text>
      {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
    </View>
  );

  return (
    <Animated.View
      style={[
        {
          borderRadius: config.borderRadius,
          overflow: 'hidden',
          opacity: isDisabled ? 0.6 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={({ pressed }) => [
          {
            paddingVertical: config.paddingVertical,
            paddingHorizontal: config.paddingHorizontal,
            borderRadius: config.borderRadius,
          },
          !isDark && {
            // Light mode: shadow effect
            ...(Platform.OS === 'ios' && {
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }),
            ...(Platform.OS === 'android' && {
              elevation: 8,
            }),
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: config.paddingVertical,
            paddingHorizontal: config.paddingHorizontal,
            borderRadius: config.borderRadius,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {buttonContent}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
