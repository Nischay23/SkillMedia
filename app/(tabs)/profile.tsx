import { Loader } from "@/components/Loader";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
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
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  SafeAreaView,
  StatusBar,
  Pressable,
} from "react-native";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";

export default function Profile() {
  const { signOut, userId } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] =
    useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Animation values
  const headerOpacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkId: userId } : "skip",
  );

  // Fetch roadmap progress
  const roadmapsProgress = useQuery(
    api.roadmaps.getMyRoadmapsProgress,
  );

  // Fetch streak data
  const streakData = useQuery(api.streaks.getMyStreak);

  const [editedProfile, setEditedProfile] = useState({
    fullname: currentUser?.fullname || "",
    bio: currentUser?.bio || "",
  });

  const [selectedPost, setSelectedPost] =
    useState<any>(null);

  const posts = useQuery(
    api.posts.getPostsByUser,
    currentUser ? { userId: currentUser._id } : "skip",
  );

  // Disable entering animations after first data load
  useEffect(() => {
    if (posts !== undefined && isFirstLoad) {
      const timer = setTimeout(
        () => setIsFirstLoad(false),
        800,
      );
      return () => clearTimeout(timer);
    }
  }, [posts, isFirstLoad]);

  const updateProfile = useMutation(
    api.users.updateProfile,
  );

  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    headerRight: {
      flexDirection: "row" as const,
      gap: theme.spacing.lg,
    },
    headerIcon: {
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
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
      borderColor: theme.colors.primary,
    },
    statsContainer: {
      flex: 1,
      flexDirection: "row" as const,
      justifyContent: "space-evenly" as const,
      alignItems: "center" as const,
      marginLeft: 20,
    },
    statItem: {
      alignItems: "center" as const,
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: theme.colors.border,
    },
    statNumber: {
      fontSize: 17,
      fontWeight: "700" as const,
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
    nameText: {
      fontSize: 14,
      fontWeight: "600" as const,
      color: theme.colors.text,
      marginTop: 10,
    },
    bioText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
    actionRow: {
      flexDirection: "row" as const,
      gap: 8,
      marginTop: 12,
    },
    editButton: {
      flex: 1,
      height: 34,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      borderRadius: 8,
      backgroundColor: "transparent",
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    editButtonText: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: theme.colors.primary,
    },
    shareButton: {
      height: 34,
      width: 34,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    gridDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginTop: 14,
    },
    gridContainer: {
      paddingHorizontal: 1.5,
      marginTop: 2,
      paddingBottom: 90,
    },
    gridItem: {
      flex: 1 / 3,
      aspectRatio: 1,
      margin: 1.5,
      borderRadius: 12,
      overflow: "hidden" as const,
    },
    gridImage: {
      width: "100%" as const,
      height: "100%" as const,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      margin: theme.spacing.lg,
      width: "90%" as const,
      maxHeight: "80%" as const,
    },
    modalHeader: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginBottom: theme.spacing.lg,
    },
    inputContainer: {
      marginBottom: theme.spacing.lg,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontSize: theme.typography.sizes.body,
    },
    bioInput: {
      height: 100,
      textAlignVertical: "top" as const,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    postDetailContainer: {
      width: "90%" as const,
      maxHeight: "80%" as const,
    },
    postDetailHeader: {
      flexDirection: "row" as const,
      justifyContent: "flex-end" as const,
      padding: theme.spacing.md,
    },
    postDetailImage: {
      width: "100%" as const,
      aspectRatio: 1,
      borderRadius: theme.borderRadius.lg,
    },
    emptyStateContainer: {
      height: 200,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      gap: 12,
      marginTop: theme.spacing.xl,
    },
  }));

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSaveProfile = async () => {
    await updateProfile(editedProfile);
    setIsEditModalVisible(false);
  };

  const handleEditPress = () => {
    buttonScale.value = withSpring(0.95, {
      damping: 10,
      stiffness: 400,
    });
    setTimeout(() => {
      buttonScale.value = withSpring(1, {
        damping: 10,
        stiffness: 400,
      });
      setIsEditModalVisible(true);
    }, 100);
  };

  if (!currentUser || posts === undefined)
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
        style={[styles.header, headerAnimatedStyle]}
      >
        <View style={styles.headerLeft}>
          <Typography
            variant="h2"
            color="text"
            weight="bold"
          >
            {currentUser.username}
          </Typography>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => signOut()}
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          {/* Avatar + Stats row (Instagram style) */}
          <View style={styles.avatarAndStats}>
            <Image
              source={currentUser.image}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Typography variant="body" weight="bold" color="text">
                  {currentUser.posts}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Posts
                </Typography>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Typography variant="body" weight="bold" color="text">
                  {currentUser.followers}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Followers
                </Typography>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Typography variant="body" weight="bold" color="text">
                  {currentUser.following}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Following
                </Typography>
              </View>
            </View>
          </View>

          {/* Streak Card */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              padding: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            {/* Flame icon */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: streakData && streakData.currentStreak > 0 ? "#F59E0B15" : `${theme.colors.textMuted}10`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="flame"
                size={32}
                color={streakData && streakData.currentStreak > 0 ? "#F59E0B" : theme.colors.textMuted}
              />
            </View>

            {/* Center: streak count */}
            <View style={{ flex: 1, marginLeft: 16 }}>
              {streakData && streakData.currentStreak > 0 ? (
                <>
                  <Typography variant="h2" weight="bold" color="primary">
                    {streakData.currentStreak}
                  </Typography>
                  <Typography variant="caption" color="textMuted">
                    day streak
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body" weight="semibold" color="textMuted">
                    No streak
                  </Typography>
                  <Typography variant="caption" color="textMuted">
                    Start your streak today!
                  </Typography>
                </>
              )}
            </View>

            {/* Right: best streak */}
            {streakData && streakData.longestStreak > 0 && (
              <View
                style={{
                  alignItems: "flex-end",
                  paddingLeft: 12,
                  borderLeftWidth: 1,
                  borderLeftColor: theme.colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="trophy" size={14} color="#F59E0B" />
                  <Typography variant="caption" color="textMuted">
                    Best
                  </Typography>
                </View>
                <Typography variant="body" weight="semibold" color="text">
                  {streakData.longestStreak} days
                </Typography>
              </View>
            )}
          </Animated.View>

          {/* Name + Bio */}
          <Typography
            variant="body"
            weight="semibold"
            color="text"
            style={{ marginTop: 10 }}
          >
            {currentUser.fullname}
          </Typography>
          {currentUser.bio && (
            <Typography
              variant="caption"
              color="textSecondary"
              numberOfLines={2}
              style={{ marginTop: 2, lineHeight: 18 }}
            >
              {currentUser.bio}
            </Typography>
          )}

          {/* Action row: Edit Profile + Share */}
          <View style={styles.actionRow}>
            <Animated.View
              style={[{ flex: 1 }, buttonAnimatedStyle]}
            >
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditPress}
                activeOpacity={0.7}
              >
                <Typography
                  variant="body"
                  weight="semibold"
                  color="primary"
                  style={{ fontSize: 13 }}
                >
                  Edit profile
                </Typography>
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons
                name="person-add-outline"
                size={16}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* My Roadmaps Section */}
        {roadmapsProgress && roadmapsProgress.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{
              marginTop: 20,
              paddingHorizontal: 16,
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Ionicons
                  name="map"
                  size={18}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  color="text"
                >
                  My Roadmaps
                </Typography>
              </View>
              <Typography
                variant="caption"
                color="textMuted"
              >
                {roadmapsProgress.length} active
              </Typography>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {roadmapsProgress.map((progress: any, index: number) => (
                <RoadmapProgressCard
                  key={progress.roadmapId}
                  progress={progress}
                  index={index}
                  onPress={() => {
                    // Navigate to the group's roadmap
                    if (progress.groupId) {
                      router.push(`/group/${progress.groupId}/roadmap` as any);
                    }
                  }}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.profileInfo}>
          {/* Grid divider */}
          <View style={styles.gridDivider} />
        </View>

        {posts.length === 0 && <NoPostsFound />}

        <FlatList
          data={posts}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.gridContainer}
          renderItem={({ item, index }) => (
            <AnimatedCard
              delay={Math.min((index + 1) * 100, 500)}
              useEnteringAnimation={isFirstLoad}
              style={styles.gridItem}
            >
              <TouchableOpacity
                onPress={() => setSelectedPost(item)}
              >
                <Image
                  source={item.imageUrl}
                  style={styles.gridImage}
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            </AnimatedCard>
          )}
        />
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
        >
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios" ? "padding" : "height"
            }
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography
                  variant="h3"
                  color="text"
                  weight="bold"
                >
                  Edit Profile
                </Typography>
                <TouchableOpacity
                  onPress={() =>
                    setIsEditModalVisible(false)
                  }
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Typography
                  variant="body"
                  color="text"
                  weight="medium"
                  style={{ marginBottom: theme.spacing.sm }}
                >
                  Name
                </Typography>
                <TextInput
                  style={styles.input}
                  value={editedProfile.fullname}
                  onChangeText={(text) =>
                    setEditedProfile((prev) => ({
                      ...prev,
                      fullname: text,
                    }))
                  }
                  placeholderTextColor={
                    theme.colors.textMuted
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <Typography
                  variant="body"
                  color="text"
                  weight="medium"
                  style={{ marginBottom: theme.spacing.sm }}
                >
                  Bio
                </Typography>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editedProfile.bio}
                  onChangeText={(text) =>
                    setEditedProfile((prev) => ({
                      ...prev,
                      bio: text,
                    }))
                  }
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={
                    theme.colors.textMuted
                  }
                />
              </View>

              <AnimatedButton
                title="Save Changes"
                onPress={handleSaveProfile}
                variant="primary"
              />
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* SELECTED IMAGE MODAL */}
      <Modal
        visible={!!selectedPost}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalBackdrop}>
          {selectedPost && (
            <View style={styles.postDetailContainer}>
              <View style={styles.postDetailHeader}>
                <TouchableOpacity
                  onPress={() => setSelectedPost(null)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.background}
                  />
                </TouchableOpacity>
              </View>
              <Image
                source={selectedPost.imageUrl}
                cachePolicy={"memory-disk"}
                style={styles.postDetailImage}
              />
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Roadmap Progress Card Component
function RoadmapProgressCard({
  progress,
  index,
  onPress,
}: {
  progress: {
    roadmapId: string;
    title: string;
    groupName: string;
    completed: number;
    total: number;
    percent: number;
  };
  index: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  // Determine color based on progress
  const getProgressColor = () => {
    if (progress.percent >= 75) return theme.colors.success;
    if (progress.percent >= 40) return theme.colors.warning;
    return theme.colors.primary;
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index * 80)}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={{
          width: 180,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        {/* Icon and title */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <LinearGradient
            colors={["#6C5DD3", "#8676FF"]}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="rocket" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Typography
              variant="caption"
              weight="semibold"
              color="text"
              numberOfLines={1}
            >
              {progress.title}
            </Typography>
            <Typography
              variant="caption"
              color="textMuted"
              numberOfLines={1}
              style={{ fontSize: 10 }}
            >
              {progress.groupName}
            </Typography>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 6,
            backgroundColor: theme.colors.border,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#6C5DD3", "#8676FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: "100%",
              width: `${progress.percent}%`,
              borderRadius: 3,
            }}
          />
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Typography variant="caption" color="textMuted" style={{ fontSize: 11 }}>
            {progress.completed}/{progress.total} steps
          </Typography>
          <View
            style={{
              backgroundColor:
                progress.percent >= 75
                  ? `${theme.colors.success}20`
                  : progress.percent >= 40
                    ? `${theme.colors.warning}20`
                    : `${theme.colors.primary}20`,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
            }}
          >
            <Typography
              variant="caption"
              weight="bold"
              style={{
                fontSize: 11,
                color: getProgressColor(),
              }}
            >
              {progress.percent}%
            </Typography>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function NoPostsFound() {
  const { theme } = useTheme();

  return (
    <View
      style={{
        height: 200,
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
      }}
    >
      <Ionicons
        name="images-outline"
        size={48}
        color={theme.colors.primary}
      />
      <Typography
        variant="h4"
        color="text"
        style={{ marginTop: 12 }}
      >
        No posts yet
      </Typography>
    </View>
  );
}
