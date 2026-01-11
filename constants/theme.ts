// app/constants/theme.ts

import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// Base color palettes
const darkTheme = {
  primary: "#4ADE80",
  secondary: "#2DD4BF", 
  accent: "#34D399",
  background: "#0A0A0B",
  surface: "#1A1A1B",
  surfaceLight: "#2A2A2B",
  card: "#161617",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textMuted: "#6B7280",
  border: "#374151",
  borderLight: "#4B5563",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  overlay: "rgba(0, 0, 0, 0.8)",
  shadow: "rgba(74, 222, 128, 0.2)",
};

const lightTheme = {
  primary: "#059669",
  secondary: "#0891B2",
  accent: "#10B981",
  background: "#FFFFFF",
  surface: "#F9FAFB",
  surfaceLight: "#F3F4F6",
  card: "#FFFFFF",
  text: "#111827",
  textSecondary: "#4B5563",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#D1D5DB",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#2563EB",
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.1)",
};

// Typography system
const typography = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'SF Pro Display Medium' : 'Roboto-Medium',
    bold: Platform.OS === 'ios' ? 'SF Pro Display Bold' : 'Roboto-Bold',
    light: Platform.OS === 'ios' ? 'SF Pro Display Light' : 'Roboto-Light',
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 42,
    '4xl': 48,
  },
  weight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing system
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Border radius system
const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadow system
const shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};

// Animation values
const animation = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Screen dimensions
const screen = {
  width,
  height,
  isSmall: width < 375,
  isMedium: width >= 375 && width < 414,
  isLarge: width >= 414,
};

// Complete theme object
export const createTheme = (colorScheme: 'dark' | 'light' = 'dark') => ({
  colors: colorScheme === 'dark' ? darkTheme : lightTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  screen,
});

// Default theme (can be overridden by theme provider)
export const defaultTheme = createTheme('dark');

// Legacy color export for backward compatibility
export const COLORS = defaultTheme.colors;
