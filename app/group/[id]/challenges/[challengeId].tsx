import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "@/providers/ThemeProvider";
import { useMutation, useQuery } from "convex/react";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

const AnimatedPressable =
  Animated.createAnimatedComponent(Pressable);

// Type colors
const typeColors = {
  quiz: { bg: "#6C5DD3", gradient: ["#6C5DD3", "#8676FF"] },
  steps: {
    bg: "#22C55E",
    gradient: ["#22C55E", "#16A34A"],
  },
  streak: {
    bg: "#F59E0B",
    gradient: ["#F59E0B", "#FBBF24"],
  },
};

// Type labels
const typeLabels = {
  quiz: "Quiz Challenge",
  steps: "Steps Challenge",
  streak: "Streak Challenge",
};

// Type icons
const typeIcons = {
  quiz: "help-circle",
  steps: "footsteps",
  streak: "flame",
} as const;

// Type units
const typeUnits = {
  quiz: "quizzes",
  steps: "steps",
  streak: "days",
};

// Format date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format time remaining
function formatTimeRemaining(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  if (days > 0) {
    return `${days} days ${hours} hours`;
  }
  if (hours > 0) {
    return `${hours} hours`;
  }
  const minutes = Math.floor(
    (ms % (1000 * 60 * 60)) / (1000 * 60),
  );
  return `${minutes} minutes`;
}

// Animated Progress Bar Component
function AnimatedProgressBar({
  progress,
  isCompleted,
  typeGradient,
}: {
  progress: number;
  isCompleted: boolean;
  typeGradient: [string, string];
}) {
  const { theme } = useTheme();
  const animatedWidth = useSharedValue(0);

  React.useEffect(() => {
    animatedWidth.value = withSpring(progress, {
      damping: 15,
      stiffness: 80,
    });
  }, [progress]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View
      style={{
        height: 12,
        backgroundColor: theme.colors.border,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[{ height: "100%" }, animatedBarStyle]}
      >
        <LinearGradient
          colors={
            isCompleted
              ? ["#22C55E", "#16A34A"]
              : typeGradient
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: "100%",
            borderRadius: 6,
          }}
        />
      </Animated.View>
    </View>
  );
}

// Medal colors
const medalColors = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

// Leaderboard Row
function LeaderboardRow({
  entry,
  index,
  targetValue,
  challengeType,
}: {
  entry: any;
  index: number;
  targetValue: number;
  challengeType: string;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const medalColor =
    medalColors[entry.rank as keyof typeof medalColors];

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 50)}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: entry.isCompleted
            ? "#22C55E40"
            : theme.colors.border,
        }}
      >
        {/* Rank */}
        <View
          style={{
            width: 28,
            alignItems: "center",
            marginRight: 10,
          }}
        >
          {medalColor ? (
            <Ionicons
              name="medal"
              size={20}
              color={medalColor}
            />
          ) : (
            <Typography
              variant="caption"
              weight="bold"
              color="textMuted"
            >
              #{entry.rank}
            </Typography>
          )}
        </View>

        {/* Avatar */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            overflow: "hidden",
            marginRight: 10,
            backgroundColor: theme.colors.border,
          }}
        >
          {entry.user?.profileImage ? (
            <Image
              source={entry.user.profileImage}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                weight="bold"
                style={{ color: "#FFFFFF" }}
              >
                {entry.user?.fullname?.[0]?.toUpperCase() ??
                  "?"}
              </Typography>
            </LinearGradient>
          )}
        </View>

        {/* Name */}
        <View style={{ flex: 1 }}>
          <Typography
            variant="body"
            weight="semibold"
            color="text"
            numberOfLines={1}
          >
            {entry.user?.fullname ?? "Unknown"}
          </Typography>
          {entry.isCompleted && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={12}
                color="#22C55E"
              />
              <Typography
                variant="caption"
                style={{ color: "#22C55E" }}
              >
                Completed
              </Typography>
            </View>
          )}
        </View>

        {/* Progress */}
        <View style={{ alignItems: "flex-end" }}>
          <Typography
            variant="body"
            weight="bold"
            color="primary"
          >
            {entry.value}
          </Typography>
          <Typography variant="caption" color="textMuted">
            / {targetValue}
          </Typography>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Main Challenge Detail Screen
