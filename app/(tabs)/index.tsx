// app/(tabs)/index.tsx — Dual-feed layout (filtered hero + explore mode)
import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import CareerPathHeroCard from "@/components/cards/CareerPathHeroCard";
import CommentsModal from "@/components/CommentsModal";
import CommunityPost from "@/components/CommunityPost";
import FilterChipsBar from "@/components/FilterChipsBar";
import FilterModal from "@/components/FilterModal";
import PostCardWrapper from "@/components/PostCardWrapper";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { EmptyState } from "@/components/ui/EmptyState";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import {
  FeedSkeletonLoader,
  FilteredFeedSkeleton,
} from "@/components/ui/SkeletonLoader";
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
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

// ─── Career facts (shown during refresh) ──────────────
const CAREER_FACTS = [
  "💡 The tech industry adds ~200k new jobs every year in SA.",
  "📈 Data analysts are among the fastest-growing roles worldwide.",
  "🎓 70% of employers value skills over formal degrees.",
  "🌍 Remote work opportunities grew 300% since 2020.",
  "🔧 Skilled trades have a 98% employment rate within 6 months.",
  "💰 Cloud engineers earn 20% more than the industry average.",
  "📊 Digital marketing roles grew 33% in the last 2 years.",
  "🏗️ South Africa needs 30,000 more engineers by 2030.",
  "🤖 AI & ML skills command a 35% salary premium.",
  "📱 Mobile development remains a top-5 in-demand skill.",
];

