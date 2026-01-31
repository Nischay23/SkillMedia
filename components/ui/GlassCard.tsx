/**
 * GlassCard Component
 * A modern glass morphism card that adapts to the active theme
 *
 * Dark Mode: Glass effect with subtle border and shadow
 * Light Mode: Clean white card with soft, diffused shadow
 */

import { useTheme } from "@/providers/ThemeProvider";
import React, { ReactNode } from "react";
import { Platform, View, ViewStyle } from "react-native";

interface GlassCardProps {
  children: ReactNode;
  /**
   * Style overrides
   */
  style?: ViewStyle;
  /**
   * Padding inside the card
   * @default 'lg' (16)
   */
  padding?: "sm" | "md" | "lg" | "xl";
  /**
   * Optional onPress for touchable cards
   */
  onPress?: () => void;
  /**
   * Add a border
   * @default false
   */
  bordered?: boolean;
}

const paddingMap = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  padding = "lg",
  onPress,
  bordered = false,
}) => {
  const { theme, isDark } = useTheme();

  const containerStyle: ViewStyle = {
    borderRadius: 24,
    padding: paddingMap[padding],
    overflow: "hidden",
  };

  if (isDark) {
    // Dark Mode: Glass morphism effect
    Object.assign(containerStyle, {
      backgroundColor: theme.colors.surface,
      borderWidth: bordered ? 1 : 0.5,
      borderColor: "rgba(255, 255, 255, 0.1)",
      // Shadow for dark mode
      ...(Platform.OS === "ios" && {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      }),
      ...(Platform.OS === "android" && {
        elevation: 4,
      }),
    });
  } else {
    // Light Mode: Clean white card with soft shadow
    Object.assign(containerStyle, {
      backgroundColor: theme.colors.surface,
      borderWidth: 0,
      borderColor: "transparent",
      // Soft, diffused shadow using primary color
      ...(Platform.OS === "ios" && {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      }),
      ...(Platform.OS === "android" && {
        elevation: 10,
      }),
    });
  }

  const Component = onPress ? View : View;

  return (
    <Component
      style={[containerStyle, style]}
      onTouchEnd={onPress}
    >
      {children}
    </Component>
  );
};
