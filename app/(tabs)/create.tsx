import FilterPicker from "@/components/admin/FilterPicker";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { useUser } from "@clerk/clerk-expo";
import {
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { theme, isDark } = useTheme();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<
    string | null
  >(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedFilterIds, setSelectedFilterIds] =
    useState<string[]>([]);
  const [showFilterPicker, setShowFilterPicker] =
    useState(false);
  const [status, setStatus] = useState<
    "draft" | "published"
  >("draft");

  // Queries
  const currentUser = useQuery(api.users.getCurrentUser);
  const allFilters = useQuery(
    api.adminFilters.getAllFilters
  );
  const isAdmin = currentUser?.isAdmin === true;

  // Animation values
  const headerOpacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      flex: 1,
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
    shareButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      minWidth: 70,
      alignItems: "center" as const,
    },
    shareButtonDisabled: {
      backgroundColor: theme.colors.textMuted,
    },
    emptyImageContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      margin: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: "dashed" as const,
      backgroundColor: theme.colors.surface,
    },
    scrollContent: {
      padding: theme.spacing.lg,
    },
    content: {
      opacity: 1,
    },
    contentDisabled: {
      opacity: 0.6,
    },
    imageSection: {
      marginBottom: theme.spacing.xl,
    },
    previewImage: {
      width: "100%" as const,
      aspectRatio: 1,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
    },
    changeImageButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    inputSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    titleInput: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "600" as const,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    captionContainer: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: theme.spacing.md,
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    captionInput: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 24,
      minHeight: 100,
      textAlignVertical: "top" as const,
    },
    statusToggle: {
      flexDirection: "row" as const,
      gap: theme.spacing.sm,
    },
    statusButton: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    statusButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    filterHeader: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginBottom: theme.spacing.md,
    },
    filterHeaderLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: theme.spacing.sm,
    },
    filterButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    filterButtonContent: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: theme.spacing.sm,
    },
    filterCount: {
      backgroundColor: theme.colors.primary,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    clearFiltersButton: {
      marginTop: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      alignItems: "center" as const,
    },
    modalHeader: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  }));

  const pickImage = async () => {
    buttonScale.value = withSpring(0.95, {
      damping: 10,
      stiffness: 400,
    });
    setTimeout(() => {
      buttonScale.value = withSpring(1, {
        damping: 10,
        stiffness: 400,
      });
    }, 100);

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (!result.canceled)
      setSelectedImage(result.assets[0].uri);
  };

  const createPost = useMutation(api.posts.createPost);

  const handleShare = async () => {
    if (!selectedImage || !caption.trim() || !title.trim())
      return;

    try {
      setIsSharing(true);
      headerOpacity.value = withTiming(0.8, {
        duration: 200,
      });

      // Create post with title, status, and optional filter linking
      await createPost({
        title: title,
        content: caption,
        imageUrl: selectedImage,
        status: status,
        linkedFilterOptionIds:
          isAdmin && selectedFilterIds.length > 0
            ? (selectedFilterIds as Id<"FilterOption">[])
            : undefined,
      });

      setSelectedImage(null);
      setTitle("");
      setCaption("");
      setSelectedFilterIds([]);
      setStatus("draft");
      router.push("/(tabs)");
    } catch (error) {
      console.log("Error sharing post:", error);
    } finally {
      setIsSharing(false);
      headerOpacity.value = withTiming(1, {
        duration: 200,
      });
    }
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  if (!selectedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={
            isDark ? "light-content" : "dark-content"
          }
        />

        <Animated.View
          style={[styles.header, headerAnimatedStyle]}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={28}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <Typography
            variant="h3"
            color="text"
            weight="bold"
          >
            New Post
          </Typography>
          <View style={{ width: 28 }} />
        </Animated.View>

        <Animated.View
          style={[
            styles.emptyImageContainer,
            buttonAnimatedStyle,
          ]}
        >
          <TouchableOpacity
            onPress={pickImage}
            style={{
              alignItems: "center",
              padding: theme.spacing.xl,
            }}
          >
            <Ionicons
              name="image-outline"
              size={48}
              color={theme.colors.textMuted}
            />
            <Typography
              variant="body"
              color="textSecondary"
              style={{ marginTop: theme.spacing.md }}
            >
              Tap to select an image
            </Typography>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios" ? "padding" : "height"
        }
        style={styles.contentContainer}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 100 : 0
        }
      >
        {/* HEADER */}
        <Animated.View
          style={[styles.header, headerAnimatedStyle]}
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedImage(null);
              setCaption("");
            }}
            disabled={isSharing}
          >
            <Ionicons
              name="close-outline"
              size={28}
              color={
                isSharing
                  ? theme.colors.textMuted
                  : theme.colors.text
              }
            />
          </TouchableOpacity>
          <Typography
            variant="h3"
            color="text"
            weight="bold"
          >
            New Post
          </Typography>
          <TouchableOpacity
            style={[
              styles.shareButton,
              (isSharing ||
                !selectedImage ||
                !caption.trim() ||
                !title.trim()) &&
                styles.shareButtonDisabled,
            ]}
            disabled={
              isSharing ||
              !selectedImage ||
              !caption.trim() ||
              !title.trim()
            }
            onPress={handleShare}
          >
            {isSharing ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.background}
              />
            ) : (
              <Typography
                variant="body"
                style={{ color: theme.colors.background }}
                weight="medium"
              >
                Share
              </Typography>
            )}
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentOffset={{ x: 0, y: 100 }}
        >
          <View
            style={[
              styles.content,
              isSharing && styles.contentDisabled,
            ]}
          >
            {/* IMAGE SECTION */}
            <AnimatedCard
              delay={0}
              style={styles.imageSection}
            >
              <Image
                source={selectedImage}
                style={styles.previewImage}
                contentFit="cover"
                transition={200}
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickImage}
                disabled={isSharing}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={theme.colors.text}
                />
                <Typography
                  variant="body"
                  color="text"
                  weight="medium"
                >
                  Change
                </Typography>
              </TouchableOpacity>
            </AnimatedCard>

            {/* TITLE INPUT SECTION */}
            <AnimatedCard
              delay={100}
              style={styles.inputSection}
            >
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name="title"
                  size={20}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  color="text"
                >
                  Post Title
                </Typography>
                <Typography
                  variant="caption"
                  style={{
                    marginLeft: 4,
                    color: "#F44336",
                  }}
                >
                  *
                </Typography>
              </View>
              <TextInput
                style={styles.titleInput}
                placeholder="Enter a catchy title..."
                placeholderTextColor={
                  theme.colors.textMuted
                }
                value={title}
                onChangeText={setTitle}
                editable={!isSharing}
                maxLength={200}
              />
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ marginTop: 4 }}
              >
                {title.length}/200 characters
              </Typography>
            </AnimatedCard>

            {/* CONTENT INPUT SECTION */}
            <AnimatedCard
              delay={150}
              style={styles.inputSection}
            >
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name="description"
                  size={20}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  color="text"
                >
                  Content
                </Typography>
                <Typography
                  variant="caption"
                  style={{
                    marginLeft: 4,
                    color: "#F44336",
                  }}
                >
                  *
                </Typography>
              </View>
              <View style={styles.captionContainer}>
                <Image
                  source={user?.imageUrl}
                  style={styles.userAvatar}
                  contentFit="cover"
                  transition={200}
                />
                <TextInput
                  style={styles.captionInput}
                  placeholder="Write your content here..."
                  placeholderTextColor={
                    theme.colors.textMuted
                  }
                  multiline
                  value={caption}
                  onChangeText={setCaption}
                  editable={!isSharing}
                />
              </View>
            </AnimatedCard>

            {/* FILTER LINKING SECTION (Admin Only) */}
            {isAdmin && (
              <AnimatedCard
                delay={200}
                style={styles.filterSection}
              >
                <View style={styles.filterHeader}>
                  <View style={styles.filterHeaderLeft}>
                    <MaterialIcons
                      name="filter-list"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Typography
                      variant="body"
                      weight="semibold"
                      color="text"
                    >
                      Link to Filters
                    </Typography>
                  </View>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                  >
                    Optional
                  </Typography>
                </View>

                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowFilterPicker(true)}
                  disabled={isSharing}
                >
                  <View style={styles.filterButtonContent}>
                    {selectedFilterIds.length === 0 ? (
                      <>
                        <MaterialIcons
                          name="add-circle-outline"
                          size={20}
                          color={theme.colors.primary}
                        />
                        <Typography
                          variant="body"
                          color="primary"
                        >
                          Select Filters
                        </Typography>
                      </>
                    ) : (
                      <>
                        <View style={styles.filterCount}>
                          <Typography
                            variant="caption"
                            style={{ color: "white" }}
                            weight="bold"
                          >
                            {selectedFilterIds.length}
                          </Typography>
                        </View>
                        <Typography
                          variant="body"
                          color="text"
                        >
                          {selectedFilterIds.length} filter
                          {selectedFilterIds.length > 1
                            ? "s"
                            : ""}{" "}
                          selected
                        </Typography>
                        <MaterialIcons
                          name="edit"
                          size={16}
                          color={theme.colors.textMuted}
                        />
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                {selectedFilterIds.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => setSelectedFilterIds([])}
                  >
                    <Typography
                      variant="caption"
                      style={{ color: "#F44336" }}
                    >
                      Clear Selection
                    </Typography>
                  </TouchableOpacity>
                )}
              </AnimatedCard>
            )}

            {/* STATUS TOGGLE SECTION */}
            <AnimatedCard
              delay={250}
              style={styles.inputSection}
            >
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name="visibility"
                  size={20}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  color="text"
                >
                  Post Status
                </Typography>
              </View>
              <View style={styles.statusToggle}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === "draft" &&
                      styles.statusButtonActive,
                  ]}
                  onPress={() => setStatus("draft")}
                  disabled={isSharing}
                >
                  <MaterialIcons
                    name="drafts"
                    size={20}
                    color={
                      status === "draft"
                        ? "white"
                        : theme.colors.textMuted
                    }
                  />
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={{
                      color:
                        status === "draft"
                          ? "white"
                          : theme.colors.textMuted,
                    }}
                  >
                    Draft
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === "published" &&
                      styles.statusButtonActive,
                  ]}
                  onPress={() => setStatus("published")}
                  disabled={isSharing}
                >
                  <MaterialIcons
                    name="publish"
                    size={20}
                    color={
                      status === "published"
                        ? "white"
                        : theme.colors.textMuted
                    }
                  />
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={{
                      color:
                        status === "published"
                          ? "white"
                          : theme.colors.textMuted,
                    }}
                  >
                    Publish
                  </Typography>
                </TouchableOpacity>
              </View>
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ marginTop: 8 }}
              >
                {status === "draft"
                  ? "Save as draft to publish later"
                  : "Post will be visible to all users immediately"}
              </Typography>
            </AnimatedCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Filter Picker Modal (Admin Only) */}
      {isAdmin && (
        <Modal
          visible={showFilterPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFilterPicker(false)}
        >
          <SafeAreaView
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
            }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowFilterPicker(false)}
              >
                <Ionicons
                  name="close"
                  size={28}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
              <Typography
                variant="h3"
                weight="bold"
                color="text"
              >
                Select Filters
              </Typography>
              <TouchableOpacity
                onPress={() => setShowFilterPicker(false)}
              >
                <Typography
                  variant="body"
                  color="primary"
                  weight="semibold"
                >
                  Done
                </Typography>
              </TouchableOpacity>
            </View>
            {allFilters && (
              <FilterPicker
                filters={allFilters}
                selectedIds={selectedFilterIds}
                onSelectionChange={setSelectedFilterIds}
              />
            )}
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
