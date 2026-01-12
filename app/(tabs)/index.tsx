// app/(tabs)/index.tsx (Main Feed Screen - Themed & Animated)
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import CareerPathDetails from "@/components/CareerPathDetails";
import CommunityPost from "@/components/CommunityPost";
import FilterModal from "@/components/FilterModal";
import { Loader } from "@/components/Loader";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Typography } from "@/components/ui/Typography";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import type {
  CommunityPost as CommunityPostType,
  FilterOption,
} from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";

export default function FeedScreen() {
  const { signOut } = useAuth();
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    Id<"FilterOption">[]
  >([]);
  const [showFilterModal, setShowFilterModal] =
    useState(false);

  // Animation values
  const headerOpacity = useSharedValue(1);
  const filterScale = useSharedValue(1);

  const isViewingSpecificPath = selectedFilters.length > 0;
  const lastSelectedFilterId = isViewingSpecificPath
    ? selectedFilters[selectedFilters.length - 1]
    : null;

  // Queries
  const selectedFilterDetails = useQuery(
    api.filter.getFilterOptionById,
    lastSelectedFilterId
      ? { filterOptionId: lastSelectedFilterId }
      : "skip"
  );

  // Use hierarchical query when filters are selected, otherwise get all published posts
  const communityPostsResult = useQuery(
    api.communityPosts.getCommunityPostsByFilterHierarchy,
    lastSelectedFilterId
      ? {
          filterOptionId: lastSelectedFilterId,
          statusFilter: "published",
        }
      : "skip"
  );

  // Get all published posts when no filters are selected
  const allCommunityPosts = useQuery(
    api.communityPosts.getCommunityPosts,
    !lastSelectedFilterId
      ? { statusFilter: "published" }
      : "skip"
  );

  const activeFilterNames = useQuery(
    api.filter.getFilterNamesByIds,
    selectedFilters.length > 0
      ? { filterIds: selectedFilters }
      : "skip"
  );

  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    logoutButton: {
      position: "absolute" as const,
      right: theme.spacing.xl,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    filterSection: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      alignItems: "center" as const,
    },
    filterChipContainer: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      alignItems: "center" as const,
    },
    filterChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      maxWidth: "90%" as const,
    },
    clearFilterButton: {
      backgroundColor: theme.colors.borderLight,
      borderRadius: theme.borderRadius.full,
      padding: theme.spacing.xs,
    },
    contentContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing["6xl"],
    },
    emptyStateContainer: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: theme.spacing["6xl"],
      paddingHorizontal: theme.spacing.xl,
    },
    sectionContainer: {
      marginTop: theme.spacing["4xl"],
      paddingVertical: theme.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  }));

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const filterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterScale.value }],
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    headerOpacity.value = withTiming(0.8, {
      duration: 200,
    });
    setTimeout(() => {
      setRefreshing(false);
      headerOpacity.value = withTiming(1, {
        duration: 200,
      });
    }, 1000);
  }, [headerOpacity, setRefreshing]);

  // Loading state handling
  const postsToDisplay = isViewingSpecificPath
    ? communityPostsResult
    : allCommunityPosts;

  if (postsToDisplay === undefined) {
    return <Loader />;
  }

  if (
    isViewingSpecificPath &&
    selectedFilterDetails === undefined
  ) {
    return <Loader />;
  }

  const handleFilterPress = () => {
    filterScale.value = withSpring(0.95, {
      damping: 10,
      stiffness: 400,
    });
    setTimeout(() => {
      filterScale.value = withSpring(1, {
        damping: 10,
        stiffness: 400,
      });
      setShowFilterModal(true);
    }, 100);
  };

  const handleClearFilters = () => {
    setSelectedFilters([]);
  };

  const handleSignOut = () => {
    signOut();
  };

  // Display content logic
  const displayContent = () => {
    if (!isViewingSpecificPath) {
      // No filters selected - show general community posts
      if (!postsToDisplay || postsToDisplay.length === 0) {
        return (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="information-circle-outline"
              size={40}
              color={theme.colors.textMuted}
            />
            <Typography
              variant="body"
              color="textSecondary"
              align="center"
              style={{ marginTop: theme.spacing.lg }}
            >
              No community posts yet. Explore career paths
              or be the first to share!
            </Typography>
            <AnimatedButton
              title="Open Filter"
              onPress={() => setShowFilterModal(true)}
              variant="outline"
              style={{ marginTop: theme.spacing.xl }}
            />
          </View>
        );
      }

      return (
        <FlatList
          data={postsToDisplay}
          renderItem={({ item, index }) => (
            <AnimatedCard
              delay={index * 100}
              style={{ marginBottom: theme.spacing.lg }}
            >
              <CommunityPost
                post={item as CommunityPostType}
              />
            </AnimatedCard>
          )}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      );
    } else {
      // Filters selected - display detailed path info
      const finalFilterOption =
        selectedFilterDetails as FilterOption | null;

      if (!finalFilterOption) {
        return (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="warning-outline"
              size={40}
              color={theme.colors.warning}
            />
            <Typography
              variant="body"
              color="textSecondary"
              align="center"
              style={{ marginTop: theme.spacing.lg }}
            >
              Details for this selected path are not
              available. Try another selection.
            </Typography>
            <AnimatedButton
              title="Open Filter"
              onPress={() => setShowFilterModal(true)}
              variant="outline"
              style={{ marginTop: theme.spacing.xl }}
            />
          </View>
        );
      }

      // Check if FilterOption has content to display
      const hasPathContent =
        finalFilterOption.description ||
        finalFilterOption.requirements ||
        finalFilterOption.avgSalary ||
        finalFilterOption.relevantExams ||
        finalFilterOption.image;

      return (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {hasPathContent ? (
            <AnimatedCard delay={0}>
              <CareerPathDetails
                filterOption={finalFilterOption}
              />
            </AnimatedCard>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="information-circle-outline"
                size={40}
                color={theme.colors.textMuted}
              />
              <Typography
                variant="body"
                color="textSecondary"
                align="center"
                style={{ marginTop: theme.spacing.lg }}
              >
                No detailed content available for &ldquo;
                {finalFilterOption.name}&rdquo;. Explore
                sub-categories or check community
                discussions.
              </Typography>
              {(!postsToDisplay ||
                postsToDisplay.length === 0) && (
                <Typography
                  variant="caption"
                  color="textMuted"
                  align="center"
                  style={{ marginTop: theme.spacing.md }}
                >
                  No community discussions found for this
                  path yet.
                </Typography>
              )}
            </View>
          )}

          {/* Community posts related to this path */}
          {postsToDisplay && postsToDisplay.length > 0 && (
            <View style={styles.sectionContainer}>
              <Typography
                variant="h3"
                color="text"
                style={{
                  marginBottom: theme.spacing.lg,
                  textAlign: "center",
                }}
              >
                Community Discussions on{" "}
                {finalFilterOption.name}
              </Typography>
              {postsToDisplay.map((item, index) => (
                <AnimatedCard
                  key={item._id}
                  delay={(index + 1) * 100}
                  style={{ marginBottom: theme.spacing.lg }}
                >
                  <CommunityPost
                    post={item as CommunityPostType}
                  />
                </AnimatedCard>
              ))}
            </View>
          )}
        </ScrollView>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Modern Dark Header */}
      <Animated.View
        style={[styles.header, headerAnimatedStyle]}
      >
        <Typography
          variant="h2"
          color="text"
          weight="bold"
          style={{ flex: 1, textAlign: "center" }}
        >
          Jobs & Skills
        </Typography>
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.logoutButton}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* MODERN FILTER BUTTON */}
      <View style={styles.filterSection}>
        <Animated.View style={filterAnimatedStyle}>
          <AnimatedButton
            title="Filter"
            onPress={handleFilterPress}
            variant="primary"
            icon={
              <Ionicons
                name="options-outline"
                size={20}
                color={theme.colors.background}
              />
            }
          />
        </Animated.View>
      </View>

      {/* APPLIED FILTERS CHIP */}
      {selectedFilters.length > 0 && (
        <View style={styles.filterChipContainer}>
          <View style={styles.filterChip}>
            <Typography
              variant="caption"
              color="textSecondary"
              style={{
                flex: 1,
                marginRight: theme.spacing.sm,
              }}
            >
              Applied:{" "}
              {activeFilterNames
                ? activeFilterNames
                    .filter((opt) => opt)
                    .map((opt) => opt!.name)
                    .join(" > ")
                : "Loading..."}
            </Typography>
            <TouchableOpacity
              onPress={handleClearFilters}
              style={styles.clearFilterButton}
            >
              <Ionicons
                name="close"
                size={16}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {displayContent()}

      <FilterModal
        isVisible={showFilterModal}
        initialSelected={selectedFilters}
        onApply={(filters) => {
          setSelectedFilters(filters);
          setShowFilterModal(false);
        }}
        onCancel={() => setShowFilterModal(false)}
      />
    </SafeAreaView>
  );
}
