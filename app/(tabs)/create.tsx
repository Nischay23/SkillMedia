import { Loader } from "@/components/Loader";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";

export default function CreatePost() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateUploadUrl = useMutation(
    api.posts.generateUploadUrl,
  );
  const createPost = useMutation(api.posts.createPost);

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
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    imagePickerContainer: {
      width: "100%" as const,
      aspectRatio: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginBottom: theme.spacing.xl,
      overflow: "hidden" as const,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: "dashed" as const,
    },
    selectedImage: {
      width: "100%" as const,
      height: "100%" as const,
    },
    captionInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      color: theme.colors.text,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: "top" as const,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonContainer: {
      marginTop: theme.spacing.xl,
    },
  }));

  const pickImage = async () => {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    setIsLoading(true);
    try {
      let storageId;

      // Upload image if selected
      if (selectedImage) {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload image
        const response = await fetch(selectedImage);
        const blob = await response.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type },
          body: blob,
        });

        const uploadResult = await uploadResponse.json();
        storageId = uploadResult.storageId;
      }

      // Create post
      await createPost({
        title: title.trim(),
        content: content.trim() || title.trim(),
        storageId,
        status: "published",
      });

      setTitle("");
      setContent("");
      setSelectedImage(null);
      router.push("/(tabs)");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert(
        "Error",
        "Failed to create post. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="close"
            size={28}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Typography variant="h3" color="text" weight="bold">
          New Post
        </Typography>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios" ? "padding" : "height"
        }
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.imagePickerContainer}
            onPress={pickImage}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Ionicons
                  name="image-outline"
                  size={48}
                  color={theme.colors.textMuted}
                />
                <Typography
                  variant="body"
                  color="textMuted"
                  style={{ marginTop: theme.spacing.md }}
                >
                  Tap to select an image
                </Typography>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={[
              styles.captionInput,
              {
                minHeight: 50,
                marginBottom: theme.spacing.md,
              },
            ]}
            placeholder="Title"
            placeholderTextColor={theme.colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.captionInput}
            placeholder="Write something..."
            placeholderTextColor={theme.colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
          />

          <View style={styles.buttonContainer}>
            <AnimatedButton
              title="Share Post"
              onPress={handlePost}
              variant="primary"
              disabled={!title.trim()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
