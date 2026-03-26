import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import { Image } from "expo-image";

import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "@/providers/ThemeProvider";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";

const AnimatedPressable =
  Animated.createAnimatedComponent(Pressable);

// Type chip colors
const typeColors = {
  quiz: { bg: "#6C5DD3", text: "#FFFFFF" },
  steps: { bg: "#22C55E", text: "#FFFFFF" },
  streak: { bg: "#F59E0B", text: "#FFFFFF" },
};

// Type labels
const typeLabels = {
  quiz: "Quiz",
  steps: "Steps",
  streak: "Streak",
};

// Type icons
const typeIcons = {
  quiz: "help-circle",
  steps: "footsteps",
  streak: "flame",
} as const;

// Format time remaining
function formatTimeRemaining(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  if (hours > 0) {
    return `${hours}h left`;
  }
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}

// Check if deadline is urgent (< 2 days)
function isUrgent(ms: number): boolean {
  return ms < 2 * 24 * 60 * 60 * 1000;
}

// Participant Avatars Component
function ParticipantAvatars({
  participants,
  total,
}: {
  participants: Array<{ profileImage?: string; fullname?: string }>;
  total: number;
}) {
  const { theme } = useTheme();
  const displayCount = Math.min(participants.length, 3);
  const remaining = total - displayCount;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
      }}
    >
      {participants.slice(0, 3).map((participant, idx) => (
        <View
          key={idx}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            marginLeft: idx === 0 ? 0 : -10,
            borderWidth: 2,
            borderColor: theme.colors.surface,
            overflow: "hidden",
            backgroundColor: theme.colors.border,
            zIndex: 3 - idx,
          }}
        >
          {participant.profileImage ? (
            <Image
              source={participant.profileImage}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                weight="bold"
                style={{ color: "#FFFFFF", fontSize: 10 }}
              >
                {participant.fullname?.[0]?.toUpperCase() ?? "?"}
              </Typography>
            </View>
          )}
        </View>
      ))}
      {remaining > 0 && (
        <Typography
          variant="caption"
          color="textMuted"
          style={{ marginLeft: 8 }}
        >
          +{remaining} more
        </Typography>
      )}
      {total === 0 && (
        <Typography variant="caption" color="textMuted">
          Be the first to join!
        </Typography>
      )}
    </View>
  );
}

// Animated Progress Bar
function AnimatedProgressBar({
  progress,
  isCompleted,
  typeColor,
}: {
  progress: number;
  isCompleted: boolean;
  typeColor: { bg: string; text: string };
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
        height: 6,
        backgroundColor: theme.colors.border,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Animated.View style={[{ height: "100%" }, animatedBarStyle]}>
        <LinearGradient
          colors={
            isCompleted
              ? ["#22C55E", "#16A34A"]
              : [typeColor.bg, typeColor.bg]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: "100%",
            borderRadius: 3,
          }}
        />
      </Animated.View>
    </View>
  );
}

