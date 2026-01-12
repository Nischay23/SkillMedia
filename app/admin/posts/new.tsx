import PageHeader from "@/components/admin/desktop/PageHeader";
import PostEditor from "@/components/admin/desktop/PostEditor";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function NewPost() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const createPost = useMutation(
    api.communityPosts.createCommunityPost
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

      await createPost({
        title: data.title,
        content: data.content,
        imageUrl: data.image,
        linkedFilterOptionIds: data.linkedFilterIds as any,
        status: data.status,
      });

      setSaving(false);
      toast({
        title: "Saved",
        description: `Post ${data.status === "published" ? "published" : "saved as draft"} successfully`,
        variant: "success",
      });
      router.replace("/admin/posts" as any);
    } catch (error) {
      console.error("Failed to create post:", error);
      setSaving(false);
      Alert.alert(
        "Error",
        "Failed to create post. Please try again."
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to discard this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Create Post"
        description="Create a new community post with filters"
      />
      <PostEditor
        mode="create"
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
});
