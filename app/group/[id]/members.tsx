import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  SectionList,
  StatusBar,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";

import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { useQuery } from "convex/react";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const groupId = id as Id<"groups">;
  const members = useQuery(api.groups.getGroupMembers, {
    groupId,
  });

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
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 8,
      backgroundColor: t.colors.background,
    },
    sectionTitle: {
      letterSpacing: 1,
    },
    memberRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    avatarFallback: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.primary + "20",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    memberInfo: {
      flex: 1,
    },
    adminChip: {
      backgroundColor: "#F59E0B22",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    listContent: {
      paddingBottom: 40,
    },
    emptyState: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 12,
    },
  }));

  const admins = (members ?? []).filter(
    (m: any) => m.role === "admin",
  );
  const regularMembers = (members ?? []).filter(
    (m: any) => m.role === "member",
  );

  const sections = [
    ...(admins.length > 0
      ? [{ title: "ADMINS", data: admins }]
      : []),
    ...(regularMembers.length > 0
      ? [{ title: "MEMBERS", data: regularMembers }]
      : []),
  ];

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
          Members ({members?.length ?? 0})
        </Typography>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Typography variant="body" color="textMuted">
            No members yet
          </Typography>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Typography
                variant="caption"
                weight="semibold"
                color="textMuted"
                style={styles.sectionTitle}
              >
                {title}
              </Typography>
            </View>
          )}
          renderItem={({
            item,
            index,
          }: {
            item: any;
            index: number;
          }) => (
            <Animated.View
              entering={FadeInDown.duration(300).delay(
                Math.min(index * 60, 400),
              )}
            >
              <Pressable style={styles.memberRow}>
                {item.profileImage ? (
                  <Image
                    source={{ uri: item.profileImage }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Ionicons
                      name="person"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </View>
                )}

                <View style={styles.memberInfo}>
                  <Typography
                    variant="body"
                    weight="semibold"
                    color="text"
                    numberOfLines={1}
                  >
                    {item.fullname}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textMuted"
                  >
                    @{item.username}
                  </Typography>
                </View>

                {item.role === "admin" ? (
                  <View style={styles.adminChip}>
                    <Typography
                      variant="caption"
                      weight="semibold"
                      style={{ color: "#F59E0B" }}
                    >
                      Admin
                    </Typography>
                  </View>
                ) : (
                  <Typography
                    variant="caption"
                    color="textMuted"
                  >
                    {formatDate(item.joinedAt)}
                  </Typography>
                )}
              </Pressable>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
