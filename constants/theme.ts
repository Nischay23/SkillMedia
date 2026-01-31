// app/constants/theme.ts

import { Dimensions } from "react-native";
import { Colors } from "./Colors";

const { width, height } = Dimensions.get("window");

// Typography system - Using Poppins for modern, professional look
const typography = {
  fontFamily: {
    regular: "Poppins-Regular",
    semibold: "Poppins-SemiBold",
    bold: "Poppins-Bold",
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    "2xl": 36,
    "3xl": 42,
    "4xl": 48,
  },
  weight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

// Spacing system
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
};

// Border radius system
const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
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
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
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
export const createTheme = (
  colorScheme: "dark" | "light" = "light",
) => {
  const colors =
    colorScheme === "dark" ? Colors.dark : Colors.light;

  return {
    colors: {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accentGradientEnd || colors.secondary,
      background: colors.background,
      surface: colors.surface,
      surfaceLight: colors.surfaceLight,
      card: colors.surface,
      text: colors.textPrimary,
      textSecondary: colors.textSecondary,
      textMuted: colors.textMuted,
      border: colors.border,
      borderLight: colors.borderLight,
      success: colors.success,
      warning: colors.warning,
      danger: colors.error,
      info: colors.info,
      overlay: colors.overlay,
      shadow: colors.shadow,
      // New color mappings from the modern palette
      primaryLight: colors.primaryLight,
      primaryDark: colors.primaryDark,
      secondaryLight: colors.secondaryLight,
      secondaryDark: colors.secondaryDark,
      surfaceHighlight: colors.surfaceHighlight,
      textPrimary: colors.textPrimary,
      ...(colorScheme === "dark" && {
        accentGradientStart:
          Colors.dark.accentGradientStart,
        accentGradientEnd: Colors.dark.accentGradientEnd,
      }),
    },
    typography,
    spacing,
    borderRadius,
    shadows,
    animation,
    screen,
  };
};

// Default theme (light theme as primary)
export const defaultTheme = createTheme("light");

// Legacy color export for backward compatibility
export const COLORS = defaultTheme.colors;
