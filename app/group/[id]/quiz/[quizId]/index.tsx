import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "@/providers/ThemeProvider";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Shimmer skeleton pulse ──────────────────────────────
function SkeletonPulse({
  height,
  width,
  radius = 8,
  delay = 0,
}: {
  height: number;
  width: number | string;
  radius?: number;
  delay?: number;
}) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0.3, { duration: delay }),
      withTiming(0.15, { duration: 700 }),
      withTiming(0.3, { duration: 700 }),
    );
    // Loop manually
    const loop = setInterval(() => {
      opacity.value = withSequence(
        withTiming(0.15, { duration: 700 }),
        withTiming(0.3, { duration: 700 }),
      );
    }, 1400 + delay);
    return () => clearInterval(loop);
  }, [opacity, delay]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          height,
          width: width as any,
          borderRadius: radius,
          backgroundColor: theme.colors.surface,
        },
        pulse,
      ]}
    />
  );
}

// Answer Option Labels
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

// Answer Option Component
function AnswerOption({
  option,
  index,
  isSelected,
  showResult,
  isCorrect,
  isUserAnswer,
  onSelect,
  disabled,
}: {
  option: string;
  index: number;
  isSelected: boolean;
  showResult: boolean;
  isCorrect: boolean;
  isUserAnswer: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled || showResult) return;
    scale.value = withSpring(0.98, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  // Determine colors based on state
  let backgroundColor = theme.colors.surface;
  let borderColor = theme.colors.border;
  let circleBackground = theme.colors.border;
  let circleContent: React.ReactNode = (
    <Typography variant="caption" weight="semibold" style={{ color: theme.colors.textMuted }}>
      {OPTION_LABELS[index]}
    </Typography>
  );

  if (showResult) {
    if (isCorrect) {
      backgroundColor = "#22C55E15";
      borderColor = "#22C55E";
      circleBackground = "#22C55E";
      circleContent = <Ionicons name="checkmark" size={16} color="#FFFFFF" />;
    } else if (isUserAnswer && !isCorrect) {
      backgroundColor = "#EF444415";
      borderColor = "#EF4444";
      circleBackground = "#EF4444";
      circleContent = <Ionicons name="close" size={16} color="#FFFFFF" />;
    }
  } else if (isSelected) {
    backgroundColor = `${theme.colors.primary}10`;
    borderColor = theme.colors.primary;
    circleBackground = theme.colors.primary;
    circleContent = (
      <Typography variant="caption" weight="semibold" style={{ color: "#FFFFFF" }}>
        {OPTION_LABELS[index]}
      </Typography>
    );
  }

  // ── Green correct-answer flash micro-interaction ─────────
  const correctFlash = useSharedValue(0);

  useEffect(() => {
    if (showResult && isCorrect) {
      // Flash in then fade: 0 → 0.35 → 0 over 400ms total
      correctFlash.value = withSequence(
        withTiming(0.35, { duration: 120 }),
        withTiming(0, { duration: 280 }),
      );
    }
  }, [showResult, isCorrect, correctFlash]);

  const flashStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#22C55E",
    opacity: correctFlash.value,
    borderRadius: 14,
    pointerEvents: "none" as any,
  }));

  return (
    <Animated.View style={[animatedStyle, { position: "relative" }]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled || showResult}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor,
          borderRadius: 14,
          padding: 16,
          marginBottom: 10,
          borderWidth: 2,
          borderColor,
        }}
      >
        {/* Circle with letter */}
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: circleBackground,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {circleContent}
        </View>

        {/* Option text */}
        <Typography variant="body" color="text" style={{ flex: 1 }}>
          {option}
        </Typography>
      </Pressable>
      {/* Green flash overlay for correct answer reveal */}
      <Animated.View style={flashStyle} />
    </Animated.View>
  );
}

