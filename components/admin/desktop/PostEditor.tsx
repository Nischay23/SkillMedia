import { api } from "@/convex/_generated/api";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FilterPicker from "../FilterPicker";

interface PostEditorProps {
  mode: "create" | "edit";
  initialData?: {
    title: string;
    content: string;
    imageUrl?: string;
    linkedFilterIds?: string[];
    status: "draft" | "published";
  };
  onSave: (data: {
    title: string;
    content: string;
    image?: string;
    linkedFilterIds: string[];
    status: "draft" | "published";
  }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export default function PostEditor({
  mode,
  initialData,
  onSave,
  onCancel,
  saving,
}: PostEditorProps) {
  const [title, setTitle] = useState(
    initialData?.title || ""
  );
  const [content, setContent] = useState(
    initialData?.content || ""
  );
  const [selectedImage, setSelectedImage] = useState<
    string | undefined
  >(initialData?.imageUrl);
  const [linkedFilterIds, setLinkedFilterIds] = useState<
    string[]
  >(initialData?.linkedFilterIds || []);
  const [status, setStatus] = useState<
    "draft" | "published"
  >(initialData?.status || "draft");

  const allFilters = useQuery(
    api.adminFilters.getAllFilters
  );

  const handlePickImage = async () => {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Title is required");
      return;
    }

    if (!content.trim()) {
      Alert.alert(
        "Validation Error",
        "Content is required"
      );
      return;
    }

    if (linkedFilterIds.length === 0) {
      Alert.alert(
        "Warning",
        "No filters linked. This post will not appear in any filter. Continue anyway?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: async () => {
              await onSave({
                title: title.trim(),
                content: content.trim(),
                image: selectedImage,
                linkedFilterIds,
                status,
              });
            },
          },
        ]
      );
      return;
    }

    await onSave({
      title: title.trim(),
      content: content.trim(),
      image: selectedImage,
      linkedFilterIds,
      status,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.editor}
        contentContainerStyle={styles.editorContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter post title..."
            placeholderTextColor="#6b7280"
            maxLength={200}
            multiline
          />
          <Text style={styles.charCount}>
            {title.length}/200
          </Text>
        </View>

        {/* Content Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write your post content..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View>

        {/* Image */}
        <View style={styles.section}>
          <Text style={styles.label}>Image</Text>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.image}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(undefined)}
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={handlePickImage}
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={40}
                color="#6b7280"
              />
              <Text style={styles.imagePlaceholderText}>
                Add Image
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Sidebar */}
      <View style={styles.sidebar}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Status */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarLabel}>Status</Text>
            <View style={styles.statusToggle}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "draft" &&
                    styles.statusButtonDraftActive,
                ]}
                onPress={() => setStatus("draft")}
              >
                <MaterialIcons
                  name="drafts"
                  size={18}
                  color={
                    status === "draft"
                      ? "#e5e7eb"
                      : "#9ca3af"
                  }
                />
                <Text
                  style={[
                    styles.statusText,
                    status === "draft" &&
                      styles.statusTextActive,
                  ]}
                >
                  Draft
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "published" &&
                    styles.statusButtonPublishedActive,
                ]}
                onPress={() => setStatus("published")}
              >
                <MaterialIcons
                  name="publish"
                  size={18}
                  color={
                    status === "published"
                      ? "#e5e7eb"
                      : "#10b981"
                  }
                />
                <Text
                  style={[
                    styles.statusText,
                    status === "published" &&
                      styles.statusTextActive,
                  ]}
                >
                  Published
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Linked Filters */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarLabel}>
              Linked Filters
            </Text>
            {allFilters ? (
              <FilterPicker
                filters={allFilters}
                selectedIds={linkedFilterIds}
                onSelectionChange={setLinkedFilterIds}
              />
            ) : (
              <Text style={styles.loadingText}>
                Loading filters...
              </Text>
            )}
            {linkedFilterIds.length === 0 && (
              <Text style={styles.warningText}>
                <MaterialIcons
                  name="warning"
                  size={14}
                  color="#9ca3af"
                />{" "}
                No filters selected
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.sidebarActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color="#0b0f19"
                  size="small"
                />
              ) : (
                <>
                  <MaterialIcons
                    name="save"
                    size={18}
                    color="#0b0f19"
                  />
                  <Text style={styles.saveButtonText}>
                    {mode === "create"
                      ? "Create Post"
                      : "Save Changes"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0b0f19",
  },
  editor: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#1f2937",
  },
  editorContent: {
    padding: 32,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "700",
    color: "#e5e7eb",
    backgroundColor: "#111827",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
    padding: 16,
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 8,
  },
  contentInput: {
    fontSize: 16,
    color: "#e5e7eb",
    backgroundColor: "#111827",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
    padding: 16,
    minHeight: 300,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2d3748",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9ca3af",
  },
  sidebar: {
    width: 360,
    backgroundColor: "#111827",
    padding: 24,
  },
  sidebarSection: {
    marginBottom: 32,
  },
  sidebarLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 12,
  },
  statusToggle: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2d3748",
    backgroundColor: "#0b0f19",
  },
  statusButtonDraftActive: {
    borderColor: "#374151",
    backgroundColor: "#1f2937",
  },
  statusButtonPublishedActive: {
    borderColor: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.18)",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  statusTextActive: {
    color: "#e5e7eb",
  },
  loadingText: {
    fontSize: 13,
    color: "#9ca3af",
  },
  warningText: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  sidebarActions: {
    gap: 12,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
    alignItems: "center",
    backgroundColor: "#0b0f19",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#10b981",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0b0f19",
  },
});
