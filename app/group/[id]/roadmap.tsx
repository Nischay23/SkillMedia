import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  View,
  Modal,
  Share,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";

import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { useMutation, useQuery } from "convex/react";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedPressable =
  Animated.createAnimatedComponent(Pressable);

// Content type icons
const CONTENT_TYPE_ICONS: Record<
  string,
  { icon: string; color: string }
> = {
  video: { icon: "play-circle", color: "#EF4444" },
  article: { icon: "document-text", color: "#3B82F6" },
  practice: { icon: "code-slash", color: "#10B981" },
  quiz: { icon: "help-circle", color: "#F59E0B" },
  project: { icon: "folder", color: "#8B5CF6" },
};

// Animated Checkbox Component
const AnimatedCheckbox = ({
  isChecked,
  onToggle,
  disabled,
}: {
  isChecked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isChecked ? 1 : 0);

  React.useEffect(() => {
    checkScale.value = withSpring(isChecked ? 1 : 0, {
      damping: 12,
      stiffness: 200,
    });
  }, [isChecked, checkScale]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSpring(0.85, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        {
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: isChecked
            ? theme.colors.primary
            : theme.colors.border,
          backgroundColor: isChecked
            ? theme.colors.primary
            : "transparent",
          alignItems: "center",
          justifyContent: "center",
        },
        containerStyle,
      ]}
      disabled={disabled}
    >
      <Animated.View style={animatedCheckStyle}>
        <Ionicons
          name="checkmark"
          size={16}
          color="#FFFFFF"
        />
      </Animated.View>
    </AnimatedPressable>
  );
};

