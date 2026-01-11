import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Typography } from "@/components/ui/Typography";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTheme, useThemedStyles } from "@/providers/ThemeProvider";

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { theme, isDark } = useTheme();

  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

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
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
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
      alignItems: 'center' as const,
    },
    shareButtonDisabled: {
      backgroundColor: theme.colors.textMuted,
    },
    emptyImageContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      margin: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed' as const,
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
      width: '100%' as const,
      aspectRatio: 1,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
    },
    changeImageButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
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
    },
    captionContainer: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
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
      textAlignVertical: 'top' as const,
    },
  }));

  const pickImage = async () => {
    buttonScale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 10, stiffness: 400 });
    }, 100);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const createPost = useMutation(api.posts.createPost);

  const handleShare = async () => {
    if (!selectedImage || !caption.trim()) return;

    try {
      setIsSharing(true);
      headerOpacity.value = withTiming(0.8, { duration: 200 });
      
      // For now, we'll just create a post with the caption
      // The image upload functionality can be added later when the backend supports it
      await createPost({
        content: caption,
        imageUrl: selectedImage, // This will be updated when upload is implemented
      });

      setSelectedImage(null);
      setCaption("");
      router.push("/(tabs)");
    } catch (error) {
      console.log("Error sharing post:", error);
    } finally {
      setIsSharing(false);
      headerOpacity.value = withTiming(1, { duration: 200 });
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
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? "light-content" : "dark-content"} />
        
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
          <Typography variant="h3" color="text" weight="bold">
            New Post
          </Typography>
          <View style={{ width: 28 }} />
        </Animated.View>

        <Animated.View style={[styles.emptyImageContainer, buttonAnimatedStyle]}>
          <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center', padding: theme.spacing.xl }}>
            <Ionicons name="image-outline" size={48} color={theme.colors.textMuted} />
            <Typography variant="body" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
              Tap to select an image
            </Typography>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? "light-content" : "dark-content"} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        {/* HEADER */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
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
              color={isSharing ? theme.colors.textMuted : theme.colors.text}
            />
          </TouchableOpacity>
          <Typography variant="h3" color="text" weight="bold">
            New Post
          </Typography>
          <TouchableOpacity
            style={[styles.shareButton, (isSharing || !selectedImage || !caption.trim()) && styles.shareButtonDisabled]}
            disabled={isSharing || !selectedImage || !caption.trim()}
            onPress={handleShare}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={theme.colors.background} />
            ) : (
              <Typography variant="body" style={{ color: theme.colors.background }} weight="medium">
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
          <View style={[styles.content, isSharing && styles.contentDisabled]}>
            {/* IMAGE SECTION */}
            <AnimatedCard delay={0} style={styles.imageSection}>
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
                <Ionicons name="image-outline" size={20} color={theme.colors.text} />
                <Typography variant="body" color="text" weight="medium">
                  Change
                </Typography>
              </TouchableOpacity>
            </AnimatedCard>

            {/* INPUT SECTION */}
            <AnimatedCard delay={100} style={styles.inputSection}>
              <View style={styles.captionContainer}>
                <Image
                  source={user?.imageUrl}
                  style={styles.userAvatar}
                  contentFit="cover"
                  transition={200}
                />
                <TextInput
                  style={styles.captionInput}
                  placeholder="Write a caption..."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  value={caption}
                  onChangeText={setCaption}
                  editable={!isSharing}
                />
              </View>
            </AnimatedCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
