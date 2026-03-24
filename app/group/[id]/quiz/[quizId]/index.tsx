import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOut,
  runOnJS,
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

// Timer Bar Component
function TimerBar({
  totalTime,
  timeLeft,
  isRunning,
}: {
  totalTime: number;
  timeLeft: number;
  isRunning: boolean;
}) {
  const { theme } = useTheme();
  const progress = timeLeft / totalTime;
  const isWarning = progress <= 0.25;
  const isCritical = progress <= 0.1;

  return (
    <View
      style={{
        height: 6,
        backgroundColor: theme.colors.border,
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          width: `${progress * 100}%`,
          borderRadius: 3,
          backgroundColor: isCritical
            ? "#EF4444"
            : isWarning
              ? "#F97316"
              : theme.colors.primary,
        }}
      />
    </View>
  );
}

// MCQ Option Component
function MCQOption({
  option,
  index,
  isSelected,
  isMultiple,
  onSelect,
  disabled,
}: {
  option: string;
  index: number;
  isSelected: boolean;
  isMultiple: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 10 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <Animated.View entering={FadeInRight.duration(300).delay(index * 50)} style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isSelected
            ? `${theme.colors.primary}15`
            : theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        }}
      >
        {/* Letter badge */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isSelected
              ? theme.colors.primary
              : theme.colors.border,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          {isSelected ? (
            <Ionicons
              name={isMultiple ? "checkmark" : "checkmark"}
              size={20}
              color="#FFFFFF"
            />
          ) : (
            <Typography
              variant="body"
              weight="semibold"
              style={{ color: theme.colors.textMuted }}
            >
              {letters[index]}
            </Typography>
          )}
        </View>

        {/* Option text */}
        <Typography
          variant="body"
          color={isSelected ? "text" : "textMuted"}
          style={{ flex: 1 }}
        >
          {option}
        </Typography>
      </Pressable>
    </Animated.View>
  );
}

// True/False Button Component
function TrueFalseButton({
  value,
  isSelected,
  onSelect,
  disabled,
}: {
  value: boolean;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 10 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  const color = value ? "#22C55E" : "#EF4444";

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        {
          flex: 1,
          backgroundColor: isSelected ? `${color}20` : theme.colors.surface,
          borderRadius: 16,
          paddingVertical: 24,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: isSelected ? color : theme.colors.border,
        },
        animatedStyle,
      ]}
    >
      <Ionicons
        name={value ? "checkmark-circle" : "close-circle"}
        size={32}
        color={isSelected ? color : theme.colors.textMuted}
      />
      <Typography
        variant="body"
        weight="semibold"
        style={{ color: isSelected ? color : theme.colors.textMuted, marginTop: 8 }}
      >
        {value ? "True" : "False"}
      </Typography>
    </AnimatedPressable>
  );
}

