import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Typography } from "@/components/ui/Typography";
import { useThemedStyles } from "@/providers/ThemeProvider";
import RankingBadge from "@/components/RankingBadge";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

// ── Category gradient map ──────────────────────────────
type CategoryKey =
  | "tech"
  | "government"
  | "business"
  | "creative"
  | "default";

const GRADIENTS: Record<CategoryKey, [string, string]> = {
  tech: ["#6C5DD3", "#3B82F6"],
  government: ["#10B981", "#14B8A6"],
  business: ["#F97316", "#EF4444"],
  creative: ["#EC4899", "#8B5CF6"],
  default: ["#6C5DD3", "#8676FF"],
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
  filterOptionId?: Id<"FilterOption">;
  ranking?: number | null;
  annualVacancies?: number | null;
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
  filterOptionId,
  ranking,
  annualVacancies,
  onSave,
  onShare,
  onDeepDive,
  isSaved,
}: CareerPathHeroCardProps) {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const gradientColors = resolveGradient(category);

  // Group data
  const group = useQuery(
    api.groups.getGroupByFilterOption,
    filterOptionId ? { filterOptionId } : "skip",
  );
  const isMember = useQuery(
    api.groups.getIsMember,
    group ? { groupId: group._id } : "skip",
  );
  const joinGroupMutation = useMutation(api.groups.joinGroup);
  const createGroupMutation = useMutation(api.groups.createGroup);
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip",
  );

  // Join button animation
  const joinScale = useSharedValue(1);
  const joinScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: joinScale.value }],
  }));

  const handleJoinGroup = async () => {
    if (!group) return;
    await joinGroupMutation({ groupId: group._id });
    router.push(`/group/${group._id}` as any);
  };

  const handleOpenGroup = () => {
    if (!group) return;
    router.push(`/group/${group._id}` as any);
  };

  const handleStartCommunity = async () => {
    if (!filterOptionId) return;

    // Check if user is admin
    if (!convexUser?.isAdmin) {
      Alert.alert(
        "Community coming soon",
        "Community coming soon for this career path!"
      );
      return;
    }

    // Admin can create group
    try {
      const groupId = await createGroupMutation({
        filterOptionId,
        name: title,
        description: description,
      });
      router.push(`/group/${groupId}` as any);
    } catch (error) {
      Alert.alert("Error", "Failed to create community");
    }
  };

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
    // Group section
    groupSection: {
      marginTop: t.spacing.lg,
    },
    joinButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      height: 44,
      borderRadius: 12,
      gap: 8,
      overflow: "hidden" as const,
    },
    joinGradient: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      height: 44,
      borderRadius: 12,
      gap: 8,
      paddingHorizontal: 20,
      width: "100%" as const,
    },
    openButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      height: 44,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.5)",
      gap: 8,
    },
    startButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      height: 44,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: "dashed" as const,
      borderColor: "rgba(255,255,255,0.3)",
      backgroundColor: "transparent" as const,
      gap: 8,
    },
    memberCount: {
      color: "rgba(255,255,255,0.6)",
      textAlign: "center" as const,
      marginTop: 6,
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
  if (annualVacancies)
    infoBadges.push({
      icon: "briefcase-outline",
      text: `~${annualVacancies.toLocaleString()} vacancies/year`,
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
            {ranking != null && ranking > 0 && (
              <RankingBadge ranking={ranking} />
            )}
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

        {/* Group Join/Open/Start section - ALWAYS show button on career path cards */}
        {filterOptionId && clerkUser && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.groupSection}
          >
            {group && isMember ? (
              // User is already a member - show Open Group button
              <Pressable
                onPressIn={() => {
                  joinScale.value = withSpring(0.96);
                }}
                onPressOut={() => {
                  joinScale.value = withSpring(1);
                }}
                onPress={handleOpenGroup}
              >
                <Animated.View
                  style={[styles.openButton, joinScaleStyle]}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={{ color: "#FFFFFF" }}
                  >
                    Open Group
                  </Typography>
                </Animated.View>
              </Pressable>
            ) : group ? (
              // Group exists but user is not a member - show Join Community button
              <View>
                <Pressable
                  onPressIn={() => {
                    joinScale.value = withSpring(0.96);
                  }}
                  onPressOut={() => {
                    joinScale.value = withSpring(1);
                  }}
                  onPress={handleJoinGroup}
                >
                  <Animated.View style={joinScaleStyle}>
                    <LinearGradient
                      colors={["#6C5DD3", "#8676FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.joinGradient}
                    >
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Typography
                        variant="body"
                        weight="semibold"
                        style={{ color: "#FFFFFF" }}
                      >
                        Join Community
                      </Typography>
                    </LinearGradient>
                  </Animated.View>
                </Pressable>
                {group.memberCount > 0 && (
                  <Typography
                    variant="caption"
                    style={styles.memberCount}
                  >
                    {group.memberCount.toLocaleString()} members
                  </Typography>
                )}
              </View>
            ) : (
              // No group exists yet - show Start Community button
              <Pressable
                onPressIn={() => {
                  joinScale.value = withSpring(0.96);
                }}
                onPressOut={() => {
                  joinScale.value = withSpring(1);
                }}
                onPress={handleStartCommunity}
              >
                <Animated.View
                  style={[styles.startButton, joinScaleStyle]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    Start Community
                  </Typography>
                </Animated.View>
              </Pressable>
            )}
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}
