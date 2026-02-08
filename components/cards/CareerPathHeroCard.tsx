import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";

import { useThemedStyles } from "@/providers/ThemeProvider";

// ── Category gradient map ──────────────────────────────
type CategoryKey =
  | "tech"
  | "government"
  | "business"
  | "creative"
  | "default";

const GRADIENTS: Record<CategoryKey, [string, string]> = {
  tech: ["#6C5DD3", "#3B82F6"], // purple → blue
  government: ["#10B981", "#14B8A6"], // green → teal
  business: ["#F97316", "#EF4444"], // orange → red
  creative: ["#EC4899", "#8B5CF6"], // pink → purple
  default: ["#6C5DD3", "#8676FF"], // app primary gradient
};

function resolveGradient(
  category: string,
): [string, string] {
  const key = category.toLowerCase().trim() as CategoryKey;
  return GRADIENTS[key] ?? GRADIENTS.default;
}

// ── Props ──────────────────────────────────────────────
interface CareerPathHeroCardProps {
  title: string;
  description: string;
  salary?: string;
  requirements?: string;
  exams?: string;
  category: string;
  onSave: () => void;
  onShare: () => void;
  onDeepDive: () => void;
  isSaved: boolean;
}

// ── Component ──────────────────────────────────────────
export default function CareerPathHeroCard({
  title,
  description,
  salary,
  requirements,
  exams,
  category,
  onSave,
  onShare,
  onDeepDive,
  isSaved,
}: CareerPathHeroCardProps) {
  const gradientColors = resolveGradient(category);

  const styles = useThemedStyles((t) => ({
    card: {
      width: "100%" as const,
      overflow: "hidden" as const,
      minHeight: 280,
    },
    gradient: {
      flex: 1,
      padding: t.spacing.xl,
      justifyContent: "space-between" as const,
    },
    topRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
    },
    categoryBadge: {
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: t.borderRadius.full,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
    },
    categoryText: {
      fontFamily: t.typography.fontFamily.semibold,
      fontSize: t.typography.size.xs,
      color: "#FFFFFF",
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
    },
    title: {
      fontFamily: t.typography.fontFamily.bold,
      fontSize: t.typography.size["3xl"],
      lineHeight: t.typography.lineHeight["3xl"],
      color: "#FFFFFF",
      marginTop: t.spacing.md,
    },
    description: {
      fontFamily: t.typography.fontFamily.regular,
      fontSize: t.typography.size.sm,
      lineHeight: t.typography.lineHeight.sm,
      color: "rgba(255,255,255,0.85)",
      marginTop: t.spacing.sm,
    },
    badgesRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
      marginTop: t.spacing.lg,
    },
    infoBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: t.borderRadius.lg,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.15)",
      maxWidth: "100%" as const,
    },
    infoBadgeText: {
      fontFamily: t.typography.fontFamily.regular,
      fontSize: t.typography.size.xs,
      color: "#FFFFFF",
      marginLeft: 4,
      flexShrink: 1,
    },
    actionsRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginTop: t.spacing.xl,
      gap: 10,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    deepDiveButton: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
      gap: 6,
    },
    deepDiveText: {
      fontFamily: t.typography.fontFamily.semibold,
      fontSize: t.typography.size.sm,
      color: gradientColors[0],
    },
  }));

  const infoBadges: {
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
  }[] = [];
  if (salary)
    infoBadges.push({ icon: "cash-outline", text: salary });
  if (requirements)
    infoBadges.push({
      icon: "school-outline",
      text: requirements,
    });
  if (exams)
    infoBadges.push({
      icon: "document-text-outline",
      text: exams,
    });

  return (
    <Animated.View
      entering={FadeInDown.duration(400)
        .springify()
        .damping(18)}
      style={styles.card}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Top: category badge */}
        <View>
          <View style={styles.topRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {category}
              </Text>
            </View>
          </View>

          {/* Title + description */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text
            style={styles.description}
            numberOfLines={2}
          >
            {description}
          </Text>

          {/* Info badges */}
          {infoBadges.length > 0 && (
            <View style={styles.badgesRow}>
              {infoBadges.map((b) => (
                <View key={b.icon} style={styles.infoBadge}>
                  <Ionicons
                    name={b.icon}
                    size={13}
                    color="#FFFFFF"
                  />
                  <Text
                    style={styles.infoBadgeText}
                    numberOfLines={1}
                  >
                    {b.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={onSave}
            style={styles.iconButton}
          >
            <Ionicons
              name={
                isSaved ? "bookmark" : "bookmark-outline"
              }
              size={20}
              color="#FFFFFF"
            />
          </Pressable>

          <Pressable
            onPress={onShare}
            style={styles.iconButton}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color="#FFFFFF"
            />
          </Pressable>

          <Pressable
            onPress={onDeepDive}
            style={styles.deepDiveButton}
          >
            <Text style={styles.deepDiveText}>
              Deep Dive
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={gradientColors[0]}
            />
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
