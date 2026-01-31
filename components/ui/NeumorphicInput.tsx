/**
 * NeumorphicInput Component
 * A modern search/input field with neumorphic design
 *
 * Light Mode: Light gray background with soft inset feel
 * Dark Mode: Dark gray background with white text and subtle glow on focus
 */

import { useTheme } from "@/providers/ThemeProvider";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  ViewStyle,
} from "react-native";

interface NeumorphicInputProps {
  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Current value
   */
  value?: string;

  /**
   * Callback when text changes
   */
  onChangeText?: (text: string) => void;

  /**
   * Callback when user focuses the input
   */
  onFocus?: () => void;

  /**
   * Callback when user blurs the input
   */
  onBlur?: () => void;

  /**
   * Left icon (e.g., search icon)
   */
  leftIcon?: string;

  /**
   * Right icon (e.g., clear button)
   */
  rightIcon?: string;

  /**
   * Callback for right icon press
   */
  onRightIconPress?: () => void;

  /**
   * Keyboard type
   * @default 'default'
   */
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad";

  /**
   * Input height
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";

  /**
   * Style overrides
   */
  style?: ViewStyle;

  /**
   * Editable state
   * @default true
   */
  editable?: boolean;

  /**
   * Maximum number of lines
   * @default 1
   */
  maxLength?: number;

  /**
   * Whether this is a search field
   * @default false
   */
  isSearch?: boolean;
}

const sizeConfig = {
  sm: {
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    borderRadius: 10,
  },
  md: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    borderRadius: 12,
  },
  lg: {
    height: 56,
    paddingHorizontal: 20,
    fontSize: 18,
    borderRadius: 14,
  },
};

export const NeumorphicInput: React.FC<
  NeumorphicInputProps
> = ({
  placeholder = "Search...",
  value,
  onChangeText,
  onFocus,
  onBlur,
  leftIcon = "search",
  rightIcon,
  onRightIconPress,
  keyboardType = "default",
  size = "md",
  style,
  editable = true,
  maxLength,
  isSearch = false,
}) => {
  const { theme, isDark } = useTheme();
  const config = sizeConfig[size];
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation for focus effect
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(focusAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(focusAnim, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
    onBlur?.();
  };

  const borderColorAnimation = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? [
          "rgba(255, 255, 255, 0.1)",
          "rgba(160, 166, 255, 0.3)",
        ]
      : [
          "rgba(108, 93, 211, 0.1)",
          "rgba(108, 93, 211, 0.3)",
        ],
  });

  const shadowOpacityAnimation = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? [0.1, 0.3] : [0.08, 0.15],
  });

  return (
    <Animated.View
      style={[
        {
          height: config.height,
          borderRadius: config.borderRadius,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: borderColorAnimation as any,
          backgroundColor: isDark
            ? theme.colors.surfaceHighlight
            : theme.colors.surfaceLight,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: config.paddingHorizontal,
          // Neumorphic shadow effect
          ...(Platform.OS === "ios" && {
            shadowColor: isDark
              ? theme.colors.primary
              : theme.colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: shadowOpacityAnimation as any,
            shadowRadius: 8,
          }),
          ...(Platform.OS === "android" && {
            elevation: isFocused ? 8 : 2,
          }),
        },
        style,
      ]}
    >
      {/* Left Icon */}
      {leftIcon && (
        <MaterialIcons
          name={leftIcon as any}
          size={24}
          color={
            isFocused
              ? theme.colors.primary
              : theme.colors.textSecondary
          }
          style={{ marginRight: 12 }}
        />
      )}

      {/* Input Field */}
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        keyboardType={keyboardType}
        editable={editable}
        maxLength={maxLength}
        style={[
          styles.input,
          {
            flex: 1,
            fontSize: config.fontSize,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.regular,
          },
        ]}
      />

      {/* Right Icon / Clear Button */}
      {rightIcon || (isSearch && value) ? (
        <Pressable
          onPress={() => {
            if (isSearch && value) {
              onChangeText?.("");
              inputRef.current?.clear();
            } else {
              onRightIconPress?.();
            }
          }}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.7 : 1,
              marginLeft: 12,
              padding: 4,
            },
          ]}
        >
          <MaterialIcons
            name={
              isSearch && value
                ? "close"
                : (rightIcon as any) || "arrow-forward"
            }
            size={24}
            color={
              isFocused
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
        </Pressable>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
    outline: "none",
  },
});
