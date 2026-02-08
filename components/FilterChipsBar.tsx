import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import FilterChip from "@/components/ui/FilterChip";
import { Typography } from "@/components/ui/Typography";
import { SpacingValues } from "@/constants/theme";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";

const BAR_HEIGHT = 48;

interface FilterChipsBarProps {
  selectedPath: string[];
  onChipPress: (index: number) => void;
  onClearAll: () => void;
}

export default function FilterChipsBar({
  selectedPath,
  onChipPress,
  onClearAll,
}: FilterChipsBarProps) {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const styles = useThemedStyles((t) => ({
    container: {
      height: BAR_HEIGHT,
      justifyContent: "center" as const,
    },
    scrollContent: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: SpacingValues.base,
      gap: SpacingValues.sm,
    },
    emptyText: {
      paddingHorizontal: SpacingValues.base,
    },
    separator: {
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    clearButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      height: 32,
      paddingHorizontal: 10,
      borderRadius: 16,
      backgroundColor: t.colors.danger + "18",
    },
  }));

  // Auto-scroll to end when chips change
  useEffect(() => {
    if (selectedPath.length > 0) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedPath.length]);

  // No filters — render nothing
  if (selectedPath.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedPath.map((name, index) => {
          const isLast = index === selectedPath.length - 1;

          return (
            <React.Fragment key={`${name}-${index}`}>
              {/* Chevron separator before chip (except first) */}
              {index > 0 && (
                <View style={styles.separator}>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={theme.colors.textMuted}
                  />
                </View>
              )}

              <Animated.View
                entering={FadeIn.duration(200).delay(
                  index * 50,
                )}
              >
                <FilterChip
                  label={name}
                  isActive={isLast}
                  onPress={() => onChipPress(index)}
                />
              </Animated.View>
            </React.Fragment>
          );
        })}

        {/* Clear All button */}
        <Animated.View entering={FadeIn.duration(200)}>
          <Pressable
            onPress={onClearAll}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={14}
              color={theme.colors.danger}
            />
            <Typography
              variant="caption"
              style={{
                color: theme.colors.danger,
                marginLeft: SpacingValues.xs,
              }}
            >
              Clear
            </Typography>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