// Progress Bar Component - FIXED with overshootClamping
const ProgressBar = ({
  progress,
  height = 8,
}: {
  progress: number;
  height?: number;
}) => {
  const { theme } = useTheme();
  const animatedWidth = useSharedValue(progress);
  const isFirstRender = useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      // Instant set on first render
      animatedWidth.value = progress;
      isFirstRender.current = false;
    } else {
      // Animate subsequent changes with overshootClamping
      animatedWidth.value = withSpring(progress, {
        damping: 20,
        stiffness: 180,
        overshootClamping: true,
      });
    }
  }, [progress, animatedWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View
      style={{
        height,
        backgroundColor: theme.colors.border,
        borderRadius: height / 2,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          { height: "100%", borderRadius: height / 2 },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={["#6C5DD3", "#8676FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: height / 2 }}
        />
      </Animated.View>
    </View>
  );
};

// Format estimated time helper
const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
};

// Step Item Component
const StepItem = ({
  step,
  index,
  roadmapId,
  onToggle,
  isToggling,
}: {
  step: {
    _id: Id<"roadmapSteps">;
    title: string;
    description?: string;
    resourceUrl?: string;
    contentType?: string;
    estimatedMinutes?: number;
    isCompleted: boolean;
  };
  index: number;
  roadmapId: Id<"roadmaps">;
  onToggle: (stepId: Id<"roadmapSteps">) => void;
  isToggling: boolean;
}) => {
  const { theme } = useTheme();
  const contentTypeInfo = step.contentType
    ? CONTENT_TYPE_ICONS[step.contentType]
    : null;

  const handleOpenResource = async () => {
    if (step.resourceUrl) {
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light,
      );
      await Linking.openURL(step.resourceUrl);
    }
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).springify()}
      style={{
        flexDirection: "row",
        padding: 12,
        backgroundColor: step.isCompleted
          ? `${theme.colors.success}10`
          : theme.colors.surface,
        borderRadius: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: step.isCompleted
          ? `${theme.colors.success}30`
          : theme.colors.border,
      }}
    >
      {/* Checkbox */}
      <View style={{ marginRight: 10, paddingTop: 2 }}>
        <AnimatedCheckbox
          isChecked={step.isCompleted}
          onToggle={() => onToggle(step._id)}
          disabled={isToggling}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Typography
          variant="body"
          weight="medium"
          color={step.isCompleted ? "textMuted" : "text"}
          style={{
            textDecorationLine: step.isCompleted
              ? "line-through"
              : "none",
          }}
        >
          {step.title}
        </Typography>

        {step.description && (
          <Typography
            variant="caption"
            color="textMuted"
            style={{ marginTop: 4 }}
            numberOfLines={2}
          >
            {step.description}
          </Typography>
        )}

        {/* Meta info row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {contentTypeInfo && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons
                name={contentTypeInfo.icon as any}
                size={14}
                color={contentTypeInfo.color}
              />
              <Typography
                variant="caption"
                color="textMuted"
                style={{ textTransform: "capitalize" }}
              >
                {step.contentType}
              </Typography>
            </View>
          )}

          {/* Estimated time - always show if exists */}
          {step.estimatedMinutes &&
            step.estimatedMinutes > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={theme.colors.textMuted}
                />
                <Typography
                  variant="caption"
                  color="textMuted"
                >
                  {formatEstimatedTime(
                    step.estimatedMinutes,
                  )}
                </Typography>
              </View>
            )}

          {step.resourceUrl && (
            <Pressable
              onPress={handleOpenResource}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: `${theme.colors.primary}15`,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Ionicons
                name="open-outline"
                size={12}
                color={theme.colors.primary}
              />
              <Typography variant="caption" color="primary">
                Open
              </Typography>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// Milestone Card Component
const MilestoneCard = ({
  milestone,
  index,
  roadmapId,
  onToggleStep,
  togglingStepId,
}: {
  milestone: {
    _id: Id<"milestones">;
    title: string;
    description?: string;
    order: number;
    totalSteps: number;
    completedSteps: number;
    isCompleted: boolean;
    steps: Array<{
      _id: Id<"roadmapSteps">;
      title: string;
      description?: string;
      resourceUrl?: string;
      contentType?: string;
      estimatedMinutes?: number;
      isCompleted: boolean;
    }>;
  };
  index: number;
  roadmapId: Id<"roadmaps">;
  onToggleStep: (stepId: Id<"roadmapSteps">) => void;
  togglingStepId: Id<"roadmapSteps"> | null;
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const rotation = useSharedValue(index === 0 ? 1 : 0);

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
    rotation.value = withSpring(isExpanded ? 0 : 1, {
      damping: 15,
    });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg`,
      },
    ],
  }));

  const progressPercent =
    milestone.totalSteps > 0
      ? Math.round(
          (milestone.completedSteps /
            milestone.totalSteps) *
            100,
        )
      : 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={{
        marginBottom: 14,
      }}
    >
      {/* Timeline connector */}
      <View style={{ flexDirection: "row" }}>
        {/* Timeline dot and line */}
        <View
          style={{
            alignItems: "center",
            width: 26,
            marginLeft: 16,
          }}
        >
          {/* Dot - smaller size */}
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: milestone.isCompleted
                ? theme.colors.success
                : theme.colors.primary,
              borderWidth: 2,
              borderColor: milestone.isCompleted
                ? `${theme.colors.success}30`
                : `${theme.colors.primary}30`,
            }}
          />
          {/* Line */}
          <View
            style={{
              flex: 1,
              width: 2,
              backgroundColor: theme.colors.border,
              marginTop: 4,
            }}
          />
        </View>

        {/* Card */}
        <View
          style={{
            flex: 1,
            marginLeft: 10,
            marginRight: 12,
          }}
        >
          <Pressable
            onPress={toggleExpand}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: milestone.isCompleted
                ? `${theme.colors.success}40`
                : theme.colors.border,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <View
              style={{
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {milestone.isCompleted && (
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor:
                          theme.colors.success,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                  <Typography
                    variant="h4"
                    weight="semibold"
                    color="text"
                  >
                    {milestone.title}
                  </Typography>
                </View>

                {milestone.description && (
                  <Typography
                    variant="caption"
                    color="textMuted"
                    style={{ marginTop: 4 }}
                    numberOfLines={2}
                  >
                    {milestone.description}
                  </Typography>
                )}

                {/* Progress info */}
                <View style={{ marginTop: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="textMuted"
                    >
                      {milestone.completedSteps}/
                      {milestone.totalSteps} steps
                    </Typography>
                    <Typography
                      variant="caption"
                      color="primary"
                      weight="semibold"
                    >
                      {progressPercent}%
                    </Typography>
                  </View>
                  <ProgressBar
                    progress={progressPercent}
                    height={5}
                  />
                </View>
              </View>

              <Animated.View
                style={[{ marginLeft: 10 }, chevronStyle]}
              >
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color={theme.colors.textMuted}
                />
              </Animated.View>
            </View>

            {/* Steps */}
            {isExpanded && milestone.steps.length > 0 && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={{
                  paddingHorizontal: 10,
                  paddingBottom: 10,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                }}
              >
                <View style={{ marginTop: 10 }}>
                  {milestone.steps.map(
                    (step, stepIndex) => (
                      <StepItem
                        key={step._id}
                        step={step}
                        index={stepIndex}
                        roadmapId={roadmapId}
                        onToggle={onToggleStep}
                        isToggling={
                          togglingStepId === step._id
                        }
                      />
                    ),
                  )}
                </View>
              </Animated.View>
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

// Empty State Component
const EmptyState = () => {
  const { theme } = useTheme();

  // Pulsing glow animation
  const glowScale = useSharedValue(1);

  // Floating icon animation
  const iconTranslateY = useSharedValue(0);

  useEffect(() => {
    // Pulsing glow
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 }),
      ),
      -1,
      true,
    );

    // Floating icon
    iconTranslateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1000 }),
        withTiming(0, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, [glowScale, iconTranslateY]);

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconTranslateY.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(600).delay(100)}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      {/* Animated icon section */}
      <View
        style={{
          width: 110,
          height: 110,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Pulsing glow behind circle */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: `${theme.colors.primary}15`,
            },
            glowAnimatedStyle,
          ]}
        />

        {/* Circle container */}
        <View
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Floating icon */}
          <Animated.View style={iconAnimatedStyle}>
            <Ionicons
              name="map-outline"
              size={52}
              color={theme.colors.primary}
            />
          </Animated.View>
        </View>
      </View>

      {/* Text section */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(200)}
        style={{ marginTop: 28, alignItems: "center" }}
      >
        <Typography
          variant="h2"
          weight="bold"
          color="text"
          align="center"
        >
          No Roadmap Yet
        </Typography>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(350)}
        style={{
          marginTop: 10,
          maxWidth: 240,
          alignItems: "center",
        }}
      >
        <Typography
          variant="body"
          color="textMuted"
          align="center"
          style={{ lineHeight: 24 }}
        >
          {
            "The admin hasn't created a roadmap\nfor this group yet.\nCheck back later!"
          }
        </Typography>
      </Animated.View>

      {/* Decorative dots */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginTop: 28,
        }}
      >
        <Animated.View
          entering={FadeIn.delay(500)}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.primary,
          }}
        />
        <Animated.View
          entering={FadeIn.delay(600)}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: `${theme.colors.primary}99`,
          }}
        />
        <Animated.View
          entering={FadeIn.delay(700)}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: `${theme.colors.primary}4D`,
          }}
        />
      </View>
    </Animated.View>
  );
};

// Skeleton Shimmer Card
const SkeletonShimmer = ({
  height,
  width: w,
  borderRadius: br = 12,
  style,
}: {
  height: number;
  width?: string | number;
  borderRadius?: number;
  style?: any;
}) => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.15, { duration: 700 }),
      -1,
      true,
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height,
          width: w ?? "100%",
          borderRadius: br,
          backgroundColor: theme.colors.surface,
        },
        pulseStyle,
        style,
      ]}
    />
  );
};

// Loading State Component — skeleton shimmer
const LoadingState = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 12,
        paddingTop: 12,
        gap: 12,
      }}
    >
      {/* Progress header skeleton */}
      <SkeletonShimmer height={140} borderRadius={20} />
      {/* Milestone card skeletons */}
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          entering={FadeInDown.duration(300).delay(i * 80)}
          style={{
            flexDirection: "row",
            gap: 10,
            marginLeft: 16,
          }}
        >
          {/* Timeline dot */}
          <SkeletonShimmer height={10} width={10} borderRadius={5} />
          {/* Card */}
          <SkeletonShimmer
            height={90}
            borderRadius={16}
            style={{ flex: 1, marginRight: 12 }}
          />
        </Animated.View>
      ))}
    </View>
  );
};

// Main Roadmap Screen
export default function RoadmapScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams<{
    id: string;
  }>();

  const [refreshing, setRefreshing] = useState(false);
  const [togglingStepId, setTogglingStepId] =
    useState<Id<"roadmapSteps"> | null>(null);
  const [showCelebration, setShowCelebration] =
    useState(false);
  const celebrationShownRef = useRef(false);

  // Leaderboard sheet ref
  const leaderboardSheetRef = useRef<BottomSheet>(null);

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    content: {
      flex: 1,
    },
    progressHeader: {
      backgroundColor: t.colors.surface,
      borderRadius: 20,
      padding: 16,
      marginTop: 12,
      marginHorizontal: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
  }));

  // Fetch roadmap with details
  const roadmapData = useQuery(
    api.roadmaps.getRoadmapWithDetails,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip",
  );

  // Fetch leaderboard
  const leaderboard = useQuery(
    api.roadmaps.getLeaderboard,
    roadmapData?._id
      ? { roadmapId: roadmapData._id }
      : "skip",
  );

  const toggleStepComplete = useMutation(
    api.roadmaps.toggleStepComplete,
  );

  // Celebration trigger
  useEffect(() => {
    if (
      roadmapData?.progressPercent === 100 &&
      roadmapData?.completedSteps > 0 &&
      !celebrationShownRef.current
    ) {
      // Small delay so progress bar animation finishes first
      setTimeout(() => {
        setShowCelebration(true);
        celebrationShownRef.current = true;
      }, 800);
    }
  }, [
    roadmapData?.progressPercent,
    roadmapData?.completedSteps,
  ]);

  const handleToggleStep = useCallback(
    async (stepId: Id<"roadmapSteps">) => {
      if (!roadmapData || togglingStepId) return;

      setTogglingStepId(stepId);
      try {
        await toggleStepComplete({
          stepId,
          roadmapId: roadmapData._id,
        });
      } catch (error) {
        console.error("Failed to toggle step:", error);
      } finally {
        setTogglingStepId(null);
      }
    },
    [roadmapData, toggleStepComplete, togglingStepId],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Query will auto-refresh
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const isLoading = roadmapData === undefined;

  // Back button animation
  const backButtonScale = useSharedValue(1);

  const handleBackPress = () => {
    backButtonScale.value = withSpring(
      0.9,
      { damping: 10 },
      () => {
        backButtonScale.value = withSpring(1, {
          damping: 12,
        });
      },
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  // Leaderboard sheet handlers
  const handleOpenLeaderboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    leaderboardSheetRef.current?.snapToIndex(0);
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  // Share achievement handler
  const handleShareAchievement = async () => {
    try {
      await Share.share({
        message: `I just completed the "${roadmapData?.title}" roadmap on SkillMedia! #SkillMedia #CareerGoals`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header - uses background color, not surface */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(50)}
        style={{
          backgroundColor: theme.colors.background,
          paddingTop: 12, // Reduced spacing
          paddingHorizontal: 16,
          paddingBottom: 0, // Reduced spacing
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Back button */}
          <AnimatedPressable
            onPress={handleBackPress}
            style={[
              {
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              },
              backButtonAnimatedStyle,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color="#FFFFFF"
            />
          </AnimatedPressable>

          {/* Text section */}
          <View style={{ flex: 1 }}>
            <Typography
              variant="body"
              weight="semibold"
              color="text"
            >
              Learning Roadmap
            </Typography>
            <Typography
              variant="caption"
              color="textMuted"
              style={{ marginTop: 2 }}
            >
              Track your progress
            </Typography>
          </View>

          {/* Trophy button */}
          <Pressable
            onPress={handleOpenLeaderboard}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="trophy-outline"
              size={18}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>

        {/* Bottom accent line */}
        <LinearGradient
          colors={["#6C5DD3", "#8676FF", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 1.5,
            marginTop: 10,
            marginHorizontal: -16,
          }} // Reduced marginTop
        />
      </Animated.View>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : !roadmapData ? (
        <EmptyState />
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: insets.bottom + 84,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Progress Header */}
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.progressHeader}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <LinearGradient
                colors={["#6C5DD3", "#8676FF"]}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="rocket"
                  size={22}
                  color="#FFFFFF"
                />
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Typography variant="h4" weight="semibold">
                  {roadmapData.title}
                </Typography>
                {roadmapData.description && (
                  <Typography
                    variant="caption"
                    color="textMuted"
                    numberOfLines={1}
                  >
                    {roadmapData.description}
                  </Typography>
                )}
              </View>
            </View>

            {/* Overall Progress */}
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Typography
                  variant="body"
                  color="textSecondary"
                >
                  Overall Progress
                </Typography>
                <Typography
                  variant="body"
                  weight="bold"
                  color="primary"
                >
                  {roadmapData.progressPercent}%
                </Typography>
              </View>
              <ProgressBar
                progress={roadmapData.progressPercent}
                height={10}
              />
              <Typography
                variant="caption"
                color="textMuted"
                style={{ marginTop: 8 }}
              >
                {roadmapData.completedSteps} of{" "}
                {roadmapData.totalSteps} steps completed
              </Typography>
            </View>

            {/* Stats Row - tighter spacing */}
            <View
              style={{
                flexDirection: "row",
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                gap: 12,
              }}
            >
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingHorizontal: 8,
                }}
              >
                <Typography
                  variant="h4"
                  weight="bold"
                  color="primary"
                >
                  {roadmapData.milestones.length}
                </Typography>
                <Typography
                  variant="caption"
                  color="textMuted"
                >
                  Milestones
                </Typography>
              </View>
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingHorizontal: 8,
                }}
              >
                <Typography
                  variant="h4"
                  weight="bold"
                  color="text"
                >
                  {roadmapData.totalSteps}
                </Typography>
                <Typography
                  variant="caption"
                  color="textMuted"
                >
                  Total Steps
                </Typography>
              </View>
              {roadmapData.difficulty && (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingHorizontal: 8,
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor:
                        roadmapData.difficulty ===
                        "beginner"
                          ? `${theme.colors.success}20`
                          : roadmapData.difficulty ===
                              "intermediate"
                            ? `${theme.colors.warning}20`
                            : `${theme.colors.danger}20`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      weight="semibold"
                      style={{
                        color:
                          roadmapData.difficulty ===
                          "beginner"
                            ? theme.colors.success
                            : roadmapData.difficulty ===
                                "intermediate"
                              ? theme.colors.warning
                              : theme.colors.danger,
                        textTransform: "capitalize",
                      }}
                    >
                      {roadmapData.difficulty}
                    </Typography>
                  </View>
                  <Typography
                    variant="caption"
                    color="textMuted"
                    style={{ marginTop: 4 }}
                  >
                    Difficulty
                  </Typography>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Milestones Timeline */}
          <View style={{ marginHorizontal: 0 }}>
            {roadmapData.milestones.map(
              (milestone, index) => (
                <MilestoneCard
                  key={milestone._id}
                  milestone={milestone}
                  index={index}
                  roadmapId={roadmapData._id}
                  onToggleStep={handleToggleStep}
                  togglingStepId={togglingStepId}
                />
              ),
            )}
          </View>
        </ScrollView>
      )}

      {/* Leaderboard Bottom Sheet */}
      <BottomSheet
        ref={leaderboardSheetRef}
        index={-1}
        snapPoints={["60%", "85%"]} // Added a taller snap point option
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
        }} // Fixed hardcoded color
        handleIndicatorStyle={{
          backgroundColor: theme.colors.textMuted,
          width: 40,
        }}
      >
        {/* CRITICAL FIX: Use BottomSheetView with flex: 1 */}
        <BottomSheetView
          style={{ flex: 1, paddingHorizontal: 20 }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="trophy"
              size={22}
              color="#F59E0B"
            />
            <Typography variant="body" weight="bold">
              Leaderboard
            </Typography>
          </View>

          {/* Empty state or List */}
          {!leaderboard || leaderboard.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 40,
                gap: 12,
              }}
            >
              <Ionicons
                name="trophy-outline"
                size={48}
                color={theme.colors.textMuted}
              />
              <Typography variant="body" color="textMuted">
                No data yet
              </Typography>
              <Typography
                variant="caption"
                color="textMuted"
                style={{ textAlign: "center" }}
              >
                Complete steps to appear on the leaderboard
              </Typography>
            </View>
          ) : (
            <BottomSheetFlatList
              data={leaderboard}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={{
                paddingBottom: insets.bottom + 20,
              }}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    gap: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{
                      width: 24,
                      textAlign: "center",
                      color:
                        index === 0
                          ? "#F59E0B"
                          : index === 1
                            ? "#9CA3AF"
                            : index === 2
                              ? "#CD7F32"
                              : theme.colors.textMuted,
                    }}
                  >
                    {index + 1}
                  </Typography>
                  {/* Avatar */}
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        theme.colors.background, // Fixed background
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {item.profileImage ? (
                      <Image
                        source={{ uri: item.profileImage }}
                        style={{ width: 36, height: 36 }}
                        contentFit="cover"
                      />
                    ) : (
                      <Typography
                        variant="caption"
                        weight="bold"
                      >
                        {(item.fullname || "?")[0]}
                      </Typography>
                    )}
                  </View>
                  <Typography
                    variant="body"
                    style={{ flex: 1 }}
                    numberOfLines={1}
                  >
                    {item.fullname ||
                      item.username ||
                      "User"}
                  </Typography>
                  <Typography
                    variant="body"
                    weight="bold"
                    color="primary"
                  >
                    {item.progressPercent}%
                  </Typography>
                </View>
              )}
            />
          )}
        </BottomSheetView>
      </BottomSheet>

      {/* Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Animated.View
            entering={ZoomIn.duration(500)
              .springify()
              .damping(14)}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 28,
              padding: 32,
              width: "100%",
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden", // Keeps fireworks inside the card aesthetic
            }}
          >
            {/* Background Aesthetic Glow */}
            <Animated.View
              entering={FadeIn.duration(1000).delay(300)}
              style={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: `${theme.colors.primary}15`,
                top: -50,
              }}
            />

            {/* Aesthetic Fireworks Burst */}
            <View
              style={{
                position: "absolute",
                top: 80,
                left: "50%",
              }}
            >
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const colors = [
                  "#6C5DD3",
                  "#22C55E",
                  "#F59E0B",
                  "#EF4444",
                  "#8B5CF6",
                  "#38BDF8",
                ];
                return (
                  <Animated.View
                    key={i}
                    entering={ZoomIn.duration(600)
                      .delay(200)
                      .springify()}
                    style={{
                      position: "absolute",
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        colors[i % colors.length],
                      transform: [
                        {
                          translateX: Math.cos(angle) * 80,
                        },
                        {
                          translateY: Math.sin(angle) * 80,
                        },
                      ],
                      opacity: 0.8,
                    }}
                  />
                );
              })}
            </View>

            {/* Animated checkmark circle */}
            <Animated.View
              entering={ZoomIn.duration(600)
                .delay(100)
                .springify()
                .stiffness(200)}
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: "#22C55E",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#22C55E",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              <Ionicons
                name="checkmark"
                size={44}
                color="white"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(400).delay(400)}
            >
              <Typography
                variant="h2"
                weight="bold"
                style={{
                  marginTop: 24,
                  textAlign: "center",
                }}
              >
                Roadmap Complete!
              </Typography>
              <Typography
                variant="body"
                color="textMuted"
                style={{
                  marginTop: 10,
                  textAlign: "center",
                  lineHeight: 22,
                }}
              >
                You have completed all steps in this
                roadmap. Amazing work!
              </Typography>
            </Animated.View>

            {/* Share Achievement button */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(500)}
              style={{ width: "100%", marginTop: 28 }}
            >
              <Pressable
                onPress={handleShareAchievement}
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: 14,
                  overflow: "hidden",
                  transform: [
                    { scale: pressed ? 0.96 : 1 },
                  ],
                })}
              >
                <LinearGradient
                  colors={["#6C5DD3", "#8676FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color="white"
                  />
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{ color: "white" }}
                  >
                    Share Achievement
                  </Typography>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Close button */}
            <Animated.View
              entering={FadeIn.duration(400).delay(600)}
            >
              <Pressable
                onPress={() => setShowCelebration(false)}
                style={{
                  marginTop: 16,
                  paddingVertical: 10,
                }}
              >
                <Typography
                  variant="body"
                  color="textMuted"
                >
                  Close
                </Typography>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
