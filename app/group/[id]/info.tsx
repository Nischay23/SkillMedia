import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
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

// Skeleton Loading
const SkeletonLoader = () => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withSpring(
        opacity.value === 0.3 ? 0.6 : 0.3,
      );
    }, 700);
    return () => clearInterval(interval);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ padding: 16, alignItems: "center" }}>
      <Animated.View
        style={[
          {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.colors.surface,
            marginTop: 16,
          },
          animatedStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 150,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.surface,
            marginTop: 16,
          },
          animatedStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 200,
            height: 16,
            borderRadius: 8,
            backgroundColor: theme.colors.surface,
            marginTop: 8,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

// Stat Box Component removed in favor of simple subtitle text

// Member Avatar (small version for preview)
const MemberPreviewAvatar = ({
  profileImage,
  name,
  index,
}: {
  profileImage?: string;
  name: string;
  index: number;
}) => {
  const { theme } = useTheme();

  if (profileImage) {
    return (
      <Image
        source={{ uri: profileImage }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: theme.colors.background,
          marginLeft: index === 0 ? 0 : -8,
        }}
        contentFit="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={["#6C5DD3", "#8676FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: theme.colors.background,
        marginLeft: index === 0 ? 0 : -8,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography
        variant="caption"
        weight="bold"
        style={{ color: "#FFFFFF" }}
      >
        {name?.charAt(0)?.toUpperCase() || "?"}
      </Typography>
    </LinearGradient>
  );
};

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const groupId = id as Id<"groups">;
  const group = useQuery(api.groups.getGroupById, {
    groupId,
  });
  const members = useQuery(api.groups.getGroupMembers, {
    groupId,
  });
  const leaveGroupMutation = useMutation(
    api.groups.leaveGroup,
  );

  // Leave button animation
  const leaveScale = useSharedValue(1);
  const leaveScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leaveScale.value }],
  }));

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    header: {
      backgroundColor: t.colors.surface,
      paddingTop: insets.top + 8,
    },
    headerContent: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.08)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    accentLine: {
      height: 1.5,
    },
    content: {
      paddingBottom: insets.bottom + 40,
    },
    identitySection: {
      alignItems: "center" as const,
      paddingTop: 16,
      paddingBottom: 24,
    },
    avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    careerChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      backgroundColor: `${t.colors.primary}26`,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 12,
    },
    section: {
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: t.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    sectionHeader: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginBottom: 12,
    },
    membersPreviewRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginTop: 4,
    },
    leaveButton: {
      height: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "#EF4444",
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
    },
    deleteText: {
      textAlign: "center" as const,
      paddingVertical: 16,
    },
  }));

  const handleLeave = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group? You can rejoin anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await leaveGroupMutation({ groupId });
            router.back();
            router.back();
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Group",
      "This action cannot be undone. All messages and members will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // TODO: Implement delete group mutation
            Alert.alert(
              "Info",
              "Delete group feature coming soon",
            );
          },
        },
      ],
    );
  };

  const isLoading = group === undefined;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const previewMembers = (members ?? []).slice(0, 5);
  const remainingCount = (members?.length ?? 0) - 5;

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={theme.colors.text}
            />
          </Pressable>
          <Typography
            variant="h3"
            weight="bold"
            color="text"
          >
            Group Info
          </Typography>
        </View>
        <LinearGradient
          colors={["#6C5DD3", "#8676FF", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
      </Animated.View>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Group Identity Section */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(0)}
            style={styles.identitySection}
          >
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarContainer}
            >
              <Typography
                variant="h1"
                weight="bold"
                style={{ color: "#FFFFFF", fontSize: 28 }}
              >
                {group?.name?.charAt(0)?.toUpperCase() ||
                  "G"}
              </Typography>
            </LinearGradient>

            <Typography
              variant="h2"
              weight="bold"
              color="text"
              style={{
                marginTop: 12,
                textAlign: "center",
                paddingHorizontal: 24,
              }}
            >
              {group?.name}
            </Typography>

            <Typography
              variant="caption"
              color="textMuted"
              style={{ marginTop: 4, textAlign: "center" }}
            >
              {group?.memberCount ?? 0} Members •{" "}
              {group?.messageCount ?? 0} Messages • Created{" "}
              {formatDate(group?.createdAt ?? Date.now())}
            </Typography>

            {group?.filterOptionName && (
              <Pressable
                style={styles.careerChip}
                onPress={() => {
                  // Navigate to home with filter applied
                  router.push("/(tabs)");
                }}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={12}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="caption"
                  weight="medium"
                  color="primary"
                >
                  {group.filterOptionName}
                </Typography>
              </Pressable>
            )}
          </Animated.View>

          {/* Description Section */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(200)}
            style={styles.section}
          >
            <Typography
              variant="caption"
              weight="semibold"
              color="textMuted"
              style={{ marginBottom: 8 }}
            >
              About
            </Typography>
            <Typography
              variant="body"
              color={
                group?.description ? "text" : "textMuted"
              }
              style={{
                lineHeight: 22,
                fontStyle: group?.description
                  ? "normal"
                  : "italic",
              }}
            >
              {group?.description || "No description added"}
            </Typography>
          </Animated.View>

          {/* Members Preview Section */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(360)}
            style={styles.section}
          >
            <Pressable
              onPress={() =>
                router.push(`/group/${id}/members`)
              }
              style={styles.sectionHeader}
            >
              <Typography
                variant="body"
                weight="semibold"
                color="text"
              >
                Members
              </Typography>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Typography
                  variant="caption"
                  color="primary"
                >
                  See all
                </Typography>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={theme.colors.primary}
                />
              </View>
            </Pressable>

            <View style={styles.membersPreviewRow}>
              {previewMembers.map(
                (member: any, index: number) => (
                  <MemberPreviewAvatar
                    key={member._id}
                    profileImage={member.profileImage}
                    name={member.fullname}
                    index={index}
                  />
                ),
              )}
              {remainingCount > 0 && (
                <Typography
                  variant="caption"
                  color="textMuted"
                  style={{ marginLeft: 12 }}
                >
                  +{remainingCount} more
                </Typography>
              )}
            </View>
          </Animated.View>

          {/* Actions Section */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(440)}
            style={{ marginTop: 24, marginHorizontal: 16 }}
          >
            <Pressable
              onPressIn={() => {
                leaveScale.value = withSpring(0.97);
              }}
              onPressOut={() => {
                leaveScale.value = withSpring(1);
              }}
              onPress={handleLeave}
            >
              <Animated.View
                style={[
                  styles.leaveButton,
                  leaveScaleStyle,
                ]}
              >
                <Ionicons
                  name="exit-outline"
                  size={20}
                  color="#EF4444"
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  style={{ color: "#EF4444" }}
                >
                  Leave Group
                </Typography>
              </Animated.View>
            </Pressable>

            {group?.currentUserRole === "admin" && (
              <Pressable onPress={handleDelete}>
                <Typography
                  variant="caption"
                  color="textMuted"
                  style={styles.deleteText}
                >
                  Delete Group
                </Typography>
              </Pressable>
            )}
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}