// Results Screen Component
function ResultsScreen({
  score,
  totalQuestions,
  correctAnswers,
  passed,
  timeTaken,
  questions,
  userAnswers,
  passingScore,
  onViewLeaderboard,
  onRetake,
  onBack,
}: {
  score: number;
  totalQuestions: number;
  correctAnswers: boolean[];
  passed: boolean;
  timeTaken: number;
  questions: { text: string; options: string[]; correctIndex: number; explanation?: string }[];
  userAnswers: number[];
  passingScore?: number;
  onViewLeaderboard: () => void;
  onRetake: () => void;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Score Circle */}
      <Animated.View
        entering={ZoomIn.duration(500).springify()}
        style={{ alignItems: "center", marginBottom: 24 }}
      >
        <LinearGradient
          colors={passed ? ["#22C55E", "#16A34A"] : ["#EF4444", "#DC2626"]}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h1" weight="bold" style={{ color: "#FFFFFF" }}>
            {percentage}%
          </Typography>
        </LinearGradient>

        <Animated.View entering={FadeInUp.delay(300).duration(300)}>
          <Typography
            variant="h3"
            weight="bold"
            style={{
              color: passed ? "#22C55E" : "#EF4444",
              marginTop: 16,
            }}
          >
            {passed ? "Passed!" : "Try Again"}
          </Typography>
        </Animated.View>
      </Animated.View>

      {/* Stats Row */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(300)}
        style={{
          flexDirection: "row",
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
        }}
      >
        {/* Correct */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="h4" weight="bold" color="text">
            {score}/{totalQuestions}
          </Typography>
          <Typography variant="caption" color="textMuted">
            Correct
          </Typography>
        </View>

        {/* Divider */}
        <View style={{ width: 1, backgroundColor: theme.colors.border }} />

        {/* Time */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="h4" weight="bold" color="text">
            {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, "0")}
          </Typography>
          <Typography variant="caption" color="textMuted">
            Time
          </Typography>
        </View>

        {/* Divider */}
        <View style={{ width: 1, backgroundColor: theme.colors.border }} />

        {/* Passing Score */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="h4" weight="bold" color="text">
            {passingScore ?? 0}
          </Typography>
          <Typography variant="caption" color="textMuted">
            To Pass
          </Typography>
        </View>
      </Animated.View>

      {/* Review Section */}
      <Animated.View entering={FadeInUp.delay(500).duration(300)}>
        <Typography variant="body" weight="semibold" color="text" style={{ marginBottom: 12 }}>
          Review Answers
        </Typography>

        {questions.map((question, qIndex) => {
          const isCorrect = correctAnswers[qIndex];
          const userAnswerIndex = userAnswers[qIndex];

          return (
            <View
              key={qIndex}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: isCorrect ? "#22C55E" : "#EF4444",
              }}
            >
              {/* Question header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Ionicons
                  name={isCorrect ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={isCorrect ? "#22C55E" : "#EF4444"}
                />
                <Typography variant="caption" color="textMuted">
                  Question {qIndex + 1}
                </Typography>
              </View>

              {/* Question text */}
              <Typography variant="body" color="text" style={{ marginBottom: 8 }}>
                {question.text}
              </Typography>

              {/* Your answer */}
              {!isCorrect && userAnswerIndex !== undefined && (
                <View style={{ flexDirection: "row", gap: 4, marginBottom: 4 }}>
                  <Typography variant="caption" color="textMuted">
                    Your answer:
                  </Typography>
                  <Typography variant="caption" style={{ color: "#EF4444" }}>
                    {question.options[userAnswerIndex] ?? "No answer"}
                  </Typography>
                </View>
              )}

              {/* Correct answer */}
              <View style={{ flexDirection: "row", gap: 4 }}>
                <Typography variant="caption" color="textMuted">
                  Correct:
                </Typography>
                <Typography variant="caption" style={{ color: "#22C55E" }}>
                  {question.options[question.correctIndex]}
                </Typography>
              </View>

              {/* Explanation */}
              {question.explanation && (
                <View
                  style={{
                    backgroundColor: `${theme.colors.primary}10`,
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 10,
                  }}
                >
                  <Typography variant="caption" color="textMuted">
                    {question.explanation}
                  </Typography>
                </View>
              )}
            </View>
          );
        })}
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View entering={FadeInUp.delay(600).duration(300)} style={{ marginTop: 16 }}>
        {/* View Leaderboard */}
        <Pressable
          onPress={onViewLeaderboard}
          style={{
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
            borderRadius: 14,
            height: 50,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Typography variant="body" weight="semibold" color="primary">
            View Leaderboard
          </Typography>
        </Pressable>

        {/* Retake Quiz */}
        <Pressable onPress={onRetake}>
          <LinearGradient
            colors={["#6C5DD3", "#8676FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14,
              height: 50,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Typography variant="body" weight="bold" style={{ color: "#FFFFFF" }}>
              Retake Quiz
            </Typography>
          </LinearGradient>
        </Pressable>

        {/* Back */}
        <Pressable
          onPress={onBack}
          style={{ alignItems: "center", paddingVertical: 12 }}
        >
          <Typography variant="body" color="textMuted">
            Back to Quizzes
          </Typography>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

// Main Quiz Attempt Screen
export default function QuizAttemptScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: groupId, quizId } = useLocalSearchParams<{
    id: string;
    quizId: string;
  }>();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: boolean[];
    passed: boolean;
  } | null>(null);

  const startTimeRef = useRef(Date.now());
  const progressWidth = useSharedValue(0);

  const quiz = useQuery(
    api.quizzes.getQuizById,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip"
  );

  const submitQuiz = useMutation(api.quizzes.submitQuiz);

  const questions = quiz?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Initialize timer
  useEffect(() => {
    if (quiz?.timeLimit) {
      setTimeLeft(quiz.timeLimit);
    }
  }, [quiz]);

  // Timer countdown
  useEffect(() => {
    if (!quiz?.timeLimit || timeLeft <= 0 || quizResult) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz?.timeLimit, timeLeft, quizResult]);

  // Update progress bar
  useEffect(() => {
    const progress = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
    progressWidth.value = withTiming(progress, { duration: 300 });
  }, [currentQuestionIndex, totalQuestions]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Handle time up
  const handleTimeUp = useCallback(async () => {
    // Submit with current answers
    const finalAnswers = [...userAnswers];
    while (finalAnswers.length < totalQuestions) {
      finalAnswers.push(-1); // Mark as unanswered
    }
    await handleSubmitQuiz(finalAnswers);
  }, [userAnswers, totalQuestions]);

  // Handle answer selection
  const handleSelectAnswer = (index: number) => {
    if (showResult || isSubmitting) return;
    setSelectedAnswer(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle next question
  const handleNext = useCallback(async () => {
    if (selectedAnswer === null) {
      Alert.alert("Select an answer", "Please select an answer before continuing.");
      return;
    }

    // Show result briefly
    setShowResult(true);
    Haptics.notificationAsync(
      selectedAnswer === currentQuestion?.correctIndex
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );

    // Wait for result animation
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);

    if (isLastQuestion) {
      // Submit quiz
      await handleSubmitQuiz(newAnswers);
    } else {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  }, [selectedAnswer, currentQuestion, isLastQuestion, userAnswers]);

  // Submit quiz
  const handleSubmitQuiz = useCallback(
    async (answers: number[]) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

      try {
        const result = await submitQuiz({
          quizId: quizId as Id<"quizzes">,
          answers,
          timeTaken,
        });

        setQuizResult(result);
      } catch (error) {
        console.error("Failed to submit quiz:", error);
        Alert.alert("Error", "Failed to submit quiz. Please try again.");
        setIsSubmitting(false);
      }
    },
    [quizId, submitQuiz, isSubmitting]
  );

  // Handle exit confirmation
  const handleExit = () => {
    Alert.alert("Exit Quiz?", "Your progress will be lost. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Exit",
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
  };

  // Loading state — shimmer skeleton
  if (!quiz) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
        }}
      >
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        {/* Fake header */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top,
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
        >
          <SkeletonPulse height={12} width="40%" radius={6} />
          <View style={{ height: 12 }} />
          <SkeletonPulse height={4} width="100%" radius={2} />
        </View>
        {/* Fake question card */}
        <View style={{ padding: 16 }}>
          <SkeletonPulse height={100} width="100%" radius={20} />
          <View style={{ height: 12 }} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <SkeletonPulse height={56} width="100%" radius={14} delay={i * 60} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Results state
  if (quizResult) {
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    return (
      <ResultsScreen
        score={quizResult.score}
        totalQuestions={quizResult.totalQuestions}
        correctAnswers={quizResult.correctAnswers}
        passed={quizResult.passed}
        timeTaken={timeTaken}
        questions={questions}
        userAnswers={userAnswers}
        passingScore={quiz.passingScore}
        onViewLeaderboard={() =>
          router.push(`/group/${groupId}/leaderboard` as any)
        }
        onRetake={() => {
          setCurrentQuestionIndex(0);
          setSelectedAnswer(null);
          setUserAnswers([]);
          setShowResult(false);
          setQuizResult(null);
          setIsSubmitting(false);
          startTimeRef.current = Date.now();
          if (quiz.timeLimit) setTimeLeft(quiz.timeLimit);
        }}
        onBack={() => router.back()}
      />
    );
  }

  const isTimeCritical = quiz.timeLimit && timeLeft < 30;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          {/* Exit button */}
          <Pressable
            onPress={handleExit}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>

          {/* Question counter */}
          <Typography variant="body" weight="semibold" color="text">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Typography>

          {/* Timer */}
          {quiz.timeLimit ? (
            <View
              style={{
                backgroundColor: isTimeCritical ? "#EF444420" : `${theme.colors.primary}20`,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Typography
                variant="body"
                weight="bold"
                style={{ color: isTimeCritical ? "#EF4444" : theme.colors.primary }}
              >
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </Typography>
            </View>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 4,
            backgroundColor: theme.colors.border,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Animated.View style={[progressAnimatedStyle, { height: "100%" }]}>
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, borderRadius: 2 }}
            />
          </Animated.View>
        </View>
      </View>

      {/* Question Content */}
      {currentQuestion && (
        <Animated.View
          key={currentQuestionIndex}
          entering={FadeInDown.duration(300)}
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 20,
          }}
        >
          {/* Question Card */}
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 24,
              marginBottom: 20,
            }}
          >
            <Typography
              variant="h3"
              weight="bold"
              color="text"
              style={{ lineHeight: 30 }}
            >
              {currentQuestion.text}
            </Typography>
          </View>

          {/* Answer Options */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {currentQuestion.options.map((option, index) => (
              <AnswerOption
                key={index}
                option={option}
                index={index}
                isSelected={selectedAnswer === index}
                showResult={showResult}
                isCorrect={currentQuestion.correctIndex === index}
                isUserAnswer={selectedAnswer === index}
                onSelect={() => handleSelectAnswer(index)}
                disabled={isSubmitting}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Next Button */}
      {selectedAnswer !== null && !showResult && (
        <Animated.View
          entering={FadeInUp.duration(250)}
          style={{
            padding: 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Pressable onPress={handleNext} disabled={isSubmitting}>
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 50,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Typography variant="body" weight="bold" style={{ color: "#FFFFFF" }}>
                    {isLastQuestion ? "Submit Quiz" : "Next Question"}
                  </Typography>
                  <Ionicons
                    name={isLastQuestion ? "checkmark-done" : "arrow-forward"}
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
