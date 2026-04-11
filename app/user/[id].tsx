// app/user/[id].tsx — User profile deep-link screen
import { Loader } from "@/components/Loader";
import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
  FlatList,
  SafeAreaView,
  StatusBar,
} from "react-native";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const profile = useQuery(api.users.getUserProfile, {
    id: id as Id<"users">,
  });
  const posts = useQuery(api.posts.getPostsByUser, {
    userId: id as Id<"users">,
  });
  const isFollowing = useQuery(api.users.isFollowing, {
    followingId: id as Id<"users">,
  });

  const toggleFollow = useMutation(api.users.toggleFollow);

  // Follow button press animation
  const followScale = useSharedValue(1);
  const followAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: followScale.value }],
  }));

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.background,
    },
    headerBackBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    profileInfo: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 0,
    },
    avatarAndStats: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    avatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 3,
      borderColor: t.colors.primary,
    },
    statsContainer: {
      flex: 1,
      flexDirection: "row" as const,
      justifyContent: "space-evenly" as const,
      alignItems: "center" as const,
      marginLeft: 24,
    },
    statItem: {
      alignItems: "center" as const,
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: t.colors.border,
    },
    followButton: {
      height: 40,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.colors.primary,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: 20,
      marginTop: 14,
    },
    followingButton: {
      backgroundColor: t.colors.primary + "18",
    },
    gridContainer: {
      paddingHorizontal: 1.5,
      marginTop: 16,
      paddingBottom: 80,
    },
    gridItem: {
      flex: 1 / 3,
      aspectRatio: 1,
      margin: 1.5,
      borderRadius: 10,
      overflow: "hidden" as const,
    },
    gridImage: {
      width: "100%" as const,
      height: "100%" as const,
    },
    emptyContainer: {
      height: 200,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      gap: 12,
      marginTop: 24,
    },
    divider: {
      height: 1,
      backgroundColor: t.colors.border,
      marginTop: 14,
    },
  }));

  if (
    profile === undefined ||
    posts === undefined ||
    isFollowing === undefined
  )
    return <Loader />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* HEADER */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(50)}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerBackBtn}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        <Typography variant="h4" weight="bold" color="text">
          {profile.username}
        </Typography>

        {/* Spacer to center the title */}
        <View style={{ width: 38 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInDown.duration(350).delay(100)}
          style={styles.profileInfo}
        >
          {/* Avatar + Stats */}
          <View style={styles.avatarAndStats}>
            <Image
              source={profile.image}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Typography variant="body" weight="bold" color="text">
                  {profile.posts}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Posts
                </Typography>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Typography variant="body" weight="bold" color="text">
                  {profile.followers}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Followers
                </Typography>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Typography variant="body" weight="bold" color="text">
                  {profile.following}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Following
                </Typography>
              </View>
            </View>
          </View>

          {/* Name + Bio */}
          <Typography
            variant="body"
            weight="semibold"
            color="text"
            style={{ marginTop: 10 }}
          >
            {profile.fullname}
          </Typography>
          {profile.bio && (
            <Typography
              variant="caption"
              color="textSecondary"
              numberOfLines={3}
              style={{ marginTop: 3, lineHeight: 18 }}
            >
              {profile.bio}
            </Typography>
          )}

          {/* Follow Button */}
          <Animated.View style={followAnimatedStyle}>
            <Pressable
              onPressIn={() => {
                followScale.value = withSpring(0.96, {
                  damping: 15,
                  stiffness: 300,
                });
              }}
              onPressOut={() => {
                followScale.value = withSpring(1, {
                  damping: 15,
                  stiffness: 300,
                });
              }}
              onPress={() =>
                toggleFollow({ followingId: id as Id<"users"> })
              }
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
            >
              <Typography
                variant="body"
                weight="semibold"
                color={isFollowing ? "primary" : "text"}
                style={{
                  color: isFollowing
                    ? theme.colors.primary
                    : theme.colors.primary,
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </Typography>
            </Pressable>
          </Animated.View>
        </Animated.View>

        {/* Grid divider */}
        <View style={styles.divider} />

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.emptyContainer}
          >
            <Ionicons
              name="images-outline"
              size={48}
              color={theme.colors.textMuted}
            />
            <Typography variant="body" color="textMuted">
              No posts yet
            </Typography>
          </Animated.View>
        ) : (
          <FlatList
            data={posts}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.duration(300).delay(
                  Math.min(index * 60, 400),
                )}
                style={styles.gridItem}
              >
                <TouchableOpacity>
                  <Image
                    source={item.imageUrl}
                    style={styles.gridImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
            keyExtractor={(item) => item._id}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
