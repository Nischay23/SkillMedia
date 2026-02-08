// app/(tabs)/index.tsx — Dual-feed layout (filtered hero + explore mode)
import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
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
import {
  ExpertPostCard,
  DiscussionPostCard,
} from "@/components/cards/PostCardVariants";
import CommunityPost from "@/components/CommunityPost";
import FilterChipsBar from "@/components/FilterChipsBar";
import FilterModal from "@/components/FilterModal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FeedSkeletonLoader,
  FilteredFeedSkeleton,
} from "@/components/ui/SkeletonLoader";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
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
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";

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

  const allCommunityPosts = useQuery(
    api.communityPosts.getCommunityPosts,
    !lastSelectedFilterId
      ? { statusFilter: "published" }
      : "skip",
  );

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

  // ─── Themed styles ─────────────────────────────────────
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
      paddingBottom: t.spacing["6xl"],
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
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: t.spacing["6xl"],
      paddingHorizontal: t.spacing.xl,
    },
    flatListContent: {
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing["6xl"],
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

  const handleFilterPress = () => setShowFilterModal(true);

  const handleChipPress = (index: number) => {
    setSelectedFilters((prev) => prev.slice(0, index + 1));
    setShowFilterModal(true);
  };

  const handleClearFilters = () => setSelectedFilters([]);

  const handleSavePath = async () => {
    if (!clerkUser || !lastSelectedFilterId) return;
    await toggleSaveMutation({
      filterOptionId: lastSelectedFilterId,
    });
  };

  const handleSharePath = async () => {
    const name =
      selectedFilterDetails?.name ?? "this career path";
    await Share.share({
      message: `Check out ${name} on SkillsApp!`,
    });
  };

  const handleDeepDive = () => {
    // Scroll is already showing the related posts below the hero card
  };

  // ─── Loading guards ────────────────────────────────────
  const postsToDisplay = isViewingSpecificPath
    ? communityPostsResult
    : allCommunityPosts;

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

  // ─── Post-type detection ───────────────────────────────
  const QUESTION_PATTERN =
    /^(who|what|when|where|why|how|is|are|can|do|does|should|would|could|has|have|any\s|which|did)\b/i;

  const isExpertPost = (post: CommunityPostType): boolean =>
    post.user?.isAdmin === true;

  const isDiscussionPost = (
    post: CommunityPostType,
  ): boolean => {
    const text = (post.title || post.content || "").trim();
    return (
      QUESTION_PATTERN.test(text) || text.endsWith("?")
    );
  };

  // ─── Shared props mapper ───────────────────────────────
  const formatTimeAgo = (timestamp: number): string => {
    const diffH = (Date.now() - timestamp) / 3_600_000;
    if (diffH < 1)
      return `${Math.max(1, Math.floor(diffH * 60))}m ago`;
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  };

  const toSharedProps = (post: CommunityPostType) => ({
    postId: post._id,
    authorName:
      post.user?.fullname ||
      post.user?.username ||
      "Unknown",
    authorImage: post.user?.profileImage,
    content: post.title || post.content,
    createdAt: formatTimeAgo(post.createdAt),
    likes: post.likes,
    comments: post.comments,
    saves: 0,
    onLike: () => {},
    onComment: () => {},
    onSave: () => {},
  });

  // ─── Item separator ────────────────────────────────────
  const ItemSeparator = () => (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border,
      }}
    />
  );

  // ─── Render helpers ────────────────────────────────────
  const renderPostItem = ({
    item,
    index,
  }: {
    item: CommunityPostType;
    index: number;
  }) => {
    const staggerDelay = Math.min(index * 100, 500);

    if (isExpertPost(item)) {
      return (
        <AnimatedCard
          variant="transparent"
          delay={staggerDelay}
          useEnteringAnimation={isFirstLoad}
        >
          <ExpertPostCard
            {...toSharedProps(item)}
            tags={item.linkedFilterOptionNames}
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
          <DiscussionPostCard
            {...toSharedProps(item)}
            answerCount={item.comments}
            isTrending={item.likes >= 5}
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
        <CommunityPost post={item} />
      </AnimatedCard>
    );
  };

  const renderEmptyExplore = () => (
    <EmptyState
      type="no-filters"
      title="Start Exploring Careers"
      description="Use the filter to discover career paths, or be the first to share a post!"
      actionLabel="Open Filter"
      onAction={handleFilterPress}
    />
  );

  const renderEmptyFiltered = (name: string) => (
    <EmptyState
      type="no-posts"
      title="No Posts Yet"
      description={`No discussions yet for "${name}". Be the first to start one!`}
      icon="chatbubbles-outline"
      iconSize={56}
    />
  );

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
                  (index + 1) * 100,
                  500,
                );
                if (isExpertPost(post)) {
                  return (
                    <React.Fragment key={post._id}>
                      {index > 0 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor:
                              theme.colors.border,
                          }}
                        />
                      )}
                      <AnimatedCard
                        variant="transparent"
                        delay={staggerDelay}
                        useEnteringAnimation={isFirstLoad}
                      >
                        <ExpertPostCard
                          {...toSharedProps(post)}
                          tags={
                            post.linkedFilterOptionNames
                          }
                        />
                      </AnimatedCard>
                    </React.Fragment>
                  );
                }
                if (isDiscussionPost(post)) {
                  return (
                    <React.Fragment key={post._id}>
                      {index > 0 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor:
                              theme.colors.border,
                          }}
                        />
                      )}
                      <AnimatedCard
                        variant="transparent"
                        delay={staggerDelay}
                        useEnteringAnimation={isFirstLoad}
                      >
                        <DiscussionPostCard
                          {...toSharedProps(post)}
                          answerCount={post.comments}
                          isTrending={post.likes >= 5}
                        />
                      </AnimatedCard>
                    </React.Fragment>
                  );
                }
                return (
                  <React.Fragment key={post._id}>
                    {index > 0 && (
                      <View
                        style={{
                          height: 1,
                          backgroundColor:
                            theme.colors.border,
                        }}
                      />
                    )}
                    <AnimatedCard
                      variant="transparent"
                      delay={staggerDelay}
                      useEnteringAnimation={isFirstLoad}
                    >
                      <CommunityPost post={post} />
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
        data={posts as CommunityPostType[]}
        renderItem={renderPostItem}
        keyExtractor={(item) => item._id}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={
          refreshing && careerFact ? (
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
          ) : null
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
    </SafeAreaView>
  );
}