export default function ChallengeDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: groupId, challengeId } =
    useLocalSearchParams<{
      id: string;
      challengeId: string;
    }>();

  const [isJoining, setIsJoining] = React.useState(false);

  const challenges = useQuery(
    api.challenges.getChallengesByGroup,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip",
  );

  const leaderboard = useQuery(
    api.challenges.getChallengeLeaderboard,
    challengeId
      ? { challengeId: challengeId as Id<"challenges"> }
      : "skip",
  );

  const joinChallenge = useMutation(
    api.challenges.joinChallenge,
  );

  // Find the specific challenge from the list
  const challenge = challenges?.find(
    (c) => c._id === challengeId,
  );

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

  const handleJoin = async () => {
    if (!challengeId) return;
    try {
      setIsJoining(true);
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Medium,
      );
      await joinChallenge({
        challengeId: challengeId as Id<"challenges">,
      });
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (error) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
    } finally {
      setIsJoining(false);
    }
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  const isLoading = challenges === undefined;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
        <Typography
          variant="body"
          color="textMuted"
          style={{ marginTop: 16 }}
        >
          Loading challenge...
        </Typography>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={theme.colors.textMuted}
        />
        <Typography
          variant="h3"
          weight="bold"
          color="text"
          align="center"
          style={{ marginTop: 16 }}
        >
          Challenge Not Found
        </Typography>
        <Typography
          variant="body"
          color="textMuted"
          align="center"
          style={{ marginTop: 8 }}
        >
          This challenge may have ended or been removed.
        </Typography>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Typography
            variant="body"
            weight="semibold"
            style={{ color: "#FFFFFF" }}
          >
            Go Back
          </Typography>
        </Pressable>
      </View>
    );
  }

  const typeColor =
    typeColors[challenge.type as keyof typeof typeColors];
  const hasJoined = !!challenge.userSubmission;
  const isCompleted =
    challenge.userSubmission?.isCompleted ?? false;
  const progress =
    hasJoined && challenge.userSubmission
      ? Math.min(
          (challenge.userSubmission.value /
            challenge.targetValue) *
            100,
          100,
        )
      : 0;
  const urgent =
    challenge.timeRemaining < 2 * 24 * 60 * 60 * 1000;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={typeColor.gradient as [string, string]}
          style={{
            paddingTop: insets.top,
            paddingHorizontal: 16,
            paddingBottom: 32,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <AnimatedPressable
              onPress={handleBackPress}
              style={[
                {
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "rgba(255,255,255,0.2)",
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

            <View style={{ flex: 1 }}>
              <Typography
                variant="caption"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                {
                  typeLabels[
                    challenge.type as keyof typeof typeLabels
                  ]
                }
              </Typography>
            </View>
          </View>

          {/* Challenge Icon */}
          <Animated.View
            entering={ZoomIn.duration(400).delay(100)}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons
              name={
                typeIcons[
                  challenge.type as keyof typeof typeIcons
                ]
              }
              size={40}
              color="#FFFFFF"
            />
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(150)}
          >
            <Typography
              variant="h2"
              weight="bold"
              align="center"
              style={{ color: "#FFFFFF", marginBottom: 8 }}
            >
              {challenge.title}
            </Typography>
            {challenge.description && (
              <Typography
                variant="body"
                align="center"
                style={{
                  color: "rgba(255,255,255,0.9)",
                  maxWidth: 300,
                  alignSelf: "center",
                }}
              >
                {challenge.description}
              </Typography>
            )}
          </Animated.View>
        </LinearGradient>

        {/* Progress Card */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            marginHorizontal: 16,
            marginTop: -20,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          {/* Target */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View>
              <Typography
                variant="caption"
                color="textMuted"
              >
                Target
              </Typography>
              <Typography
                variant="h3"
                weight="bold"
                color="text"
              >
                {challenge.targetValue}{" "}
                {
                  typeUnits[
                    challenge.type as keyof typeof typeUnits
                  ]
                }
              </Typography>
            </View>
            {hasJoined && (
              <View style={{ alignItems: "flex-end" }}>
                <Typography
                  variant="caption"
                  color="textMuted"
                >
                  Your Progress
                </Typography>
                <Typography
                  variant="h3"
                  weight="bold"
                  style={{
                    color: isCompleted
                      ? "#22C55E"
                      : theme.colors.primary,
                  }}
                >
                  {challenge.userSubmission?.value ?? 0}
                </Typography>
              </View>
            )}
          </View>

          {/* Progress bar (if joined) */}
          {hasJoined && challenge.userSubmission && (
            <View style={{ marginBottom: 16 }}>
              <AnimatedProgressBar
                progress={progress}
                isCompleted={isCompleted}
                typeGradient={
                  typeColor.gradient as [string, string]
                }
              />
              <Typography
                variant="caption"
                color="textMuted"
                align="center"
                style={{ marginTop: 8 }}
              >
                {Math.round(progress)}% complete
              </Typography>
            </View>
          )}

          {/* Time remaining */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={
                urgent ? "#EF4444" : theme.colors.textMuted
              }
            />
            <Typography
              variant="body"
              style={{
                color: urgent
                  ? "#EF4444"
                  : theme.colors.textMuted,
              }}
            >
              {formatTimeRemaining(challenge.timeRemaining)}{" "}
              left
            </Typography>
          </View>

          {/* Date range */}
          <Typography
            variant="caption"
            color="textMuted"
            align="center"
            style={{ marginTop: 4 }}
          >
            {formatDate(challenge.startDate)} -{" "}
            {formatDate(challenge.endDate)}
          </Typography>
        </Animated.View>

        {/* Completion Badge */}
        {isCompleted && (
          <Animated.View
            entering={ZoomIn.duration(400).delay(300)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#22C55E20",
              marginHorizontal: 16,
              marginTop: 16,
              paddingVertical: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#22C55E40",
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#22C55E"
            />
            <Typography
              variant="body"
              weight="bold"
              style={{ color: "#22C55E" }}
            >
              Challenge Completed!
            </Typography>
          </Animated.View>
        )}

        {/* Leaderboard Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(350)}
          style={{ marginTop: 24, paddingHorizontal: 16 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Ionicons
              name="podium"
              size={20}
              color={theme.colors.primary}
            />
            <Typography
              variant="body"
              weight="bold"
              color="text"
            >
              Leaderboard
            </Typography>
            {leaderboard && (
              <View
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="primary"
                >
                  {leaderboard.length} participants
                </Typography>
              </View>
            )}
          </View>

          {leaderboard === undefined ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 32,
              }}
            >
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
              />
            </View>
          ) : leaderboard.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 32,
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Ionicons
                name="people-outline"
                size={32}
                color={theme.colors.textMuted}
              />
              <Typography
                variant="body"
                color="textMuted"
                style={{ marginTop: 8 }}
              >
                No participants yet
              </Typography>
              <Typography
                variant="caption"
                color="textMuted"
                style={{ marginTop: 4 }}
              >
                Be the first to join!
              </Typography>
            </View>
          ) : (
            <View>
              {leaderboard.map((entry, index) => (
                <LeaderboardRow
                  key={entry.user?._id || index}
                  entry={entry}
                  index={index}
                  targetValue={challenge.targetValue}
                  challengeType={challenge.type}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Action Button */}
      {!hasJoined && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Pressable
            onPress={handleJoin}
            disabled={isJoining}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: typeColor.bg,
            }}
          >
            {isJoining ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="add-circle"
                  size={22}
                  color="#FFFFFF"
                />
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: "#FFFFFF" }}
                >
                  Join Challenge
                </Typography>
              </>
            )}
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
