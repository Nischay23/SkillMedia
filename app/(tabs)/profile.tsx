import { Loader } from "@/components/Loader";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
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
} from "react-native";
import { useTheme, useThemedStyles } from "@/providers/ThemeProvider";

export default function Profile() {
  const { signOut, userId } = useAuth();
  const { theme, isDark } = useTheme();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  // Animation values
  const headerOpacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkId: userId } : "skip"
  );

  const [editedProfile, setEditedProfile] = useState({
    fullname: currentUser?.fullname || "",
    bio: currentUser?.bio || "",
  });

  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  const posts = useQuery(
    api.posts.getPostsByUser,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);

  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    headerRight: {
      flexDirection: 'row' as const,
      gap: theme.spacing.lg,
    },
    headerIcon: {
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    profileInfo: {
      padding: theme.spacing.lg,
    },
    avatarAndStats: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: theme.spacing.lg,
    },
    avatarContainer: {
      marginRight: theme.spacing['2xl'],
    },
    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    statsContainer: {
      flexDirection: 'row' as const,
      flex: 1,
      justifyContent: 'space-around' as const,
    },
    statItem: {
      alignItems: 'center' as const,
    },
    actionButtons: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    editButton: {
      flex: 1,
    },
    shareButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    gridContainer: {
      paddingHorizontal: theme.spacing.xs,
    },
    gridItem: {
      flex: 1 / 3,
      aspectRatio: 1,
      margin: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden' as const,
    },
    gridImage: {
      width: '100%' as const,
      height: '100%' as const,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      margin: theme.spacing.lg,
      width: '90%' as const,
      maxHeight: '80%' as const,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
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
      fontSize: 16,
    },
    bioInput: {
      height: 100,
      textAlignVertical: 'top' as const,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    postDetailContainer: {
      width: '90%' as const,
      maxHeight: '80%' as const,
    },
    postDetailHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
      padding: theme.spacing.md,
    },
    postDetailImage: {
      width: '100%' as const,
      aspectRatio: 1,
      borderRadius: theme.borderRadius.lg,
    },
    emptyStateContainer: {
      height: 200,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
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
    buttonScale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 10, stiffness: 400 });
      setIsEditModalVisible(true);
    }, 100);
  };

  if (!currentUser || posts === undefined) return <Loader />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* HEADER */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerLeft}>
          <Typography variant="h2" color="text" weight="bold">
            {currentUser.username}
          </Typography>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => signOut()}>
            <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <AnimatedCard delay={0} style={styles.profileInfo}>
          {/* AVATAR & STATS */}
          <View style={styles.avatarAndStats}>
            <View style={styles.avatarContainer}>
              <Image
                source={currentUser.image}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Typography variant="h3" color="text" weight="bold">
                  {currentUser.posts}
                </Typography>
                <Typography variant="caption" color="textSecondary">Posts</Typography>
              </View>
              <View style={styles.statItem}>
                <Typography variant="h3" color="text" weight="bold">
                  {currentUser.followers}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Followers
                </Typography>
              </View>
              <View style={styles.statItem}>
                <Typography variant="h3" color="text" weight="bold">
                  {currentUser.following}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Following
                </Typography>
              </View>
            </View>
          </View>

          <Typography variant="h3" color="text" weight="semibold" style={{ marginTop: theme.spacing.md }}>
            {currentUser.fullname}
          </Typography>
          {currentUser.bio && (
            <Typography variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
              {currentUser.bio}
            </Typography>
          )}

          <View style={styles.actionButtons}>
            <Animated.View style={[styles.editButton, buttonAnimatedStyle]}>
              <AnimatedButton
                title="Edit Profile"
                onPress={handleEditPress}
                variant="outline"
              />
            </Animated.View>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {posts.length === 0 && <NoPostsFound />}

        <FlatList
          data={posts}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.gridContainer}
          renderItem={({ item, index }) => (
            <AnimatedCard delay={(index + 1) * 50} style={styles.gridItem}>
              <TouchableOpacity onPress={() => setSelectedPost(item)}>
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="h3" color="text" weight="bold">
                  Edit Profile
                </Typography>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Typography variant="body" color="text" weight="medium" style={{ marginBottom: theme.spacing.sm }}>
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
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Typography variant="body" color="text" weight="medium" style={{ marginBottom: theme.spacing.sm }}>
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
                  placeholderTextColor={theme.colors.textMuted}
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
                <TouchableOpacity onPress={() => setSelectedPost(null)}>
                  <Ionicons name="close" size={24} color={theme.colors.background} />
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

function NoPostsFound() {
  const { theme } = useTheme();
  
  return (
    <View style={{
      height: 200,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    }}>
      <Ionicons name="images-outline" size={48} color={theme.colors.primary} />
      <Typography variant="h4" color="text" style={{ marginTop: 12 }}>
        No posts yet
      </Typography>
    </View>
  );
}
