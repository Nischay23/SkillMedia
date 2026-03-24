import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "@/providers/ThemeProvider";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";

// Animated Score Counter
function AnimatedScore({
  score,
  total,
  percentage,
}: {
  score: number;
  total: number;
  percentage: number;
}) {
  const { theme } = useTheme();
  const [displayScore, setDisplayScore] = useState(0);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Animate the score counting up
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setDisplayScore(Math.floor(easeProgress * score));
      setDisplayPercentage(Math.floor(easeProgress * percentage));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        Haptics.notificationAsync(
          percentage >= 70
            ? Haptics.NotificationFeedbackType.Success
            : percentage >= 40
              ? Haptics.NotificationFeedbackType.Warning
              : Haptics.NotificationFeedbackType.Error,
        );
      }
    };

    // Start animation after a delay
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 10, stiffness: 100 });
      rotation.value = withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );
      animate();
    }, 500);
  }, [score, total, percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const color =
    percentage >= 70 ? "#22C55E" : percentage >= 40 ? "#F97316" : "#EF4444";

  return (
    <Animated.View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          marginVertical: 24,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: `${color}15`,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 4,
          borderColor: color,
        }}
      >
        <Typography
          variant="h1"
          weight="bold"
          style={{ color, fontSize: 48 }}
        >
          {displayPercentage}%
        </Typography>
        <Typography variant="caption" color="textMuted">
          {displayScore}/{total} points
        </Typography>
      </View>
    </Animated.View>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  const { theme } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(delay)}
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${color}20`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Typography variant="h4" weight="bold" style={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="textMuted">
        {label}
      </Typography>
    </Animated.View>
  );
}

// Question Review Card
function QuestionReviewCard({
  question,
  index,
}: {
  question: any;
  index: number;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const getAnswerDisplay = (answer: any) => {
    if (Array.isArray(answer)) return answer.join(", ");
    return answer || "Not answered";
  };

  const getCorrectAnswerDisplay = (answer: any) => {
    if (Array.isArray(answer)) return answer.join(", ");
    return answer;
  };

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: question.isCorrect
            ? "#22C55E40"
            : "#EF444440",
          borderLeftWidth: 4,
          borderLeftColor: question.isCorrect ? "#22C55E" : "#EF4444",
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: question.isCorrect
                  ? "#22C55E20"
                  : "#EF444420",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons
                name={question.isCorrect ? "checkmark" : "close"}
                size={16}
                color={question.isCorrect ? "#22C55E" : "#EF4444"}
              />
            </View>
            <Typography
              variant="body"
              color="text"
              numberOfLines={expanded ? undefined : 1}
              style={{ flex: 1 }}
            >
              Q{index + 1}. {question.text}
            </Typography>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.colors.textMuted}
          />
        </View>

        {/* Expanded content */}
        {expanded && (
          <View style={{ marginTop: 16 }}>
            {/* Your answer */}
            <View
              style={{
                backgroundColor: question.isCorrect
                  ? "#22C55E10"
                  : "#EF444410",
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Typography variant="caption" weight="semibold" color="textMuted">
                Your Answer
              </Typography>
              <Typography
                variant="body"
                style={{
                  color: question.isCorrect ? "#22C55E" : "#EF4444",
                  marginTop: 4,
                }}
              >
                {getAnswerDisplay(question.userAnswer)}
              </Typography>
            </View>

            {/* Correct answer (if wrong) */}
            {!question.isCorrect && (
              <View
                style={{
                  backgroundColor: "#22C55E10",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textMuted"
                >
                  Correct Answer
                </Typography>
                <Typography
                  variant="body"
                  style={{ color: "#22C55E", marginTop: 4 }}
                >
                  {getCorrectAnswerDisplay(question.correctAnswer)}
                </Typography>
              </View>
            )}

            {/* Explanation */}
            {question.explanation && (
              <View
                style={{
                  backgroundColor: `${theme.colors.primary}10`,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="bulb-outline"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color="primary"
                  >
                    Explanation
                  </Typography>
                </View>
                <Typography variant="body" color="textMuted">
                  {question.explanation}
                </Typography>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Streak Celebration
function StreakCelebration({ streak }: { streak: number }) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      1500,
      withSequence(
        withSpring(1.2, { damping: 5 }),
        withSpring(1, { damping: 10 }),
      ),
    );
    rotation.value = withDelay(
      1500,
      withSequence(
        withTiming(15, { duration: 100 }),
        withTiming(-15, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  if (streak <= 0) return null;

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F9731620",
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 16,
          marginTop: 16,
          gap: 8,
        },
        animatedStyle,
      ]}
    >
      <Typography style={{ fontSize: 24 }}>🔥</Typography>
      <Typography variant="body" weight="bold" style={{ color: "#F97316" }}>
        {streak} Day Streak!
      </Typography>
    </Animated.View>
  );
}

// Main Results Screen
export default function QuizResultsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: groupId, quizId } = useLocalSearchParams<{
    id: string;
    quizId: string;
  }>();

  const [showReview, setShowReview] = useState(false);

  const reviewData = useQuery(
    api.quizzes.getQuizForReview,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip",
  );

  const streak = useQuery(api.streaks.getStreak);

  // Loading state
  if (!reviewData) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Typography variant="body" color="textMuted" style={{ marginTop: 16 }}>
          Loading results...
        </Typography>
      </View>
    );
  }

  const { quiz, attempt, questions } = reviewData;
  const correctCount = questions.filter((q: any) => q.isCorrect).length;
  const wrongCount = questions.filter(
    (q: any) => !q.isCorrect && q.userAnswer,
  ).length;
  const skippedCount = questions.filter(
    (q: any) => !q.isCorrect && !q.userAnswer,
  ).length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
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
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="semibold" color="text">
              Quiz Results
            </Typography>
            <Typography
              variant="caption"
              color="textMuted"
              style={{ marginTop: 2 }}
            >
              {quiz.title}
            </Typography>
          </View>
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Display */}
        <AnimatedScore
          score={attempt.score}
          total={attempt.totalPoints}
          percentage={attempt.percentage}
        />

        {/* Streak celebration */}
        <StreakCelebration streak={streak?.currentStreak ?? 0} />

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(800)}
          style={{
            flexDirection: "row",
            gap: 12,
            marginTop: 24,
          }}
        >
          <StatCard
            icon="checkmark-circle"
            label="Correct"
            value={correctCount}
            color="#22C55E"
            delay={900}
          />
          <StatCard
            icon="close-circle"
            label="Wrong"
            value={wrongCount}
            color="#EF4444"
            delay={1000}
          />
          <StatCard
            icon="time"
            label="Time"
            value={formatTime(attempt.timeTaken)}
            color={theme.colors.primary}
            delay={1100}
          />
        </Animated.View>

        {/* Review toggle */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(1200)}
          style={{ marginTop: 32 }}
        >
          <Pressable
            onPress={() => setShowReview(!showReview)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${theme.colors.primary}20`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View>
                <Typography variant="body" weight="semibold" color="text">
                  Review Answers
                </Typography>
                <Typography variant="caption" color="textMuted">
                  See explanations for each question
                </Typography>
              </View>
            </View>
            <Ionicons
              name={showReview ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>
        </Animated.View>

        {/* Review questions */}
        {showReview && (
          <View style={{ marginTop: 16 }}>
            {questions.map((question: any, index: number) => (
              <QuestionReviewCard
                key={question._id}
                question={question}
                index={index}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom action buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 20,
          paddingBottom: insets.bottom + 20,
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.push(`/group/${groupId}/leaderboard` as any)}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 16,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            <Ionicons
              name="trophy-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Typography variant="body" weight="semibold" color="primary">
              Leaderboard
            </Typography>
          </Pressable>

          <Pressable
            onPress={() => router.replace(`/group/${groupId}/quiz` as any)}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 50,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Typography variant="body" weight="bold" style={{ color: "#FFFFFF" }}>
                Back to Quizzes
              </Typography>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
