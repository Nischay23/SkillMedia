import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
import { useQuery } from "convex/react";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

const AnimatedPressable =
  Animated.createAnimatedComponent(Pressable);

// Medal colors
const medalColors = {
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
};

// Period filter tabs
const periods = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "allTime", label: "All Time" },
] as const;

// Top 3 Podium Component
function Podium({ leaders }: { leaders: any[] }) {
  const { theme } = useTheme();

  if (leaders.length < 3) return null;

  const [second, first, third] = [
    leaders[1],
    leaders[0],
    leaders[2],
  ];

  const renderPodiumPlace = (
    entry: any,
    position: 1 | 2 | 3,
    height: number,
  ) => {
    const colors = {
      1: {
        gradient: ["#FFD700", "#FFA500"],
        bg: "#FFD70030",
      },
      2: {
        gradient: ["#C0C0C0", "#A0A0A0"],
        bg: "#C0C0C030",
      },
      3: {
        gradient: ["#CD7F32", "#8B4513"],
        bg: "#CD7F3230",
      },
    };

    return (
      <Animated.View
        entering={FadeInDown.duration(500).delay(
          position * 100,
        )}
        style={{
          flex: 1,
          alignItems: "center",
        }}
      >
        {/* Avatar with crown for 1st */}
        <View
          style={{ marginBottom: 8, position: "relative" }}
        >
          {position === 1 && (
            <View
              style={{
                position: "absolute",
                top: -20,
                left: "50%",
                transform: [{ translateX: -12 }],
                zIndex: 10,
              }}
            >
              <Typography style={{ fontSize: 24 }}>
                👑
              </Typography>
            </View>
          )}
          <View
            style={{
              width: position === 1 ? 70 : 56,
              height: position === 1 ? 70 : 56,
              borderRadius: position === 1 ? 35 : 28,
              borderWidth: 3,
              borderColor: colors[position].gradient[0],
              overflow: "hidden",
              backgroundColor: theme.colors.surface,
            }}
          >
            {entry?.image ? (
              <Image
                source={entry.image}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={
                  colors[position].gradient as [
                    string,
                    string,
                  ]
                }
                style={{
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="h3"
                  weight="bold"
                  style={{ color: "#FFFFFF" }}
                >
                  {entry?.fullname?.[0]?.toUpperCase() ??
                    "?"}
                </Typography>
              </LinearGradient>
            )}
          </View>
        </View>

        {/* Name */}
        <Typography
          variant="caption"
          weight="semibold"
          color="text"
          numberOfLines={1}
          style={{ maxWidth: 80, textAlign: "center" }}
        >
          {entry?.fullname ?? "Unknown"}
        </Typography>

        {/* Score */}
        <Typography variant="caption" color="textMuted">
          {entry?.totalScore ?? 0} pts
        </Typography>

        {/* Podium stand */}
        <LinearGradient
          colors={
            colors[position].gradient as [string, string]
          }
          style={{
            width: "100%",
            height,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            marginTop: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h2"
            weight="bold"
            style={{ color: "#FFFFFF" }}
          >
            {position}
          </Typography>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 24,
      }}
    >
      {renderPodiumPlace(second, 2, 80)}
      {renderPodiumPlace(first, 1, 100)}
      {renderPodiumPlace(third, 3, 60)}
    </View>
  );
}

// Leaderboard Row Component
function LeaderboardRow({
  entry,
  index,
}: {
  entry: any;
  index: number;
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

  const isCurrentUser = entry.isCurrentUser;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 40)}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isCurrentUser
            ? `${theme.colors.primary}15`
            : theme.colors.surface,
          borderRadius: 16,
          padding: 14,
          marginBottom: 10,
          borderWidth: isCurrentUser ? 2 : 1,
          borderColor: isCurrentUser
            ? theme.colors.primary
            : theme.colors.border,
        }}
      >
        {/* Rank */}
        <View
          style={{
            width: 32,
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Typography
            variant="body"
            weight="bold"
            style={{
              color:
                entry.rank === 1
                  ? medalColors.gold
                  : entry.rank === 2
                    ? medalColors.silver
                    : entry.rank === 3
                      ? medalColors.bronze
                      : theme.colors.textMuted,
            }}
          >
            #{entry.rank}
          </Typography>
        </View>

        {/* Avatar */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            overflow: "hidden",
            marginRight: 12,
            backgroundColor: theme.colors.border,
          }}
        >
          {entry.image ? (
            <Image
              source={entry.image}
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
                variant="body"
                weight="bold"
                style={{ color: "#FFFFFF" }}
              >
                {entry.fullname?.[0]?.toUpperCase() ?? "?"}
              </Typography>
            </LinearGradient>
          )}
        </View>

        {/* Name and stats */}
        <View style={{ flex: 1 }}>
          <Typography
            variant="body"
            weight={isCurrentUser ? "bold" : "semibold"}
            color="text"
            numberOfLines={1}
          >
            {entry.fullname}
            {isCurrentUser && " (You)"}
          </Typography>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 2,
            }}
          >
            <Typography variant="caption" color="textMuted">
              {entry.quizCount} quizzes
            </Typography>
            {entry.currentStreak > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Typography style={{ fontSize: 12 }}>
                  🔥
                </Typography>
                <Typography
                  variant="caption"
                  style={{ color: "#F97316" }}
                >
                  {entry.currentStreak}
                </Typography>
              </View>
            )}
          </View>
        </View>

        {/* Score */}
        <View style={{ alignItems: "flex-end" }}>
          <Typography
            variant="body"
            weight="bold"
            color="primary"
          >
            {entry.totalScore}
          </Typography>
          <Typography variant="caption" color="textMuted">
            points
          </Typography>
        </View>
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
        No Rankings Yet
      </Typography>
      <Typography
        variant="body"
        color="textMuted"
        align="center"
        style={{ marginTop: 8, maxWidth: 240 }}
      >
        Complete quizzes to appear on the leaderboard
      </Typography>
    </Animated.View>
  );
}

