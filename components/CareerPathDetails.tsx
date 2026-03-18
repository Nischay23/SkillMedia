// components/CareerPathDetails.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Share,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useThemedStyles, useTheme } from "@/providers/ThemeProvider";
import RankingBadge from "@/components/RankingBadge";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";

import { FilterOption } from "@/types";

interface CareerPathDetailsProps {
  filterOption: FilterOption;
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
  const toggleSaveMutation = useMutation(
    api.savedContent.toggleSave,
  );

  const handleSave = async () => {
    if (!clerkUser) return;
    try {
      await toggleSaveMutation({
        filterOptionId: filterOption._id,
      });
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
      backgroundColor: t.colors.surface,
      borderRadius: t.borderRadius["2xl"],
      overflow: "hidden" as const,
      marginVertical: t.spacing.md,
      marginHorizontal: t.spacing.sm,
      ...t.shadows.md,
      shadowColor: t.colors.shadow,
    },
    header: {
      padding: t.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    headerTopRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: t.spacing.sm,
    },
    title: {
      fontFamily: t.typography.fontFamily.bold,
      fontSize: t.typography.size["2xl"],
      lineHeight: t.typography.lineHeight["2xl"],
      color: t.colors.text,
      flex: 1,
    },
    typeBadge: {
      backgroundColor: t.colors.primaryLight,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.borderRadius.md,
    },
    typeText: {
      fontFamily: t.typography.fontFamily.semibold,
      fontSize: t.typography.size.xs,
      color: t.colors.primary,
      textTransform: "uppercase" as const,
    },
    image: {
      width: "100%" as const,
      height: 200,
    },
    section: {
      padding: t.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    sectionTitleRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: t.spacing.sm,
      marginBottom: t.spacing.md,
    },
    sectionTitle: {
      fontFamily: t.typography.fontFamily.semibold,
      fontSize: t.typography.size.lg,
      color: t.colors.text,
    },
    description: {
      fontFamily: t.typography.fontFamily.regular,
      fontSize: t.typography.size.sm,
      lineHeight: t.typography.lineHeight.sm,
      color: t.colors.textSecondary,
    },
    salaryCard: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: t.colors.primaryLight,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      borderRadius: t.borderRadius.lg,
      gap: t.spacing.md,
    },
    salaryText: {
      fontFamily: t.typography.fontFamily.semibold,
      fontSize: t.typography.size.lg,
      color: t.colors.primary,
    },
    vacancyRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginTop: t.spacing.md,
      backgroundColor: t.colors.surfaceLight,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      borderRadius: t.borderRadius.lg,
      gap: t.spacing.md,
    },
    vacancyText: {
      fontFamily: t.typography.fontFamily.regular,
      fontSize: t.typography.size.sm,
      color: t.colors.textSecondary,
    },
    requirementRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      marginBottom: t.spacing.sm,
      gap: t.spacing.sm,
    },
    requirementText: {
      fontFamily: t.typography.fontFamily.regular,
      fontSize: t.typography.size.sm,
      lineHeight: t.typography.lineHeight.sm,
      color: t.colors.textSecondary,
      flex: 1,
    },
    examContainer: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: t.spacing.sm,
    },
    examTag: {
      backgroundColor: t.colors.surfaceLight,
      paddingHorizontal: t.spacing.md,
      paddingVertical: 6,
      borderRadius: t.borderRadius.full,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    examText: {
      fontFamily: t.typography.fontFamily.regular,
      fontSize: t.typography.size.xs,
      color: t.colors.text,
    },
    articleCard: {
      backgroundColor: t.colors.surfaceLight,
      borderRadius: t.borderRadius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginBottom: t.spacing.sm,
      overflow: "hidden" as const,
    },
    articleHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      padding: t.spacing.lg,
    },
    articleTitle: {
      fontFamily: t.typography.fontFamily.semibold,
      fontSize: t.typography.size.sm,
      color: t.colors.text,
      flex: 1,
    },
    articleContent: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      paddingTop: t.spacing.md,
    },
    articleText: {
      fontFamily: t.typography.fontFamily.regular,
      fontSize: t.typography.size.sm,
      lineHeight: t.typography.lineHeight.sm,
      color: t.colors.textSecondary,
    },
    articlesLoading: {
      paddingVertical: t.spacing.xl,
      alignItems: "center" as const,
    },
    emptyArticles: {
      fontFamily: t.typography.fontFamily.regular,
      fontSize: t.typography.size.sm,
      color: t.colors.textMuted,
      textAlign: "center" as const,
      paddingVertical: t.spacing.lg,
    },
    actionContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-around" as const,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
    },
    actionButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      borderRadius: t.borderRadius.full,
      borderWidth: 1,
      borderColor: t.colors.primary,
      gap: t.spacing.xs,
    },
    activeButton: {
      backgroundColor: t.colors.primary,
    },
    actionText: {
      fontFamily: t.typography.fontFamily.regular,
      fontSize: t.typography.size.sm,
      color: t.colors.primary,
    },
    activeText: {
      color: "#FFFFFF",
    },
  }));

  // Parse requirements
  const requirements = filterOption.requirements
    ? filterOption.requirements
        .split(/,|\n/)
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

  const makeStagger = (index: number) =>
    FadeInDown.delay(index * 80)
      .duration(400)
      .springify()
      .damping(18);

  let sectionIndex = 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={makeStagger(sectionIndex++)}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>{filterOption.name}</Text>
          {filterOption.ranking != null && filterOption.ranking > 0 && (
            <RankingBadge ranking={filterOption.ranking} />
          )}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {filterOption.type}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Career path image */}
      {filterOption.image && (
        <Image
          source={{ uri: filterOption.image }}
          style={styles.image}
          contentFit="cover"
        />
      )}

      {/* Section 1: Overview */}
      {filterOption.description && (
        <Animated.View
          entering={makeStagger(sectionIndex++)}
          style={styles.section}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>
          <Text style={styles.description}>
            {filterOption.description}
          </Text>
        </Animated.View>
      )}

      {/* Section 2: Salary & Vacancies */}
      {(filterOption.avgSalary || (filterOption.annualVacancies != null && filterOption.annualVacancies > 0)) && (
        <Animated.View
          entering={makeStagger(sectionIndex++)}
          style={styles.section}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="cash-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Salary Range</Text>
          </View>
          {filterOption.avgSalary && (
            <View style={styles.salaryCard}>
              <Ionicons
                name="wallet-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.salaryText}>
                {filterOption.avgSalary}
              </Text>
            </View>
          )}
          {filterOption.annualVacancies != null && filterOption.annualVacancies > 0 && (
            <View style={styles.vacancyRow}>
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.vacancyText}>
                ~{filterOption.annualVacancies.toLocaleString()} vacancies per year
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Section 3: Requirements */}
      {requirements.length > 0 && (
        <Animated.View
          entering={makeStagger(sectionIndex++)}
          style={styles.section}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="school-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Requirements</Text>
          </View>
          {requirements.map((req, i) => (
            <View key={i} style={styles.requirementRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={theme.colors.success}
              />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Section 4: Relevant Exams */}
      {exams.length > 0 && (
        <Animated.View
          entering={makeStagger(sectionIndex++)}
          style={styles.section}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Relevant Exams</Text>
          </View>
          <View style={styles.examContainer}>
            {exams.map((exam, i) => (
              <View key={i} style={styles.examTag}>
                <Text style={styles.examText}>{exam}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Section 5: Admin Articles */}
      <Animated.View
        entering={makeStagger(sectionIndex++)}
        style={styles.section}
      >
        <View style={styles.sectionTitleRow}>
          <Ionicons
            name="book-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Articles</Text>
        </View>
        {articles === undefined ? (
          <View style={styles.articlesLoading}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : articles.length > 0 ? (
          articles.map((article) => (
            <Pressable
              key={article._id}
              style={styles.articleCard}
              onPress={() =>
                setExpandedArticle(
                  expandedArticle === article._id ? null : article._id,
                )
              }
            >
              <View style={styles.articleHeader}>
                <Text style={styles.articleTitle}>
                  {article.title}
                </Text>
                <Ionicons
                  name={
                    expandedArticle === article._id
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={18}
                  color={theme.colors.textMuted}
                />
              </View>
              {expandedArticle === article._id && (
                <View style={styles.articleContent}>
                  <Text style={styles.articleText}>
                    {article.content}
                  </Text>
                </View>
              )}
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyArticles}>
            No articles available yet.
          </Text>
        )}
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View
        entering={makeStagger(sectionIndex++)}
        style={styles.actionContainer}
      >
        <Pressable
          style={[styles.actionButton, isSaved && styles.activeButton]}
          onPress={handleSave}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isSaved ? "#FFFFFF" : theme.colors.primary}
          />
          <Text style={[styles.actionText, isSaved && styles.activeText]}>
            {isSaved ? "Saved" : "Save"}
          </Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleShare}>
          <Ionicons
            name="share-social-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>

        <Pressable style={styles.actionButton}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.actionText}>
            {filterOption.comments || 0}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
