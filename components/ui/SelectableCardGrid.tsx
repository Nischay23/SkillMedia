import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Typography } from "@/components/ui/Typography";
import { CARD_BORDER_RADIUS } from "@/constants/CardStyles";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";

// ── Types ─────────────────────────────────────────────
interface CardOption {
  id: string;
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
}

interface SelectableCardGridProps {
  options: CardOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  columns?: number;
}

// ── Single card ───────────────────────────────────────
const GAP = 12;

function SelectableCard({
  item,
  index,
  isSelected,
  onSelect,
}: {
  item: CardOption;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const styles = useThemedStyles((t) => ({
    card: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: CARD_BORDER_RADIUS,
      padding: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 1.5,
    },
    unselected: {
      backgroundColor: t.colors.surface,
      borderColor: t.colors.border,
    },
    selected: {
      backgroundColor: t.colors.primary,
      borderColor: t.colors.primary,
    },
    checkmark: {
      position: "absolute" as const,
      top: 8,
      right: 8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(255,255,255,0.3)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    iconWrapper: {
      marginBottom: 8,
    },
    titleWrapper: {
      marginTop: 4,
    },
    countBadge: {
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
    countBadgeUnselected: {
      backgroundColor: t.colors.primary + "14",
    },
    countBadgeSelected: {
      backgroundColor: "rgba(255,255,255,0.25)",
    },
  }));

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 300,
    });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(item.id);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)
        .delay(index * 50)
        .springify()
        .damping(18)}
      style={[{ flex: 1 }, animatedScale]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          isSelected ? styles.selected : styles.unselected,
        ]}
      >
        {/* Checkmark */}
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons
              name="checkmark"
              size={14}
              color="#FFFFFF"
            />
          </View>
        )}

        {/* Icon */}
        {item.icon && (
          <View style={styles.iconWrapper}>
            <Ionicons
              name={item.icon}
              size={28}
              color={
                isSelected
                  ? "#FFFFFF"
                  : theme.colors.primary
              }
            />
          </View>
        )}

        {/* Title */}
        <View style={styles.titleWrapper}>
          <Typography
            variant="body"
            weight="semibold"
            align="center"
            numberOfLines={2}
            style={{
              color: isSelected
                ? "#FFFFFF"
                : theme.colors.text,
            }}
          >
            {item.title}
          </Typography>
        </View>

        {/* Description */}
        {item.description && (
          <Typography
            variant="caption"
            align="center"
            numberOfLines={2}
            style={{
              color: isSelected
                ? "rgba(255,255,255,0.8)"
                : theme.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {item.description}
          </Typography>
        )}

        {/* Count badge */}
        {item.count != null && (
          <View
            style={[
              styles.countBadge,
              isSelected
                ? styles.countBadgeSelected
                : styles.countBadgeUnselected,
            ]}
          >
            <Typography
              variant="caption"
              weight="medium"
              style={{
                color: isSelected
                  ? "#FFFFFF"
                  : theme.colors.primary,
              }}
            >
              {item.count}{" "}
              {item.count === 1 ? "path" : "paths"}
            </Typography>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Grid (View+map to avoid VirtualizedList-in-ScrollView) ──
export default function SelectableCardGrid({
  options,
  selectedId,
  onSelect,
  columns = 2,
}: SelectableCardGridProps) {
  // Split options into rows of `columns` items
  const rows: CardOption[][] = [];
  for (let i = 0; i < options.length; i += columns) {
    rows.push(options.slice(i, i + columns));
  }

  return (
    <View style={{ gap: GAP }}>
      {rows.map((row, rowIndex) => (
        <View
          key={row.map((o) => o.id).join("-")}
          style={{ flexDirection: "row", gap: GAP }}
        >
          {row.map((item, colIndex) => (
            <SelectableCard
              key={item.id}
              item={item}
              index={rowIndex * columns + colIndex}
              isSelected={selectedId === item.id}
              onSelect={onSelect}
            />
          ))}
          {/* Fill remaining space if last row is short */}
          {row.length < columns &&
            Array.from({
              length: columns - row.length,
            }).map((_, i) => (
              <View
                key={`spacer-${i}`}
                style={{ flex: 1 }}
              />
            ))}
        </View>
      ))}
    </View>
  );
}