// Main Take Quiz Screen
export default function TakeQuizScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: groupId, quizId } = useLocalSearchParams<{
    id: string;
    quizId: string;
  }>();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | string[]>>(new Map());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fillBlankText, setFillBlankText] = useState("");
  const startTimeRef = useRef(Date.now());
  const questionStartTimeRef = useRef(Date.now());

  const quiz = useQuery(
    api.quizzes.getQuizWithQuestions,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip",
  );

  const submitAttempt = useMutation(api.quizAttempts.submitAttempt);

  // Get current question
  const currentQuestion = quiz?.questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (quiz?.questions?.length ?? 1) - 1;

  // Initialize timer
  useEffect(() => {
    if (quiz) {
      if (quiz.timeLimit) {
        setTimeLeft(quiz.timeLimit);
      } else if (quiz.perQuestionTime) {
        setTimeLeft(quiz.perQuestionTime);
      }
      startTimeRef.current = Date.now();
      questionStartTimeRef.current = Date.now();
    }
  }, [quiz]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || !quiz || quiz.alreadyAttempted) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up!
          if (quiz.perQuestionTime && !isLastQuestion) {
            // Move to next question
            handleNext(true);
            return quiz.perQuestionTime;
          } else {
            // Submit quiz
            handleSubmit();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, quiz, isLastQuestion]);

  // Handle selecting an answer
  const handleSelectAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;

      setAnswers((prev) => {
        const newAnswers = new Map(prev);

        if (currentQuestion.type === "mcq_multiple") {
          const current = (newAnswers.get(currentQuestion._id) as string[]) || [];
          if (current.includes(answer)) {
            newAnswers.set(
              currentQuestion._id,
              current.filter((a) => a !== answer),
            );
          } else {
            newAnswers.set(currentQuestion._id, [...current, answer]);
          }
        } else {
          newAnswers.set(currentQuestion._id, answer);
        }

        return newAnswers;
      });
    },
    [currentQuestion],
  );

  // Handle fill in blank answer
  const handleFillBlank = useCallback(() => {
    if (!currentQuestion || !fillBlankText.trim()) return;
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(currentQuestion._id, fillBlankText.trim());
      return newAnswers;
    });
    setFillBlankText("");
  }, [currentQuestion, fillBlankText]);

  // Handle next question
  const handleNext = useCallback(
    (timedOut = false) => {
      if (!quiz) return;

      // Save fill blank answer if present
      if (currentQuestion?.type === "fill_blank" && fillBlankText.trim()) {
        handleFillBlank();
      }

      if (isLastQuestion) {
        handleSubmit();
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        questionStartTimeRef.current = Date.now();
        if (quiz.perQuestionTime) {
          setTimeLeft(quiz.perQuestionTime);
        }
        setFillBlankText("");
      }
    },
    [quiz, isLastQuestion, currentQuestion, fillBlankText],
  );

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!quiz || isSubmitting) return;

    setIsSubmitting(true);

    // Build answers array
    const answersArray: {
      questionId: Id<"questions">;
      selectedAnswer: string | string[];
      timeTaken?: number;
    }[] = [];

    for (const question of quiz.questions) {
      const answer = answers.get(question._id);
      answersArray.push({
        questionId: question._id as Id<"questions">,
        selectedAnswer: answer ?? "",
      });
    }

    const totalTimeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const result = await submitAttempt({
        quizId: quizId as Id<"quizzes">,
        answers: answersArray,
        timeTaken: totalTimeTaken,
      });

      // Navigate to results
      router.replace(`/group/${groupId}/quiz/${quizId}/results` as any);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      Alert.alert("Error", "Failed to submit quiz. Please try again.");
      setIsSubmitting(false);
    }
  }, [quiz, answers, isSubmitting, quizId, groupId, router, submitAttempt]);

  // Handle exit confirmation
  const handleExit = () => {
    Alert.alert(
      "Exit Quiz?",
      "Your progress will be lost. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
    );
  };

  // Loading state
  if (!quiz) {
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
          Loading quiz...
        </Typography>
      </View>
    );
  }

  // Already attempted state
  if (quiz.alreadyAttempted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: `${theme.colors.primary}15`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Ionicons name="checkmark-done" size={48} color={theme.colors.primary} />
        </View>
        <Typography variant="h3" weight="bold" color="text" align="center">
          Already Completed
        </Typography>
        <Typography
          variant="body"
          color="textMuted"
          align="center"
          style={{ marginTop: 12, marginBottom: 24 }}
        >
          You scored {quiz.previousAttempt?.percentage}% on this quiz
        </Typography>
        <Pressable
          onPress={() => router.replace(`/group/${groupId}/quiz/${quizId}/results` as any)}
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 16,
          }}
        >
          <Typography variant="body" weight="bold" style={{ color: "#FFFFFF" }}>
            View Results
          </Typography>
        </Pressable>
      </View>
    );
  }

  const totalTime = quiz.timeLimit || quiz.perQuestionTime || 30;
  const currentAnswer = answers.get(currentQuestion?._id ?? "");

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 16,
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

          {/* Progress */}
          <View style={{ alignItems: "center" }}>
            <Typography variant="caption" color="textMuted">
              Question
            </Typography>
            <Typography variant="body" weight="bold" color="text">
              {currentQuestionIndex + 1} / {quiz.questions.length}
            </Typography>
          </View>

          {/* Timer */}
          <View
            style={{
              backgroundColor:
                timeLeft <= 10
                  ? "#EF444420"
                  : timeLeft <= 30
                    ? "#F9731620"
                    : `${theme.colors.primary}20`,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{
                color:
                  timeLeft <= 10
                    ? "#EF4444"
                    : timeLeft <= 30
                      ? "#F97316"
                      : theme.colors.primary,
              }}
            >
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </Typography>
          </View>
        </View>

        {/* Timer bar */}
        <TimerBar totalTime={totalTime} timeLeft={timeLeft} isRunning={true} />

        {/* Progress dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {quiz.questions.map((_: any, index: number) => (
            <View
              key={index}
              style={{
                width: index === currentQuestionIndex ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  index < currentQuestionIndex
                    ? theme.colors.primary
                    : index === currentQuestionIndex
                      ? theme.colors.primary
                      : theme.colors.border,
              }}
            />
          ))}
        </View>
      </View>

      {/* Question Content */}
      {currentQuestion && (
        <Animated.View
          key={currentQuestion._id}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={{
            flex: 1,
            padding: 20,
          }}
        >
          {/* Question text */}
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Typography variant="h4" weight="semibold" color="text">
              {currentQuestion.text}
            </Typography>
            {currentQuestion.type === "mcq_multiple" && (
              <Typography
                variant="caption"
                color="textMuted"
                style={{ marginTop: 8 }}
              >
                Select all that apply
              </Typography>
            )}
          </View>

          {/* Answer options */}
          {currentQuestion.type === "mcq_single" ||
          currentQuestion.type === "mcq_multiple" ? (
            <View>
              {currentQuestion.options?.map((option: string, index: number) => (
                <MCQOption
                  key={option}
                  option={option}
                  index={index}
                  isSelected={
                    currentQuestion.type === "mcq_multiple"
                      ? ((currentAnswer as string[]) || []).includes(option)
                      : currentAnswer === option
                  }
                  isMultiple={currentQuestion.type === "mcq_multiple"}
                  onSelect={() => handleSelectAnswer(option)}
                  disabled={isSubmitting}
                />
              ))}
            </View>
          ) : currentQuestion.type === "true_false" ? (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TrueFalseButton
                value={true}
                isSelected={currentAnswer === "true"}
                onSelect={() => handleSelectAnswer("true")}
                disabled={isSubmitting}
              />
              <TrueFalseButton
                value={false}
                isSelected={currentAnswer === "false"}
                onSelect={() => handleSelectAnswer("false")}
                disabled={isSubmitting}
              />
            </View>
          ) : currentQuestion.type === "fill_blank" ? (
            <View>
              <TextInput
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  fontSize: 16,
                }}
                placeholder="Type your answer..."
                placeholderTextColor={theme.colors.textMuted}
                value={fillBlankText || (currentAnswer as string) || ""}
                onChangeText={setFillBlankText}
                returnKeyType="done"
                onSubmitEditing={handleFillBlank}
              />
              {(fillBlankText || currentAnswer) && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 12,
                    gap: 8,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Typography variant="caption" color="primary">
                    Answer recorded
                  </Typography>
                </View>
              )}
            </View>
          ) : null}
        </Animated.View>
      )}

      {/* Bottom action area */}
      <View
        style={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <Pressable
          onPress={() => handleNext()}
          disabled={isSubmitting}
          style={{ opacity: isSubmitting ? 0.5 : 1 }}
        >
          <LinearGradient
            colors={["#6C5DD3", "#8676FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 54,
              borderRadius: 16,
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
      </View>
    </View>
  );
}
