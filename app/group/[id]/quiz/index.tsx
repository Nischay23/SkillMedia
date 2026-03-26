import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "@/providers/ThemeProvider";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Format time duration
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

// Quiz Card Component
function QuizCard({
  quiz,
  index,
  onPress,
}: {
  quiz: {
    _id: string;
    title: string;
    description?: string;
    timeLimit?: number;
    passingScore?: number;
    questionCount: number;
    attemptCount: number;
    bestScore: number | null;
  };
  index: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

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

  const hasAttempted = quiz.bestScore !== null;
  const passed = quiz.passingScore !== undefined && quiz.bestScore !== null && quiz.bestScore >= quiz.passingScore;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 70)}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        {/* Top row: Title + Time limit chip */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Typography
            variant="body"
            weight="semibold"
            color="text"
            style={{ flex: 1 }}
            numberOfLines={2}
          >
            {quiz.title}
          </Typography>

          {quiz.timeLimit && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: `${theme.colors.primary}15`,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Ionicons
                name="time-outline"
                size={12}
                color={theme.colors.primary}
              />
              <Typography
                variant="caption"
                style={{ color: theme.colors.primary, fontSize: 11 }}
              >
                {formatDuration(quiz.timeLimit)}
              </Typography>
            </View>
          )}
        </View>

        {/* Description */}
        {quiz.description && (
          <Typography
            variant="caption"
            color="textMuted"
            numberOfLines={2}
            style={{ marginTop: 8 }}
          >
            {quiz.description}
          </Typography>
        )}

        {/* Stats row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            marginTop: 12,
          }}
        >
          {/* Question count */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name="help-circle-outline"
              size={14}
              color={theme.colors.textMuted}
            />
            <Typography variant="caption" color="textMuted">
              {quiz.questionCount} Q
            </Typography>
          </View>

          {/* Attempt count */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name="people-outline"
              size={14}
              color={theme.colors.textMuted}
            />
            <Typography variant="caption" color="textMuted">
              {quiz.attemptCount} attempts
            </Typography>
          </View>

          {/* Best score */}
          {hasAttempted && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons
                name="trophy-outline"
                size={14}
                color={theme.colors.textMuted}
              />
              <Typography variant="caption" color="textMuted">
                Best: {quiz.bestScore}/{quiz.questionCount}
              </Typography>
            </View>
          )}
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: theme.colors.border,
            marginVertical: 12,
          }}
        />

        {/* Bottom: Action button + score chip */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {hasAttempted ? (
            <>
              {/* Score chip */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: passed ? "#22C55E20" : "#F9731620",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                }}
              >
                <Ionicons
                  name={passed ? "checkmark-circle" : "alert-circle"}
                  size={14}
                  color={passed ? "#22C55E" : "#F97316"}
                />
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{ color: passed ? "#22C55E" : "#F97316" }}
                >
                  {passed ? "Passed" : "Try Again"}
                </Typography>
              </View>

              {/* Retake button */}
              <Pressable
                onPress={onPress}
                style={{
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="primary"
                >
                  Retake
                </Typography>
              </Pressable>
            </>
          ) : (
            <>
              <Typography variant="caption" color="textMuted">
                Ready to attempt
              </Typography>

              {/* Start Quiz gradient button */}
              <LinearGradient
                colors={["#6C5DD3", "#8676FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 18,
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

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingTop: 80,
      }}
    >
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: `${theme.colors.primary}10`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Ionicons
          name="help-circle-outline"
          size={64}
          color={`${theme.colors.primary}66`}
        />
      </View>

      <Typography variant="h3" weight="bold" color="text" align="center">
        No Quizzes Yet
      </Typography>

      <Typography
        variant="body"
        color="textMuted"
        align="center"
        style={{ marginTop: 8, lineHeight: 22 }}
      >
        Admin hasn't added quizzes yet.{"\n"}Check back soon!
      </Typography>
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

  const quizzes = useQuery(
    api.quizzes.getQuizzesByGroup,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
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

  const handleQuizPress = (quizId: string) => {
    router.push(`/group/${groupId}/quiz/${quizId}` as any);
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

          <Typography variant="body" weight="semibold" color="text">
            Quizzes
          </Typography>
        </View>

        {/* Accent line */}
        <LinearGradient
          colors={["#6C5DD3", "#8676FF", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 2,
            marginTop: 14,
            marginHorizontal: -16,
          }}
        />
      </Animated.View>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : quizzes.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <QuizCard
              quiz={item}
              index={index}
              onPress={() => handleQuizPress(item._id)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
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
        />
      )}
    </View>
  );
}