// Challenge Card Component
function ChallengeCard({
  challenge,
  index,
  onPress,
  onJoin,
  isJoining,
}: {
  challenge: any;
  index: number;
  onPress: () => void;
  onJoin: () => void;
  isJoining: boolean;
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

  const typeColor = typeColors[challenge.type as keyof typeof typeColors];
  const progress = challenge.userSubmission
    ? Math.min(
        (challenge.userSubmission.value / challenge.targetValue) *
          100,
        100,
      )
    : 0;
  const isCompleted = challenge.userSubmission?.isCompleted;
  const hasJoined = !!challenge.userSubmission;
  const urgent = isUrgent(challenge.timeRemaining);
  const daysRemaining = Math.floor(
    challenge.timeRemaining / (1000 * 60 * 60 * 24),
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 80)}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isCompleted
            ? "#22C55E40"
            : theme.colors.border,
        }}
      >
        {/* Top row: Title + Type chip */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          {/* Title */}
          <Typography
            variant="body"
            weight="semibold"
            color="text"
            style={{ flex: 1 }}
            numberOfLines={1}
          >
            {challenge.title}
          </Typography>

          {/* Type chip */}
          <View
            style={{
              backgroundColor: typeColor.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              marginLeft: 8,
            }}
          >
            <Typography
              variant="caption"
              weight="bold"
              style={{ color: typeColor.text, fontSize: 11 }}
            >
              {typeLabels[challenge.type as keyof typeof typeLabels]}
            </Typography>
          </View>
        </View>

        {/* Description */}
        {challenge.description && (
          <Typography
            variant="caption"
            color="textMuted"
            numberOfLines={2}
            style={{ marginTop: 6 }}
          >
            {challenge.description}
          </Typography>
        )}

        {/* Progress Section (if joined) */}
        {hasJoined && (
          <View style={{ marginTop: 12 }}>
            {/* Progress text */}
            <Typography
              variant="caption"
              color="textMuted"
              style={{ marginBottom: 6 }}
            >
              Your progress:{" "}
              <Typography
                variant="caption"
                weight="semibold"
                style={{
                  color: isCompleted
                    ? "#22C55E"
                    : theme.colors.text,
                }}
              >
                {challenge.userSubmission.value} / {challenge.targetValue}
              </Typography>
            </Typography>

            {/* Animated Progress bar */}
            <AnimatedProgressBar
              progress={progress}
              isCompleted={isCompleted}
              typeColor={typeColor}
            />
          </View>
        )}

        {/* Deadline row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 12,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={12}
            color={urgent ? "#EF4444" : theme.colors.textMuted}
          />
          <Typography
            variant="caption"
            style={{
              color: urgent ? "#EF4444" : theme.colors.textMuted,
            }}
          >
            {daysRemaining > 0
              ? `Ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`
              : formatTimeRemaining(challenge.timeRemaining)}
          </Typography>
        </View>

        {/* Participants */}
        {challenge.participants && (
          <ParticipantAvatars
            participants={challenge.participants || []}
            total={challenge.participantCount || 0}
          />
        )}

        {/* Action Button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (!hasJoined) {
              onJoin();
            } else {
              onPress();
            }
          }}
          disabled={isJoining}
          style={{
            marginTop: 16,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
            ...(isCompleted
              ? {
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: "#22C55E",
                }
              : hasJoined
                ? {
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                  }
                : {
                    overflow: "hidden",
                  }),
          }}
        >
          {!hasJoined && !isCompleted && (
            <LinearGradient
              colors={[typeColor.bg, typeColor.bg]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              }}
            />
          )}
          {isJoining ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : isCompleted ? (
            <Typography
              variant="body"
              weight="semibold"
              style={{ color: "#22C55E" }}
            >
              Completed ✓
            </Typography>
          ) : hasJoined ? (
            <Typography
              variant="body"
              weight="semibold"
              color="primary"
            >
              View Progress
            </Typography>
          ) : (
            <Typography
              variant="body"
              weight="semibold"
              style={{ color: "#FFFFFF" }}
            >
              Join Challenge
            </Typography>
          )}
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

// Empty State
function EmptyState() {
  const { theme } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
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
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Ionicons
          name="trophy-outline"
          size={48}
          color={theme.colors.primary}
        />
      </View>
      <Typography
        variant="h3"
        weight="bold"
        color="text"
        align="center"
        style={{ marginTop: 24 }}
      >
        No Active Challenges
      </Typography>
      <Typography
        variant="body"
        color="textMuted"
        align="center"
        style={{ marginTop: 8, maxWidth: 240 }}
      >
        Check back later for new challenges to join
      </Typography>
    </Animated.View>
  );
}

// Main Challenges Screen
export default function ChallengesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams<{
    id: string;
  }>();

  const [joiningId, setJoiningId] = React.useState<string | null>(
    null,
  );

  const challenges = useQuery(
    api.challenges.getChallengesByGroup,
    groupId
      ? { groupId: groupId as Id<"groups"> }
      : "skip",
  );

  const joinChallenge = useMutation(api.challenges.joinChallenge);

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

  const handleJoin = async (challengeId: Id<"challenges">) => {
    try {
      setJoiningId(challengeId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await joinChallenge({ challengeId });
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    } catch (error) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
    } finally {
      setJoiningId(null);
    }
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  const isLoading = challenges === undefined;
  const hasData = challenges && challenges.length > 0;

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
            <Ionicons
              name="arrow-back"
              size={18}
              color="#FFFFFF"
            />
          </AnimatedPressable>

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons
              name="flag"
              size={22}
              color="#6C5DD3"
            />
            <Typography
              variant="body"
              weight="semibold"
              color="text"
            >
              Challenges
            </Typography>
          </View>

          {/* Active count badge */}
          {hasData && (
            <View
              style={{
                backgroundColor: `${theme.colors.primary}20`,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Typography
                variant="caption"
                weight="bold"
                color="primary"
              >
                {challenges.length} active
              </Typography>
            </View>
          )}
        </View>

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
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
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
            Loading challenges...
          </Typography>
        </View>
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <ChallengeCard
              challenge={item}
              index={index}
              onPress={() =>
                router.push(
                  `/group/${groupId}/challenges/${item._id}`,
                )
              }
              onJoin={() => handleJoin(item._id)}
              isJoining={joiningId === item._id}
            />
          )}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
