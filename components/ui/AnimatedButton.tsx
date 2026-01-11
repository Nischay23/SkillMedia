// components/ui/AnimatedButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useThemedStyles } from '@/providers/ThemeProvider';

interface AnimatedButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  icon?: React.ReactNode;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  loading = false,
  icon,
}) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0);

  const styles = useThemedStyles((theme) => ({
    button: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md,
      shadowColor: variant === 'primary' ? theme.colors.primary : theme.colors.shadow,
    },
    primary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    disabled: {
      opacity: 0.5,
    },
    sm: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: 36,
    },
    md: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      minHeight: 44,
    },
    lg: {
      paddingHorizontal: theme.spacing['2xl'],
      paddingVertical: theme.spacing.lg,
      minHeight: 52,
    },
    text: {
      fontFamily: theme.typography.fontFamily.medium,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    },
    textPrimary: {
      color: variant === 'primary' ? theme.colors.card : theme.colors.primary,
    },
    textSecondary: {
      color: variant === 'secondary' ? theme.colors.card : theme.colors.secondary,
    },
    textOutline: {
      color: theme.colors.primary,
    },
    textGhost: {
      color: theme.colors.text,
    },
    textSm: {
      fontSize: theme.typography.size.sm,
      lineHeight: theme.typography.lineHeight.sm,
    },
    textMd: {
      fontSize: theme.typography.size.base,
      lineHeight: theme.typography.lineHeight.base,
    },
    textLg: {
      fontSize: theme.typography.size.lg,
      lineHeight: theme.typography.lineHeight.lg,
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
    shadowOpacity.value = withTiming(0.4, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
    shadowOpacity.value = withTiming(0, { duration: 150 });
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (!disabled && !loading) {
      runOnJS(onPress)(event);
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
      default:
        return styles.primary;
    }
  };

  const getTextVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.textPrimary;
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return styles.textOutline;
      case 'ghost':
        return styles.textGhost;
      default:
        return styles.textPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sm;
      case 'md':
        return styles.md;
      case 'lg':
        return styles.lg;
      default:
        return styles.md;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.textSm;
      case 'md':
        return styles.textMd;
      case 'lg':
        return styles.textLg;
      default:
        return styles.textMd;
    }
  };

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      {icon && <Animated.View style={styles.icon}>{icon}</Animated.View>}
      <Text
        style={[
          styles.text,
          getTextVariantStyle(),
          getTextSizeStyle(),
          textStyle,
        ]}
      >
        {loading ? 'Loading...' : title}
      </Text>
    </AnimatedTouchable>
  );
};
