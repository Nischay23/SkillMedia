// components/ui/Typography.tsx
import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useThemedStyles } from '@/providers/ThemeProvider';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'textMuted' | 'accent';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
  numberOfLines?: number;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'text',
  weight,
  align = 'left',
  style,
  numberOfLines,
}) => {
  const styles = useThemedStyles((theme) => ({
    h1: {
      fontSize: theme.typography.size['4xl'],
      lineHeight: theme.typography.lineHeight['4xl'],
      fontFamily: theme.typography.fontFamily.bold,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: theme.typography.size['3xl'],
      lineHeight: theme.typography.lineHeight['3xl'],
      fontFamily: theme.typography.fontFamily.bold,
      fontWeight: '700' as const,
    },
    h3: {
      fontSize: theme.typography.size['2xl'],
      lineHeight: theme.typography.lineHeight['2xl'],
      fontFamily: theme.typography.fontFamily.medium,
      fontWeight: '600' as const,
    },
    h4: {
      fontSize: theme.typography.size.xl,
      lineHeight: theme.typography.lineHeight.xl,
      fontFamily: theme.typography.fontFamily.medium,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: theme.typography.size.base,
      lineHeight: theme.typography.lineHeight.base,
      fontFamily: theme.typography.fontFamily.regular,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: theme.typography.size.sm,
      lineHeight: theme.typography.lineHeight.sm,
      fontFamily: theme.typography.fontFamily.regular,
      fontWeight: '400' as const,
    },
    label: {
      fontSize: theme.typography.size.xs,
      lineHeight: theme.typography.lineHeight.xs,
      fontFamily: theme.typography.fontFamily.medium,
      fontWeight: '500' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    // Colors
    primary: { color: theme.colors.primary },
    secondary: { color: theme.colors.secondary },
    text: { color: theme.colors.text },
    textSecondary: { color: theme.colors.textSecondary },
    textMuted: { color: theme.colors.textMuted },
    accent: { color: theme.colors.accent },
    // Weights
    light: { fontWeight: '300' as const },
    normal: { fontWeight: '400' as const },
    medium: { fontWeight: '500' as const },
    semibold: { fontWeight: '600' as const },
    bold: { fontWeight: '700' as const },
    // Alignment
    left: { textAlign: 'left' as const },
    center: { textAlign: 'center' as const },
    right: { textAlign: 'right' as const },
  }));

  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'h4':
        return styles.h4;
      case 'body':
        return styles.body;
      case 'caption':
        return styles.caption;
      case 'label':
        return styles.label;
      default:
        return styles.body;
    }
  };

  const getColorStyle = () => {
    switch (color) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'text':
        return styles.text;
      case 'textSecondary':
        return styles.textSecondary;
      case 'textMuted':
        return styles.textMuted;
      case 'accent':
        return styles.accent;
      default:
        return styles.text;
    }
  };

  const getWeightStyle = () => {
    if (!weight) return {};
    switch (weight) {
      case 'light':
        return styles.light;
      case 'normal':
        return styles.normal;
      case 'medium':
        return styles.medium;
      case 'semibold':
        return styles.semibold;
      case 'bold':
        return styles.bold;
      default:
        return {};
    }
  };

  const getAlignStyle = () => {
    switch (align) {
      case 'left':
        return styles.left;
      case 'center':
        return styles.center;
      case 'right':
        return styles.right;
      default:
        return styles.left;
    }
  };

  return (
    <Text
      style={[
        getVariantStyle(),
        getColorStyle(),
        getWeightStyle(),
        getAlignStyle(),
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};