// Main Leaderboard Screen
export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams<{
    id: string;
  }>();

  const [period, setPeriod] = useState<
    "week" | "month" | "allTime"
  >("week");

  const leaderboard = useQuery(
    api.leaderboard.getGroupLeaderboard,
    groupId
      ? { groupId: groupId as Id<"groups">, period }
      : "skip",
  );

  const userRank = useQuery(
    api.leaderboard.getUserRank,
    groupId
      ? { groupId: groupId as Id<"groups">, period }
      : "skip",
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

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  const isLoading = leaderboard === undefined;
  const hasData = leaderboard && leaderboard.length > 0;

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
              name="trophy"
              size={22}
              color="#F59E0B"
            />
            <Typography
              variant="body"
              weight="semibold"
              color="text"
            >
              Leaderboard
            </Typography>
          </View>

          {/* User rank badge */}
          {userRank?.rank && (
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
                #{userRank.rank}
              </Typography>
            </View>
          )}
        </View>

        <LinearGradient
          colors={["#F59E0B", "#FBBF24", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 2,
            marginTop: 14,
            marginHorizontal: -16,
          }}
        />
      </Animated.View>

      {/* Period tabs */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {periods.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setPeriod(item.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor:
                period === item.key
                  ? theme.colors.primary
                  : theme.colors.surface,
              borderWidth: 1,
              borderColor:
                period === item.key
                  ? theme.colors.primary
                  : theme.colors.border,
              alignItems: "center",
            }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{
                color:
                  period === item.key
                    ? "#FFFFFF"
                    : theme.colors.textMuted,
              }}
            >
              {item.label}
            </Typography>
          </Pressable>
        ))}
      </View>

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
            Loading leaderboard...
          </Typography>
        </View>
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <Podium leaders={leaderboard.slice(0, 3)} />
          )}

          {/* Rest of leaderboard */}
          <View style={{ paddingHorizontal: 16 }}>
            {leaderboard
              .slice(3)
              .map((entry: any, index: number) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  index={index}
                />
              ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
