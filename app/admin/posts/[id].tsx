import PageHeader from "@/components/admin/desktop/PageHeader";
import PostEditor from "@/components/admin/desktop/PostEditor";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const post = useQuery(
    api.communityPosts.getCommunityPostById,
    {
      postId: id as Id<"communityPosts">,
    }
  );

  const updatePost = useMutation(
    api.communityPosts.updateCommunityPost
  );
  const deletePost = useMutation(
    api.communityPosts.deleteCommunityPost
  );

  const handleSave = async (data: {
    title: string;
    content: string;
    image?: string;
    linkedFilterIds: string[];
    status: "draft" | "published";
  }) => {
    try {
      setSaving(true);

      await updatePost({
        postId: id as Id<"communityPosts">,
        title: data.title,
        content: data.content,
        imageUrl: data.image,
        linkedFilterOptionIds: data.linkedFilterIds as any,
        status: data.status,
      });

      setSaving(false);
      toast({
        title: "Saved",
        description: "Post updated successfully",
        variant: "success",
      });
      router.replace("/admin/posts" as any);
    } catch (error) {
      console.error("Failed to update post:", error);
      setSaving(false);
      Alert.alert(
        "Error",
        "Failed to update post. Please try again."
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost({
                postId: id as Id<"communityPosts">,
              });
              toast({
                title: "Deleted",
                description: "Post deleted successfully",
                variant: "success",
              });
              router.replace("/admin/posts" as any);
            } catch (error) {
              console.error(
                "Failed to delete post:",
                error
              );
              Alert.alert(
                "Error",
                "Failed to delete post. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (post === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          Loading post...
        </Text>
      </View>
    );
  }

  if (post === null) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons
          name="error-outline"
          size={64}
          color="#EF4444"
        />
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Edit Post"
        description={`Last updated: ${new Date(post._creationTime).toLocaleDateString()}`}
        action={
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <MaterialIcons
              name="delete"
              size={18}
              color="#EF4444"
            />
            <Text style={styles.deleteButtonText}>
              Delete
            </Text>
          </TouchableOpacity>
        }
      />
      <PostEditor
        mode="edit"
        initialData={{
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl,
          linkedFilterIds: post.linkedFilterOptionIds,
          status: post.status,
        }}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A0A0A",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#A0A0A0",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A0A0A",
    gap: 16,
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#EF4444",
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
});
