import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

// Progress Bar Component
const ProgressBar = ({
  progress,
  height = 8,
}: {
  progress: number;
  height?: number;
}) => {
  const { theme } = useTheme();
  const animatedWidth = useSharedValue(0);

  React.useEffect(() => {
    animatedWidth.value = withSpring(progress, {
      damping: 15,
      stiffness: 100,
    });
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
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: step.isCompleted
          ? `${theme.colors.success}10`
          : theme.colors.surface,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: step.isCompleted
          ? `${theme.colors.success}30`
          : theme.colors.border,
      }}
    >
      {/* Checkbox */}
      <View style={{ marginRight: 12, paddingTop: 2 }}>
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

        {/* Meta info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
            gap: 12,
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

          {step.estimatedMinutes && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={theme.colors.textMuted}
              />
              <Typography
                variant="caption"
                color="textMuted"
              >
                {step.estimatedMinutes} min
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
        marginBottom: 16,
      }}
    >
      {/* Timeline connector */}
      <View style={{ flexDirection: "row" }}>
        {/* Timeline dot and line */}
        <View style={{ alignItems: "center", width: 32 }}>
          {/* Dot */}
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: milestone.isCompleted
                ? theme.colors.success
                : theme.colors.primary,
              borderWidth: 3,
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
        <View style={{ flex: 1, marginLeft: 12 }}>
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
                padding: 16,
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
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor:
                          theme.colors.success,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="checkmark"
                        size={14}
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
                <View style={{ marginTop: 12 }}>
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
                    height={6}
                  />
                </View>
              </View>

              <Animated.View
                style={[{ marginLeft: 12 }, chevronStyle]}
              >
                <Ionicons
                  name="chevron-down"
                  size={24}
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
                  paddingHorizontal: 12,
                  paddingBottom: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                }}
              >
                <View style={{ marginTop: 12 }}>
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
        withTiming(1.0, { duration: 1200 })
      ),
      -1,
      true
    );

    // Floating icon
    iconTranslateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
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
        style={{ marginTop: 10, maxWidth: 240, alignItems: "center" }}
      >
        <Typography
          variant="body"
          color="textMuted"
          align="center"
          style={{ lineHeight: 24 }}
        >
          {"The admin hasn't created a roadmap\nfor this group yet.\nCheck back later!"}
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

// Loading State Component
const LoadingState = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 64,
      }}
    >
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
      />
      <Typography
        variant="body"
        color="textMuted"
        style={{ marginTop: 16 }}
      >
        Loading roadmap...
      </Typography>
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

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    progressHeader: {
      backgroundColor: t.colors.surface,
      borderRadius: 20,
      padding: 20,
      marginTop: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
  }));

  // Fetch roadmap with details
  const roadmapData = useQuery(
    api.roadmaps.getRoadmapWithDetails,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip",
  );

  const toggleStepComplete = useMutation(
    api.roadmaps.toggleStepComplete,
  );

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
    backButtonScale.value = withSpring(0.9, { damping: 10 }, () => {
      backButtonScale.value = withSpring(1, { damping: 12 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(50)}
        style={{
          backgroundColor: theme.colors.surface,
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 14,
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
            <Typography variant="body" weight="semibold" color="text">
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
            marginTop: 14,
            marginHorizontal: -16,
          }}
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
                marginBottom: 16,
              }}
            >
              <LinearGradient
                colors={["#6C5DD3", "#8676FF"]}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="rocket"
                  size={24}
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

            {/* Stats Row */}
            <View
              style={{
                flexDirection: "row",
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                gap: 16,
              }}
            >
              <View
                style={{ flex: 1, alignItems: "center" }}
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
                style={{ flex: 1, alignItems: "center" }}
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
                  style={{ flex: 1, alignItems: "center" }}
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
          <View
            style={{ paddingBottom: insets.bottom + 20 }}
          >
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
    </View>
  );
}
