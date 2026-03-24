import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
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
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Quiz type colors and badges
const quizTypeConfig = {
  daily: {
    color: "#22C55E",
    bgColor: "#22C55E20",
    label: "Daily",
    icon: "sunny" as const,
  },
  weekly: {
    color: "#3B82F6",
    bgColor: "#3B82F620",
    label: "Weekly",
    icon: "calendar" as const,
  },
  test_series: {
    color: "#F97316",
    bgColor: "#F9731620",
    label: "Mock Test",
    icon: "school" as const,
  },
};

// Format time duration
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

// Format countdown
const formatCountdown = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// Quiz Card Component
function QuizCard({
  quiz,
  index,
  onPress,
}: {
  quiz: any;
  index: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const config = quizTypeConfig[quiz.type as keyof typeof quizTypeConfig];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const isCompleted = !!quiz.attempt;
  const isLocked = quiz.isScheduled;
  const isExpired = quiz.isExpired;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 80)}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={!isLocked ? handlePressIn : undefined}
        onPressOut={!isLocked ? handlePressOut : undefined}
        onPress={!isLocked ? onPress : undefined}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 20,
          padding: 20,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: isLocked ? theme.colors.border : theme.colors.border,
          opacity: isLocked || isExpired ? 0.7 : 1,
        }}
      >
        {/* Header: Type badge + Title */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            {/* Type Badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: config.bgColor,
                alignSelf: "flex-start",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Ionicons name={config.icon} size={12} color={config.color} />
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: config.color, fontSize: 11 }}
              >
                {config.label}
              </Typography>
            </View>

            {/* Title */}
            <Typography
              variant="body"
              weight="semibold"
              color="text"
              numberOfLines={2}
            >
              {quiz.title}
            </Typography>

            {/* Description */}
            {quiz.description && (
              <Typography
                variant="caption"
                color="textMuted"
                numberOfLines={1}
                style={{ marginTop: 4 }}
              >
                {quiz.description}
              </Typography>
            )}
          </View>

          {/* Score badge (if completed) */}
          {isCompleted && (
            <View
              style={{
                backgroundColor:
                  quiz.attempt.percentage >= 70
                    ? "#22C55E20"
                    : quiz.attempt.percentage >= 40
                      ? "#F9731620"
                      : "#EF444420",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Typography
                variant="h4"
                weight="bold"
                style={{
                  color:
                    quiz.attempt.percentage >= 70
                      ? "#22C55E"
                      : quiz.attempt.percentage >= 40
                        ? "#F97316"
                        : "#EF4444",
                }}
              >
                {quiz.attempt.percentage}%
              </Typography>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            marginTop: 14,
          }}
        >
          {/* Questions */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name="help-circle-outline"
              size={14}
              color={theme.colors.textMuted}
            />
            <Typography variant="caption" color="textMuted">
              {quiz.questionCount} questions
            </Typography>
          </View>

          {/* Time */}
          {(quiz.timeLimit || quiz.perQuestionTime) && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons
                name="time-outline"
                size={14}
                color={theme.colors.textMuted}
              />
              <Typography variant="caption" color="textMuted">
                {quiz.timeLimit
                  ? formatDuration(quiz.timeLimit)
                  : `${quiz.perQuestionTime}s/Q`}
              </Typography>
            </View>
          )}
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: theme.colors.border,
            marginVertical: 14,
          }}
        />

        {/* Action row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {isLocked ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="lock-closed" size={16} color={theme.colors.textMuted} />
                <Typography variant="caption" color="textMuted">
                  Opens in {formatCountdown(quiz.scheduledIn)}
                </Typography>
              </View>
              <View
                style={{
                  backgroundColor: theme.colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Typography variant="caption" weight="semibold" color="textMuted">
                  Locked
                </Typography>
              </View>
            </>
          ) : isExpired ? (
            <>
              <Typography variant="caption" color="textMuted">
                Quiz has expired
              </Typography>
              <View
                style={{
                  backgroundColor: theme.colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Typography variant="caption" weight="semibold" color="textMuted">
                  Expired
                </Typography>
              </View>
            </>
          ) : isCompleted ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Typography variant="caption" style={{ color: "#22C55E" }}>
                  Completed
                </Typography>
              </View>
              <View
                style={{
                  backgroundColor: theme.colors.primary + "20",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Typography variant="caption" weight="semibold" color="primary">
                  Review
                </Typography>
              </View>
            </>
          ) : (
            <>
              <Typography variant="caption" color="textMuted">
                Ready to attempt
              </Typography>
              <LinearGradient
                colors={["#6C5DD3", "#8676FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: "#FFFFFF" }}
                >
                  Start Quiz
                </Typography>
              </LinearGradient>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Empty State Component
function EmptyState() {
  const { theme } = useTheme();

  const glowScale = useSharedValue(1);
  const iconTranslateY = useSharedValue(0);

  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200 }),
        withTiming(1.0, { duration: 1200 }),
      ),
      -1,
      true,
    );

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
        paddingTop: 60,
      }}
    >
      <View
        style={{
          width: 110,
          height: 110,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
          <Animated.View style={iconAnimatedStyle}>
            <Ionicons
              name="school-outline"
              size={52}
              color={theme.colors.primary}
            />
          </Animated.View>
        </View>
      </View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(200)}
        style={{ marginTop: 28, alignItems: "center" }}
      >
        <Typography variant="h2" weight="bold" color="text" align="center">
          No Quizzes Yet
        </Typography>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(350)}
        style={{ marginTop: 10, maxWidth: 260, alignItems: "center" }}
      >
        <Typography
          variant="body"
          color="textMuted"
          align="center"
          style={{ lineHeight: 24 }}
        >
          {"The admin hasn't created any quizzes\nfor this group yet.\nCheck back soon!"}
        </Typography>
      </Animated.View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 28 }}>
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
}

// Loading State
function LoadingState() {
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
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Typography variant="body" color="textMuted" style={{ marginTop: 16 }}>
        Loading quizzes...
      </Typography>
    </View>
  );
}

// Main Quiz List Screen
export default function QuizListScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const quizzes = useQuery(
    api.quizzes.getQuizzes,
    groupId
      ? { groupId: groupId as Id<"groups">, type: filter ?? undefined }
      : "skip",
  );

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleQuizPress = (quiz: any) => {
    if (quiz.attempt) {
      // Go to review
      router.push(`/group/${groupId}/quiz/${quiz._id}/results` as any);
    } else {
      // Go to take quiz
      router.push(`/group/${groupId}/quiz/${quiz._id}` as any);
    }
  };

  const isLoading = quizzes === undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </AnimatedPressable>

          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="semibold" color="text">
              Quizzes & Tests
            </Typography>
            <Typography
              variant="caption"
              color="textMuted"
              style={{ marginTop: 2 }}
            >
              Test your knowledge
            </Typography>
          </View>

          <Pressable
            onPress={() => router.push(`/group/${groupId}/leaderboard` as any)}
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

      {/* Filter tabs */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {[
          { key: null, label: "All" },
          { key: "daily", label: "Daily" },
          { key: "weekly", label: "Weekly" },
          { key: "test_series", label: "Mock Tests" },
        ].map((item) => (
          <Pressable
            key={item.key ?? "all"}
            onPress={() => setFilter(item.key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor:
                filter === item.key
                  ? theme.colors.primary
                  : theme.colors.surface,
              borderWidth: 1,
              borderColor:
                filter === item.key
                  ? theme.colors.primary
                  : theme.colors.border,
            }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{
                color: filter === item.key ? "#FFFFFF" : theme.colors.textMuted,
              }}
            >
              {item.label}
            </Typography>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : quizzes.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {quizzes.map((quiz: any, index: number) => (
            <QuizCard
              key={quiz._id}
              quiz={quiz}
              index={index}
              onPress={() => handleQuizPress(quiz)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
