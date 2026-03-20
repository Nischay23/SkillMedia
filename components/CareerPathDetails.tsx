// components/CareerPathDetails.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useThemedStyles, useTheme } from "@/providers/ThemeProvider";
import { Typography } from "@/components/ui/Typography";
import RankingBadge from "@/components/RankingBadge";
import VacancyChip from "@/components/VacancyChip";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";
import { FilterOption } from "@/types";
import { Id } from "@/convex/_generated/dataModel";

interface CareerPathDetailsProps {
  filterOption: FilterOption;
}

// Skeleton Card for loading state
function SkeletonCard({ height = 80 }: { height?: number }) {
  const styles = useThemedStyles((t) => ({
    skeleton: {
      backgroundColor: t.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      height,
    },
    bar: {
      backgroundColor: t.colors.surfaceLight,
      borderRadius: 8,
      height: 14,
      width: "60%" as const,
      marginBottom: 8,
    },
    barShort: {
      backgroundColor: t.colors.surfaceLight,
      borderRadius: 6,
      height: 10,
      width: "80%" as const,
    },
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={styles.skeleton}
    >
      <View style={styles.bar} />
      <View style={styles.barShort} />
    </Animated.View>
  );
}

// Section Card wrapper
function SectionCard({
  children,
  entering,
}: {
  children: React.ReactNode;
  entering?: any;
}) {
  const styles = useThemedStyles((t) => ({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
    },
  }));

  return (
    <Animated.View entering={entering} style={styles.card}>
      {children}
    </Animated.View>
  );
}

// Section Header with icon
function SectionHeader({
  icon,
  iconColor,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
}) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      marginBottom: 12,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${iconColor}15`,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Typography variant="h4" weight="semibold">
        {title}
      </Typography>
    </View>
  );
}

// Animated Article Card with expand/collapse using height animation
function ArticleCard({
  title,
  content,
  isExpanded,
  onToggle,
}: {
  title: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = useThemedStyles((t) => ({
    card: {
      backgroundColor: t.colors.surfaceLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: "hidden" as const,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      padding: 14,
    },
    title: {
      flex: 1,
      marginRight: 8,
    },
    content: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      paddingTop: 0,
    },
    readMore: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
      marginTop: 8,
    },
  }));

  const preview = content.length > 120 ? content.slice(0, 120) + "..." : content;

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={onToggle}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.header}>
          <Typography variant="body" weight="semibold" style={styles.title}>
            {title}
          </Typography>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.colors.textMuted}
          />
        </View>
        <View style={styles.content}>
          <Typography variant="caption" color="textSecondary">
            {isExpanded ? content : preview}
          </Typography>
          {!isExpanded && (
            <View style={styles.readMore}>
              <Typography variant="caption" color="primary" weight="medium">
                Read more
              </Typography>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={theme.colors.primary}
              />
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function CareerPathDetails({
  filterOption,
}: CareerPathDetailsProps) {
  const { user: clerkUser } = useUser();
  const { theme } = useTheme();
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // Queries
  const isSaved = useQuery(
    api.savedContent.getIsSaved,
    clerkUser
      ? { filterOptionId: filterOption._id }
      : "skip",
  );

  const articles = useQuery(
    api.adminArticles.getArticlesByFilterOption,
    { filterOptionId: filterOption._id },
  );

  // Mutations
  const toggleSaveMutation = useMutation(api.savedContent.toggleSave);

  const handleSave = async () => {
    if (!clerkUser) return;
    try {
      await toggleSaveMutation({ filterOptionId: filterOption._id });
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleShare = async () => {
    const deepLink = `skillmedia://career/${filterOption._id}`;
    await Share.share({
      message: `Check out ${filterOption.name} on SkillsApp!\n${deepLink}`,
    });
  };

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
    },
    scrollContent: {
      gap: 12,
      paddingVertical: 12,
    },
    // Empty state
    emptyState: {
      alignItems: "center" as const,
      paddingVertical: 16,
    },
    emptyIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.surfaceLight,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: 8,
    },
    // Requirements bullet
    bulletRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      marginBottom: 10,
      gap: 10,
    },
    bulletIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(34, 197, 94, 0.15)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: 1,
    },
    // Salary boxes
    salaryContainer: {
      alignItems: "center" as const,
    },
    salaryRow: {
      flexDirection: "row" as const,
      alignItems: "stretch" as const,
      gap: 12,
      marginTop: 8,
    },
    salaryBox: {
      flex: 1,
      backgroundColor: t.colors.surfaceLight,
      borderRadius: 12,
      padding: 16,
      alignItems: "center" as const,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    salaryCombined: {
      backgroundColor: t.colors.surfaceLight,
      borderRadius: 12,
      paddingVertical: 20,
      paddingHorizontal: 24,
      alignItems: "center" as const,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    salaryDivider: {
      width: 1,
      backgroundColor: t.colors.border,
    },
    // Exam cards
    examGrid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
    },
    examCard: {
      backgroundColor: t.colors.surfaceLight,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: t.colors.border,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
    examCardNA: {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      borderColor: "rgba(34, 197, 94, 0.2)",
    },
    // Articles
    articlesContainer: {
      gap: 10,
    },
    // Actions
    actionsRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 12,
      marginTop: 8,
    },
    actionBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: t.colors.primary,
      gap: 6,
    },
    actionBtnActive: {
      backgroundColor: t.colors.primary,
    },
  }));

  // Parse requirements
  const requirements = filterOption.requirements
    ? filterOption.requirements
        .split(/[,\n]/)
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  // Parse exams
  const exams = filterOption.relevantExams
    ? filterOption.relevantExams
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
    : [];

  // Check if exams is just "N/A" or similar
  const isExamsNA =
    exams.length === 0 ||
    (exams.length === 1 && exams[0].toLowerCase() === "n/a");

  // Parse salary range (e.g., "3-6 LPA" or "₹3L - ₹6L")
  const parseSalaryRange = (salary: string) => {
    // Common patterns: "3-6 LPA", "₹3L - ₹6L", "3 - 6 LPA"
    const rangeMatch = salary.match(
      /([₹$]?\d+\.?\d*)\s*[LlKkMm]?\s*[-–to]+\s*([₹$]?\d+\.?\d*)/i
    );
    if (rangeMatch) {
      const from = rangeMatch[1];
      const to = rangeMatch[2];
      // Extract unit suffix if present at end
      const unitMatch = salary.match(/(LPA|L|K|M|lakhs?|crores?)/i);
      const unit = unitMatch ? unitMatch[1] : "";
      return { from, to, unit, isRange: true };
    }
    return { from: salary, to: null, unit: "", isRange: false };
  };

  const salaryParsed = filterOption.avgSalary
    ? parseSalaryRange(filterOption.avgSalary)
    : null;

  const makeStagger = (index: number) =>
    FadeInDown.delay(index * 100)
      .duration(400)
      .springify()
      .damping(18);

  let sectionIndex = 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Section 1: Overview */}
      <SectionCard entering={makeStagger(sectionIndex++)}>
        <SectionHeader
          icon="information-circle-outline"
          iconColor={theme.colors.primary}
          title="Overview"
        />
        {filterOption.description ? (
          <Typography variant="body" color="textSecondary">
            {filterOption.description}
          </Typography>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={theme.colors.textMuted}
              />
            </View>
            <Typography variant="caption" color="textMuted">
              No description available yet
            </Typography>
          </View>
        )}
      </SectionCard>

      {/* Section 2: Requirements */}
      <SectionCard entering={makeStagger(sectionIndex++)}>
        <SectionHeader
          icon="checkmark-circle-outline"
          iconColor="#22C55E"
          title="Requirements"
        />
        {requirements.length > 0 ? (
          requirements.map((req, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bulletIcon}>
                <Ionicons name="checkmark" size={14} color="#22C55E" />
              </View>
              <Typography
                variant="body"
                color="textSecondary"
                style={{ flex: 1 }}
              >
                {req}
              </Typography>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="school-outline"
                size={18}
                color={theme.colors.textMuted}
              />
            </View>
            <Typography variant="caption" color="textMuted">
              No specific requirements listed
            </Typography>
          </View>
        )}
      </SectionCard>

      {/* Section 3: Salary Range */}
      <SectionCard entering={makeStagger(sectionIndex++)}>
        <SectionHeader
          icon="cash-outline"
          iconColor="#F59E0B"
          title="Salary Range"
        />
        {salaryParsed ? (
          <View style={styles.salaryContainer}>
            {salaryParsed.isRange ? (
              <View style={styles.salaryRow}>
                <Animated.View
                  entering={FadeInUp.delay(200).duration(300).springify()}
                  style={styles.salaryBox}
                >
                  <Typography variant="caption" color="textMuted">
                    From
                  </Typography>
                  <Typography
                    variant="h2"
                    weight="bold"
                    style={{ marginTop: 4 }}
                  >
                    {salaryParsed.from}
                  </Typography>
                  {salaryParsed.unit && (
                    <Typography variant="caption" color="textMuted">
                      {salaryParsed.unit}
                    </Typography>
                  )}
                </Animated.View>
                <Animated.View
                  entering={FadeInUp.delay(300).duration(300).springify()}
                  style={styles.salaryBox}
                >
                  <Typography variant="caption" color="textMuted">
                    To
                  </Typography>
                  <Typography
                    variant="h2"
                    weight="bold"
                    style={{ marginTop: 4 }}
                  >
                    {salaryParsed.to}
                  </Typography>
                  {salaryParsed.unit && (
                    <Typography variant="caption" color="textMuted">
                      {salaryParsed.unit}
                    </Typography>
                  )}
                </Animated.View>
              </View>
            ) : (
              <Animated.View
                entering={FadeInUp.delay(200).duration(300).springify()}
                style={styles.salaryCombined}
              >
                <Typography variant="h2" weight="bold" align="center">
                  {filterOption.avgSalary}
                </Typography>
              </Animated.View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="cash-outline"
                size={18}
                color={theme.colors.textMuted}
              />
            </View>
            <Typography variant="caption" color="textMuted">
              Salary data not available
            </Typography>
          </View>
        )}
        {/* Annual vacancies chip */}
        {filterOption.annualVacancies != null &&
          filterOption.annualVacancies > 0 && (
            <View style={{ marginTop: 12, alignItems: "center" }}>
              <VacancyChip annualVacancies={filterOption.annualVacancies} />
            </View>
          )}
      </SectionCard>

      {/* Section 4: Exams */}
      <SectionCard entering={makeStagger(sectionIndex++)}>
        <SectionHeader
          icon="document-text-outline"
          iconColor="#8B5CF6"
          title="Relevant Exams"
        />
        {isExamsNA ? (
          <View style={[styles.examCard, styles.examCardNA]}>
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
            <Typography
              variant="body"
              weight="medium"
              style={{ color: "#22C55E" }}
            >
              No specific exams required
            </Typography>
          </View>
        ) : exams.length > 0 ? (
          <View style={styles.examGrid}>
            {exams.map((exam, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.delay(150 + i * 50)
                  .duration(300)
                  .springify()}
                style={styles.examCard}
              >
                <Ionicons
                  name="school-outline"
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Typography variant="caption">{exam}</Typography>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="help-circle-outline"
                size={18}
                color={theme.colors.textMuted}
              />
            </View>
            <Typography variant="caption" color="textMuted">
              Exam information not available
            </Typography>
          </View>
        )}
      </SectionCard>

      {/* Section 5: Career Insights (Admin Articles) */}
      <SectionCard entering={makeStagger(sectionIndex++)}>
        <SectionHeader
          icon="bulb-outline"
          iconColor={theme.colors.primary}
          title="Career Insights"
        />
        {articles === undefined ? (
          // Loading skeleton
          <View style={styles.articlesContainer}>
            <SkeletonCard height={90} />
            <SkeletonCard height={90} />
          </View>
        ) : articles.length > 0 ? (
          <View style={styles.articlesContainer}>
            {articles.map((article) => (
              <ArticleCard
                key={article._id}
                title={article.title}
                content={article.content}
                isExpanded={expandedArticle === article._id}
                onToggle={() =>
                  setExpandedArticle(
                    expandedArticle === article._id ? null : article._id
                  )
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="library-outline"
                size={18}
                color={theme.colors.textMuted}
              />
            </View>
            <Typography variant="caption" color="textMuted">
              No articles available yet
            </Typography>
          </View>
        )}
      </SectionCard>

      {/* Action buttons */}
      <Animated.View
        entering={makeStagger(sectionIndex++)}
        style={styles.actionsRow}
      >
        <Pressable
          style={[styles.actionBtn, isSaved && styles.actionBtnActive]}
          onPress={handleSave}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={18}
            color={isSaved ? "#FFFFFF" : theme.colors.primary}
          />
          <Typography
            variant="body"
            weight="medium"
            style={{ color: isSaved ? "#FFFFFF" : theme.colors.primary }}
          >
            {isSaved ? "Saved" : "Save"}
          </Typography>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleShare}>
          <Ionicons
            name="share-social-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Typography
            variant="body"
            weight="medium"
            color="primary"
          >
            Share
          </Typography>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}
