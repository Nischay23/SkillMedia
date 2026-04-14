import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  SectionList,
  StatusBar,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

// Skeleton loading component
const SkeletonRow = ({ index }: { index: number }) => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withTiming(0.6, { duration: 700 });
    const interval = setInterval(() => {
      opacity.value = withTiming(
        opacity.value === 0.3 ? 0.6 : 0.3,
        { duration: 700 },
      );
    }, 700);
    return () => clearInterval(interval);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 50)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
      }}
    >
      <Animated.View
        style={[
          {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.surface,
          },
          animatedStyle,
        ]}
      />
      <View style={{ flex: 1, gap: 6 }}>
        <Animated.View
          style={[
            {
              width: "60%",
              height: 14,
              borderRadius: 7,
              backgroundColor: theme.colors.surface,
            },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              width: "40%",
              height: 12,
              borderRadius: 6,
              backgroundColor: theme.colors.surface,
            },
            animatedStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
};

// Member Avatar with gradient fallback
const MemberAvatar = ({
  profileImage,
  name,
  isAdmin,
  size = 44,
}: {
  profileImage?: string;
  name: string;
  isAdmin: boolean;
  size?: number;
}) => {
  const { theme } = useTheme();
  const borderRadius = size / 2;

  if (profileImage) {
    return (
      <View
        style={
          isAdmin
            ? {
                borderWidth: 2,
                borderColor: `${theme.colors.primary}66`,
                borderRadius: borderRadius + 2,
                padding: 1,
              }
            : undefined
        }
      >
        <Image
          source={{ uri: profileImage }}
          style={{
            width: size,
            height: size,
            borderRadius,
          }}
          contentFit="cover"
          transition={300}
        />
      </View>
    );
  }

  return (
    <View
      style={
        isAdmin
          ? {
              borderWidth: 2,
              borderColor: `${theme.colors.primary}66`,
              borderRadius: borderRadius + 2,
              padding: 1,
            }
          : undefined
      }
    >
      <LinearGradient
        colors={["#6C5DD3", "#8676FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="body"
          weight="bold"
          style={{ color: "#FFFFFF", fontSize: size * 0.4 }}
        >
          {name?.charAt(0)?.toUpperCase() || "?"}
        </Typography>
      </LinearGradient>
    </View>
  );
};

// Member Row Component
const MemberRow = ({
  item,
  index,
  onPress,
}: {
  item: any;
  index: number;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const bgOpacity = useSharedValue(0);

  const animatedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255,255,255,${bgOpacity.value})`,
  }));

  const formatJoinedDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Joined today";
    if (days === 1) return "Joined yesterday";
    if (days < 7) return `Joined ${days} days ago`;
    if (days < 30)
      return `Joined ${Math.floor(days / 7)} weeks ago`;
    if (days < 365)
      return `Joined ${Math.floor(days / 30)} months ago`;
    return `Joined ${Math.floor(days / 365)} years ago`;
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(
        Math.min(index * 50, 500),
      )}
    >
      <Pressable
        onPressIn={() => {
          bgOpacity.value = withTiming(0.03, {
            duration: 100,
          });
        }}
        onPressOut={() => {
          bgOpacity.value = withTiming(0, {
            duration: 200,
          });
        }}
        onPress={onPress}
      >
        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            },
            animatedBgStyle,
          ]}
        >
          <MemberAvatar
            profileImage={item.profileImage}
            name={item.fullname}
            isAdmin={item.role === "admin"}
          />

          <View style={{ flex: 1 }}>
            <Typography
              variant="body"
              weight="semibold"
              color="text"
              numberOfLines={1}
            >
              {item.fullname}
            </Typography>
            <Typography variant="caption" color="textMuted">
              @{item.username}
            </Typography>
            {item.role !== "admin" && (
              <Typography
                variant="caption"
                color="textMuted"
                style={{ marginTop: 2 }}
              >
                {formatJoinedDate(item.joinedAt)}
              </Typography>
            )}
          </View>

          {item.role === "admin" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: `${theme.colors.primary}26`,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
              }}
            >
              <Ionicons
                name="shield-checkmark"
                size={12}
                color={theme.colors.primary}
              />
              <Typography
                variant="caption"
                weight="bold"
                style={{
                  color: theme.colors.primary,
                  fontSize: 11,
                }}
              >
                Admin
              </Typography>
            </View>
          ) : (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.textMuted}
            />
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");

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
    headerTitle: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    accentLine: {
      height: 1.5,
    },
    searchContainer: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      height: 44,
      borderRadius: 24,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 14,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: t.colors.text,
      marginLeft: 10,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginTop: 8,
      backgroundColor: t.colors.background,
    },
    sectionTitle: {
      letterSpacing: 1.5,
    },
    emptyState: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: 60,
    },
    listContent: {
      paddingBottom: insets.bottom + 40,
    },
  }));

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!members) return { admins: [], regularMembers: [] };

    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? members.filter(
          (m: any) =>
            m.fullname?.toLowerCase().includes(query) ||
            m.username?.toLowerCase().includes(query),
        )
      : members;

    return {
      admins: filtered.filter(
        (m: any) => m.role === "admin",
      ),
      regularMembers: filtered.filter(
        (m: any) => m.role === "member",
      ),
    };
  }, [members, searchQuery]);

  const sections = useMemo(() => {
    const result = [];
    if (filteredMembers.admins.length > 0) {
      result.push({
        title: "ADMINS",
        data: filteredMembers.admins,
      });
    }
    if (filteredMembers.regularMembers.length > 0) {
      result.push({
        title: "MEMBERS",
        data: filteredMembers.regularMembers,
      });
    }
    return result;
  }, [filteredMembers]);

  const isLoading = members === undefined;
  const isEmpty = !isLoading && sections.length === 0;

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
          <View style={styles.headerTitle}>
            <Typography
              variant="h3"
              weight="bold"
              color="text"
            >
              Members
            </Typography>
            <Typography variant="caption" color="textMuted">
              ({members?.length ?? 0})
            </Typography>
          </View>
        </View>
        <LinearGradient
          colors={["#6C5DD3", "#8676FF", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(100)}
        style={styles.searchContainer}
      >
        <Ionicons
          name="search-outline"
          size={16}
          color={theme.colors.textMuted}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>

      {/* Loading State */}
      {isLoading && (
        <View>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} index={i} />
          ))}
        </View>
      )}

      {/* Empty State */}
      {isEmpty && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.emptyState}
        >
          <Ionicons
            name="people-outline"
            size={56}
            color={`${theme.colors.primary}66`}
          />
          <Typography
            variant="h3"
            weight="bold"
            color="text"
            style={{ marginTop: 16 }}
          >
            {searchQuery
              ? "No members found"
              : "No members yet"}
          </Typography>
          <Typography
            variant="body"
            color="textMuted"
            style={{ marginTop: 8, textAlign: "center" }}
          >
            {searchQuery
              ? "Try a different search term"
              : "Be the first to join this community!"}
          </Typography>
        </Animated.View>
      )}

      {/* Member List */}
      {!isLoading && !isEmpty && (
        <SectionList
          sections={sections}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section: { title } }) => (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.sectionHeader}
            >
              <Typography
                variant="caption"
                weight="semibold"
                color="textMuted"
                style={styles.sectionTitle}
              >
                {title}
              </Typography>
            </Animated.View>
          )}
          renderItem={({
            item,
            index,
          }: {
            item: any;
            index: number;
          }) => (
            <MemberRow
              item={item}
              index={index}
              onPress={() =>
                router.push(`/user/${item._id}`)
              }
            />
          )}
        />
      )}
    </View>
  );
}
