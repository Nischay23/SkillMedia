import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

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

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const groupId = id as Id<"groups">;
  const group = useQuery(api.groups.getGroupById, {
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
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      gap: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    content: {
      padding: 16,
      gap: 20,
    },
    chip: {
      alignSelf: "flex-start" as const,
      backgroundColor: t.colors.primary + "26",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statsRow: {
      flexDirection: "row" as const,
      gap: 12,
    },
    statBox: {
      flex: 1,
      backgroundColor: t.colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: "center" as const,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    leaveButton: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: "#EF4444",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    deleteText: {
      textAlign: "center" as const,
      marginTop: 12,
    },
  }));

  const handleLeave = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
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

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={
            isDark ? "light-content" : "dark-content"
          }
        />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body" color="textMuted">
            Loading...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  const createdDate = new Date(
    group.createdAt,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View style={styles.header}>
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
        <Typography variant="h3" weight="bold" color="text">
          Group Info
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Group name */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(0)}
        >
          <Typography
            variant="h2"
            weight="bold"
            color="text"
          >
            {group.name}
          </Typography>
        </Animated.View>

        {/* Career path chip */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(60)}
        >
          <View style={styles.chip}>
            <Typography
              variant="body"
              weight="medium"
              color="primary"
            >
              {group.filterOptionName}
            </Typography>
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(120)}
        >
          {group.description ? (
            <Typography
              variant="body"
              color="textSecondary"
              style={{ lineHeight: 22 }}
            >
              {group.description}
            </Typography>
          ) : (
            <Typography
              variant="body"
              color="textMuted"
              style={{ fontStyle: "italic" }}
            >
              No description
            </Typography>
          )}
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(180)}
          style={styles.statsRow}
        >
          <View style={styles.statBox}>
            <Typography
              variant="h2"
              weight="bold"
              color="text"
            >
              {group.memberCount}
            </Typography>
            <Typography variant="caption" color="textMuted">
              Members
            </Typography>
          </View>
          <View style={styles.statBox}>
            <Typography
              variant="body"
              weight="bold"
              color="text"
            >
              {createdDate}
            </Typography>
            <Typography variant="caption" color="textMuted">
              Created
            </Typography>
          </View>
        </Animated.View>

        {/* Leave Group */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(240)}
        >
          <Pressable
            onPressIn={() => {
              leaveScale.value = withSpring(0.96);
            }}
            onPressOut={() => {
              leaveScale.value = withSpring(1);
            }}
            onPress={handleLeave}
          >
            <Animated.View
              style={[styles.leaveButton, leaveScaleStyle]}
            >
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: "#EF4444" }}
              >
                Leave Group
              </Typography>
            </Animated.View>
          </Pressable>

          {group.currentUserRole === "admin" && (
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Delete Group",
                  "This action cannot be undone. Delete this group?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                    },
                  ],
                )
              }
            >
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
    </SafeAreaView>
  );
}