// ─── Component ─────────────────────────────────────────
export default function FeedScreen() {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const currentUser = useQuery(api.users.getCurrentUser);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    Id<"FilterOption">[]
  >([]);
  const [showFilterModal, setShowFilterModal] =
    useState(false);
  const [careerFact, setCareerFact] = useState("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const factIndexRef = useRef(0);

  // Animation
  const headerOpacity = useSharedValue(1);
  const spinValue = useSharedValue(0);

  // Derived state
  const isViewingSpecificPath = selectedFilters.length > 0;
  const lastSelectedFilterId = isViewingSpecificPath
    ? selectedFilters[selectedFilters.length - 1]
    : null;

  // ─── Queries ───────────────────────────────────────────
  const selectedFilterDetails = useQuery(
    api.filter.getFilterOptionById,
    lastSelectedFilterId
      ? { filterOptionId: lastSelectedFilterId }
      : "skip",
  );

  const communityPostsResult = useQuery(
    api.communityPosts.getCommunityPostsByFilterHierarchy,
    lastSelectedFilterId
      ? {
          filterOptionId: lastSelectedFilterId,
          statusFilter: "published",
        }
      : "skip",
  );

  // ─── Paginated feed state ──────────────────────────────
  const PAGE_SIZE = 10;

  // Must declare before paginated queries that depend on it
  const hasCompletedOnboarding = useQuery(
    api.userPreferences.checkOnboardingStatus,
  );

  // Cursor = the _id of the last post we've seen. null = start.
  const [cursor, setCursor] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<
    CommunityPostType[]
  >([]);
  const [isDone, setIsDone] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Main paginated queries — always run with current cursor
  const personalizedPage = useQuery(
    api.communityPosts.paginatePersonalizedFeed,
    hasCompletedOnboarding && !lastSelectedFilterId
      ? { paginationOpts: { numItems: PAGE_SIZE, cursor } }
      : "skip",
  );

  const regularPage = useQuery(
    api.communityPosts.paginateCommunityPosts,
    !hasCompletedOnboarding && !lastSelectedFilterId
      ? {
          paginationOpts: { numItems: PAGE_SIZE, cursor },
          statusFilter: "published",
        }
      : "skip",
  );

  // Which paginated result to use
  const activePage = hasCompletedOnboarding
    ? personalizedPage
    : regularPage;

  // Accumulate pages into allPosts
  useEffect(() => {
    if (!activePage) return;
    const newPosts = activePage.page as CommunityPostType[];
    if (cursor === null) {
      // First page — replace everything
      setAllPosts(newPosts);
    } else {
      // Subsequent pages — append, dedup by _id
      setAllPosts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        return [
          ...prev,
          ...newPosts.filter((p) => !seen.has(p._id)),
        ];
      });
    }
    setIsDone(activePage.isDone);
    setLoadingMore(false);
  }, [activePage]);

  // Reset pagination when feed type changes (filter toggled, onboarding changes)
  useEffect(() => {
    setCursor(null);
    setAllPosts([]);
    setIsDone(false);
  }, [lastSelectedFilterId, hasCompletedOnboarding]);

  const handleLoadMore = useCallback(() => {
    if (isDone || loadingMore || !activePage) return;
    setLoadingMore(true);
    setCursor(activePage.continueCursor ?? null);
  }, [isDone, loadingMore, activePage]);

  // Recommended posts for carousel (still used in explore header)
  const recommendedPosts = useQuery(
    api.communityPosts.getRecommendedPosts,
    hasCompletedOnboarding && !lastSelectedFilterId
      ? { limit: 8 }
      : "skip",
  );

  // Active filter names for breadcrumb chips
  const activeFilterNames = useQuery(
    api.filter.getFilterNamesByIds,
    selectedFilters.length > 0
      ? { filterIds: selectedFilters }
      : "skip",
  );

  // Saved state for the hero card
  const isPathSaved = useQuery(
    api.savedContent.getIsSaved,
    lastSelectedFilterId && clerkUser
      ? { filterOptionId: lastSelectedFilterId }
      : "skip",
  );

  const toggleSaveMutation = useMutation(
    api.savedContent.toggleSave,
  );

  // State for comments modal (used by all card types)
  const [commentsPostId, setCommentsPostId] =
    useState<Id<"communityPosts"> | null>(null);

  // ─── Themed styles ─────────────────────────────────────
  const postsToDisplay = isViewingSpecificPath
    ? communityPostsResult
    : activePage === undefined && allPosts.length === 0
      ? undefined
      : allPosts;

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      backgroundColor: t.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
      zIndex: 10,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center" as const,
    },
    headerButton: {
      padding: t.spacing.sm,
      borderRadius: t.borderRadius.md,
      backgroundColor: t.colors.surface,
    },
    scrollContent: {
      paddingTop: t.spacing.sm,
      paddingBottom: 90,
    },
    heroSection: {
      marginTop: t.spacing.lg,
      marginBottom: t.spacing.xl,
    },
    sectionHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: t.spacing.sm,
      marginBottom: t.spacing.lg,
    },
    sectionDivider: {
      marginTop: t.spacing.xl,
      paddingTop: t.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    emptyState: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: t.spacing["6xl"],
      paddingHorizontal: t.spacing.xl,
    },
    flatListContent: {
      paddingTop: t.spacing.sm,
      paddingBottom: 90,
    },
    refreshBanner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: t.spacing.md,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      marginHorizontal: t.spacing.lg,
      marginBottom: t.spacing.sm,
      backgroundColor: t.colors.primary + "12",
      borderRadius: t.borderRadius.lg,
    },
  }));

  // ─── Animated styles ───────────────────────────────────
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // ─── Callbacks ─────────────────────────────────────────
  const onRefresh = useCallback(() => {
    // Pick the next career fact (round-robin so no repeats in a row)
    const fact =
      CAREER_FACTS[
        factIndexRef.current % CAREER_FACTS.length
      ];
    factIndexRef.current += 1;
    setCareerFact(fact);
    setRefreshing(true);

    // Reset pagination
    setCursor(null);
    setIsDone(false);

    // Animate header dim + compass spin
    headerOpacity.value = withTiming(0.8, {
      duration: 200,
    });
    spinValue.value = 0;
    spinValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 0 }),
      ),
      -1, // infinite while refreshing
    );

    // Convex queries are reactive — data auto-updates.
    // The timeout gives the fact time to be read.
    setTimeout(() => {
      setRefreshing(false);
      headerOpacity.value = withTiming(1, {
        duration: 200,
      });
      spinValue.value = withTiming(0, { duration: 200 });
    }, 1500);
  }, [headerOpacity, spinValue]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinValue.value * 360}deg` }],
  }));

  const handleFilterPress = useCallback(() => {
    Haptics.selectionAsync();
    setShowFilterModal(true);
  }, []);

  const handleChipPress = useCallback((index: number) => {
    setSelectedFilters((prev) => prev.slice(0, index + 1));
    setShowFilterModal(true);
  }, []);

  const handleClearFilters = useCallback(
    () => setSelectedFilters([]),
    [],
  );

  const handleSavePath = useCallback(async () => {
    if (!clerkUser || !lastSelectedFilterId) return;
    // Important action — use medium haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleSaveMutation({
      filterOptionId: lastSelectedFilterId,
    });
  }, [clerkUser, lastSelectedFilterId, toggleSaveMutation]);

  const handleSharePath = useCallback(async () => {
    const name =
      selectedFilterDetails?.name ?? "this career path";
    const deepLink = lastSelectedFilterId
      ? `skillmedia://career/${lastSelectedFilterId}`
      : "";
    await Share.share({
      message: `Check out ${name} on SkillsApp!${
        deepLink ? `\n${deepLink}` : ""
      }`,
    });
  }, [selectedFilterDetails, lastSelectedFilterId]);

  const handleDeepDive = useCallback(() => {
    // Scroll is already showing the related posts below the hero card
  }, []);

  const handleOpenComments = useCallback(
    (id: Id<"communityPosts">) => setCommentsPostId(id),
    [],
  );

  // ─── Loading guards ────────────────────────────────────

  // Disable entering animations after first data load
  useEffect(() => {
    if (postsToDisplay !== undefined && isFirstLoad) {
      const timer = setTimeout(
        () => setIsFirstLoad(false),
        800,
      );
      return () => clearTimeout(timer);
    }
  }, [postsToDisplay, isFirstLoad]);

  // ─── Post-type detection ─── (memoized predicates) ────
  const QUESTION_PATTERN = useMemo(
    () =>
      /^(who|what|when|where|why|how|is|are|can|do|does|should|would|could|has|have|any\s|which|did)\b/i,
    [],
  );

  const isExpertPost = useCallback(
    (post: CommunityPostType): boolean =>
      post.user?.isAdmin === true,
    [],
  );

  const isDiscussionPost = useCallback(
    (post: CommunityPostType): boolean => {
      const text = (
        post.title ||
        post.content ||
        ""
      ).trim();
      return (
        QUESTION_PATTERN.test(text) || text.endsWith("?")
      );
    },
    [QUESTION_PATTERN],
  );

  // ─── Item separator (stable reference) ────────────────
  const ItemSeparator = useMemo(
    () =>
      React.memo(() => (
        <View
          style={{
            height: 8,
            backgroundColor: theme.colors.background,
          }}
        />
      )),
    [theme.colors.background],
  );

  // ─── Load More Footer ─────────────────────────────────
  const ListFooter = useMemo(() => {
    if (isViewingSpecificPath) return null;
    if (isDone && allPosts.length > 0) {
      return (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            alignItems: "center",
            paddingVertical: 24,
          }}
        >
          <Typography variant="caption" color="textMuted">
            You're all caught up ✓
          </Typography>
        </Animated.View>
      );
    }
    if (!isDone && allPosts.length > 0) {
      return (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            alignItems: "center",
            paddingVertical: 20,
          }}
        >
          <TouchableOpacity
            onPress={handleLoadMore}
            disabled={loadingMore}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 999,
            }}
          >
            {loadingMore ? (
              <>
                <Ionicons
                  name="hourglass-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="body"
                  weight="medium"
                  color="primary"
                >
                  Loading…
                </Typography>
              </>
            ) : (
              <>
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="body"
                  weight="medium"
                  color="primary"
                >
                  Load More
                </Typography>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    }
    return null;
  }, [
    isDone,
    allPosts.length,
    loadingMore,
    handleLoadMore,
    isViewingSpecificPath,
    theme,
  ]);

  // ─── Render helpers (memoized) ─────────────────────────
  const renderPostItem = useCallback(
    ({
      item,
      index,
    }: {
      item: CommunityPostType;
      index: number;
    }) => {
      // Cap stagger at 5 items (index 0-4) × 60ms = 300ms max (under 400ms budget)
      const staggerDelay = Math.min(index * 60, 300);

      if (isExpertPost(item)) {
        return (
          <AnimatedCard
            variant="transparent"
            delay={staggerDelay}
            useEnteringAnimation={isFirstLoad}
          >
            <PostCardWrapper
              post={item}
              variant="expert"
              onOpenComments={() =>
                handleOpenComments(item._id)
              }
            />
          </AnimatedCard>
        );
      }

      if (isDiscussionPost(item)) {
        return (
          <AnimatedCard
            variant="transparent"
            delay={staggerDelay}
            useEnteringAnimation={isFirstLoad}
          >
            <PostCardWrapper
              post={item}
              variant="discussion"
              onOpenComments={() =>
                handleOpenComments(item._id)
              }
            />
          </AnimatedCard>
        );
      }

      return (
        <AnimatedCard
          variant="transparent"
          delay={staggerDelay}
          useEnteringAnimation={isFirstLoad}
        >
          <CommunityPost
            post={item}
            onOpenComments={() =>
              handleOpenComments(item._id)
            }
          />
        </AnimatedCard>
      );
    },
    [
      isFirstLoad,
      isExpertPost,
      isDiscussionPost,
      handleOpenComments,
    ],
  );

  const renderEmptyExplore = useCallback(
    () => (
      <EmptyState
        type="no-filters"
        title="Explore Careers"
        description="Explore careers using the filter to discover posts, or be the first to share!"
        actionLabel="Open Filter"
        onAction={handleFilterPress}
      />
    ),
    [handleFilterPress],
  );

  const renderEmptyFiltered = useCallback(
    (name: string) => (
      <EmptyState
        type="no-posts"
        title="No Community Posts"
        description={`Join communities from career cards to see and share discussions about "${name}".`}
        icon="people-outline"
        iconSize={56}
        actionLabel="Open Filter"
        onAction={handleFilterPress}
      />
    ),
    [handleFilterPress],
  );

  // ─── Loading guards ────────────────────────────────────

  if (postsToDisplay === undefined) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
        }}
      >
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={
            isDark ? "light-content" : "dark-content"
          }
        />
        {isViewingSpecificPath ? (
          <FilteredFeedSkeleton />
        ) : (
          <FeedSkeletonLoader count={4} />
        )}
      </SafeAreaView>
    );
  }

  if (
    isViewingSpecificPath &&
    selectedFilterDetails === undefined
  ) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
        }}
      >
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={
            isDark ? "light-content" : "dark-content"
          }
        />
        <FilteredFeedSkeleton />
      </SafeAreaView>
    );
  }

  // ─── Filtered mode (hero card + related posts) ────────
  const renderFilteredFeed = () => {
    const filterOption =
      selectedFilterDetails as FilterOption | null;

    if (!filterOption) {
      return (
        <EmptyState
          type="error"
          title="Path Unavailable"
          description="Details for this path are not available. Try another selection."
          actionLabel="Open Filter"
          onAction={handleFilterPress}
        />
      );
    }

    const posts = postsToDisplay ?? [];

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressViewOffset={-100}
          />
        }
      >
        {/* Career fact banner */}
        {refreshing && careerFact ? (
          <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(200)}
            style={styles.refreshBanner}
          >
            <Animated.View style={spinStyle}>
              <Ionicons
                name="compass-outline"
                size={20}
                color={theme.colors.primary}
              />
            </Animated.View>
            <Typography
              variant="caption"
              color="primary"
              weight="medium"
              style={{ flex: 1 }}
            >
              {careerFact}
            </Typography>
          </Animated.View>
        ) : null}

        {/* Hero Card */}
        <View style={styles.heroSection}>
          <CareerPathHeroCard
            title={filterOption.name}
            description={filterOption.description ?? ""}
            salary={filterOption.avgSalary}
            requirements={filterOption.requirements}
            exams={filterOption.relevantExams}
            category={filterOption.type ?? "default"}
            filterOptionId={filterOption._id}
            ranking={filterOption.ranking}
            annualVacancies={filterOption.annualVacancies}
            isSaved={isPathSaved === true}
            onSave={handleSavePath}
            onShare={handleSharePath}
            onDeepDive={handleDeepDive}
          />
        </View>

        {/* Related Posts Section */}
        <View style={styles.sectionDivider}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Typography variant="h3" color="text">
              Related Discussions
            </Typography>
          </View>

          {posts.length > 0
            ? posts.map((item, index) => {
                const post = item as CommunityPostType;
                const staggerDelay = Math.min(
                  (index + 1) * 60,
                  300,
                );
                const separator = index > 0 && (
                  <View
                    style={{
                      height: 8,
                      backgroundColor:
                        theme.colors.background,
                    }}
                  />
                );

                if (isExpertPost(post)) {
                  return (
                    <React.Fragment key={post._id}>
                      {separator}
                      <AnimatedCard
                        variant="transparent"
                        delay={staggerDelay}
                        useEnteringAnimation={isFirstLoad}
                      >
                        <PostCardWrapper
                          post={post}
                          variant="expert"
                          onOpenComments={() =>
                            handleOpenComments(post._id)
                          }
                        />
                      </AnimatedCard>
                    </React.Fragment>
                  );
                }
                if (isDiscussionPost(post)) {
                  return (
                    <React.Fragment key={post._id}>
                      {separator}
                      <AnimatedCard
                        variant="transparent"
                        delay={staggerDelay}
                        useEnteringAnimation={isFirstLoad}
                      >
                        <PostCardWrapper
                          post={post}
                          variant="discussion"
                          onOpenComments={() =>
                            handleOpenComments(post._id)
                          }
                        />
                      </AnimatedCard>
                    </React.Fragment>
                  );
                }
                return (
                  <React.Fragment key={post._id}>
                    {separator}
                    <AnimatedCard
                      variant="transparent"
                      delay={staggerDelay}
                      useEnteringAnimation={isFirstLoad}
                    >
                      <CommunityPost
                        post={post}
                        onOpenComments={() =>
                          handleOpenComments(post._id)
                        }
                      />
                    </AnimatedCard>
                  </React.Fragment>
                );
              })
            : renderEmptyFiltered(filterOption.name)}
        </View>
      </ScrollView>
    );
  };

  // ─── Explore mode (all posts) ─────────────────────────
  const renderExploreFeed = () => {
    const posts = postsToDisplay ?? [];

    if (posts.length === 0) return renderEmptyExplore();

    return (
      <FlatList
        data={allPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item._id}
        ItemSeparatorComponent={ItemSeparator}
        ListFooterComponent={ListFooter}
        // Keyboard: dismiss on scroll — no KeyboardAvoidingView needed
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={6}
        getItemLayout={undefined}
        ListHeaderComponent={
          <>
            {/* Personalized feed indicator */}
            {hasCompletedOnboarding &&
              !isViewingSpecificPath && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: theme.spacing.md,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor:
                        theme.colors.primary + "18",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <Ionicons
                      name="sparkles"
                      size={12}
                      color={theme.colors.primary}
                    />
                    <Typography
                      variant="caption"
                      color="primary"
                      weight="medium"
                    >
                      Personalized for you
                    </Typography>
                  </View>
                </Animated.View>
              )}

            {/* Recommended for you carousel */}
            {recommendedPosts &&
              recommendedPosts.length > 0 && (
                <Animated.View
                  entering={FadeIn.duration(400).delay(100)}
                  style={{ marginBottom: theme.spacing.lg }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: theme.spacing.lg,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons
                        name="bulb"
                        size={18}
                        color={theme.colors.warning}
                      />
                      <Typography
                        variant="body"
                        weight="semibold"
                        color="text"
                      >
                        Recommended for you
                      </Typography>
                    </View>
                  </View>
                  <FlatList
                    horizontal
                    data={
                      recommendedPosts as CommunityPostType[]
                    }
                    keyExtractor={(item) =>
                      `rec-${item._id}`
                    }
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: theme.spacing.md,
                      gap: theme.spacing.sm,
                    }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                          setCommentsPostId(item._id)
                        }
                        style={{
                          width: 280,
                          backgroundColor:
                            theme.colors.surface,
                          borderRadius: 16,
                          padding: theme.spacing.md,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 2,
                          },
                          shadowOpacity: 0.08,
                          shadowRadius: 8,
                          elevation: 3,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 10,
                            gap: 10,
                          }}
                        >
                          {item.user?.profileImage ? (
                            <View
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                overflow: "hidden",
                                backgroundColor:
                                  theme.colors.border,
                              }}
                            >
                              <Animated.Image
                                source={{
                                  uri: item.user
                                    .profileImage,
                                }}
                                style={{
                                  width: 36,
                                  height: 36,
                                }}
                              />
                            </View>
                          ) : (
                            <View
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor:
                                  theme.colors.primary +
                                  "30",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons
                                name="person"
                                size={18}
                                color={theme.colors.primary}
                              />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Typography
                              variant="caption"
                              weight="semibold"
                              color="text"
                              numberOfLines={1}
                            >
                              {item.user?.fullname ||
                                item.user?.username ||
                                "User"}
                            </Typography>
                            {item.user?.isAdmin && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Ionicons
                                  name="checkmark-circle"
                                  size={12}
                                  color={
                                    theme.colors.primary
                                  }
                                />
                                <Typography
                                  variant="caption"
                                  color="primary"
                                >
                                  Expert
                                </Typography>
                              </View>
                            )}
                          </View>
                        </View>
                        <Typography
                          variant="body"
                          weight="medium"
                          color="text"
                          numberOfLines={2}
                          style={{ marginBottom: 8 }}
                        >
                          {item.title || item.content}
                        </Typography>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Ionicons
                              name="heart"
                              size={14}
                              color={theme.colors.textMuted}
                            />
                            <Typography
                              variant="caption"
                              color="textMuted"
                            >
                              {item.likes || 0}
                            </Typography>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Ionicons
                              name="chatbubble"
                              size={14}
                              color={theme.colors.textMuted}
                            />
                            <Typography
                              variant="caption"
                              color="textMuted"
                            >
                              {item.comments || 0}
                            </Typography>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </Animated.View>
              )}

            {/* Refresh banner */}
            {refreshing && careerFact ? (
              <Animated.View
                entering={FadeIn.duration(250)}
                exiting={FadeOut.duration(200)}
                style={[
                  styles.refreshBanner,
                  { marginBottom: theme.spacing.lg },
                ]}
              >
                <Animated.View style={spinStyle}>
                  <Ionicons
                    name="compass-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                </Animated.View>
                <Typography
                  variant="caption"
                  color="primary"
                  weight="medium"
                  style={{ flex: 1 }}
                >
                  {careerFact}
                </Typography>
              </Animated.View>
            ) : null}
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressViewOffset={-100}
          />
        }
      />
    );
  };

  // ─── Main render ───────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <Animated.View
        style={[styles.header, headerAnimatedStyle]}
      >
        <Typography
          variant="h2"
          color="text"
          weight="bold"
          style={styles.headerTitle}
        >
          Jobs & Skills
        </Typography>

        <TouchableOpacity
          onPress={handleFilterPress}
          style={styles.headerButton}
        >
          <Ionicons
            name="options-outline"
            size={24}
            color={theme.colors.primary}
          />
          {isViewingSpecificPath && (
            <View
              style={{
                position: "absolute" as const,
                top: 6,
                right: 6,
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: theme.colors.primary,
              }}
            />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Filter Breadcrumbs */}
      <FilterChipsBar
        selectedPath={
          activeFilterNames
            ? activeFilterNames
                .filter((opt) => opt)
                .map((opt) => opt!.name)
            : []
        }
        onChipPress={handleChipPress}
        onClearAll={handleClearFilters}
      />

      {/* Conditional Feed */}
      {isViewingSpecificPath
        ? renderFilteredFeed()
        : renderExploreFeed()}

      <FilterModal
        isVisible={showFilterModal}
        initialSelected={selectedFilters}
        onApply={(filters) => {
          setSelectedFilters(filters);
          setShowFilterModal(false);
        }}
        onCancel={() => setShowFilterModal(false)}
      />

      <FloatingActionButton
        onPress={() => router.push("/(tabs)/create" as any)}
        isAdmin={currentUser?.isAdmin === true}
      />

      {/* Comments Modal for Expert/Discussion cards */}
      {commentsPostId && (
        <CommentsModal
          communityPostId={commentsPostId!}
          visible={!!commentsPostId}
          onClose={() => setCommentsPostId(null)}
        />
      )}
    </SafeAreaView>
  );
}
