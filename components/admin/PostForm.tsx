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
import { api } from "../../convex/_generated/api";
import FilterPicker from "./FilterPicker";

interface Props {
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
}

export default function PostForm({
  mode,
  initialData,
  onSave,
  onCancel,
}: Props) {
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
  const [saving, setSaving] = useState(false);

  // Query all filters for FilterPicker
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

  const handleRemoveImage = () => {
    setSelectedImage(undefined);
  };

  const handleSave = async () => {
    // Validation
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
        "No filters linked. Continue anyway?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: async () => {
              await savePost();
            },
          },
        ]
      );
      return;
    }

    await savePost();
  };

  const savePost = async () => {
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        image: selectedImage,
        linkedFilterIds,
        status,
      });
    } catch {
      Alert.alert("Error", "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Title Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter post title..."
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
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Image Picker */}
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
              onPress={handleRemoveImage}
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
              color="#999"
            />
            <Text style={styles.imagePlaceholderText}>
              Add Image
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Linked Filters</Text>
        {allFilters ? (
          <FilterPicker
            filters={allFilters}
            selectedIds={linkedFilterIds}
            onSelectionChange={setLinkedFilterIds}
          />
        ) : (
          <Text style={styles.warningText}>
            Loading filters...
          </Text>
        )}
        {linkedFilterIds.length === 0 && (
          <Text style={styles.warningText}>
            <MaterialIcons
              name="warning"
              size={14}
              color="#FF9800"
            />{" "}
            No filters selected. This post will not appear
            in any filter.
          </Text>
        )}
      </View>

      {/* Status Toggle */}
      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusToggle}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === "draft" &&
                styles.statusButtonActive,
            ]}
            onPress={() => setStatus("draft")}
          >
            <MaterialIcons
              name="drafts"
              size={20}
              color={
                status === "draft" ? "white" : "#FF9800"
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
                styles.statusButtonActive,
            ]}
            onPress={() => setStatus("published")}
          >
            <MaterialIcons
              name="publish"
              size={20}
              color={
                status === "published" ? "white" : "#4CAF50"
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

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
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
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons
                name="save"
                size={20}
                color="white"
              />
              <Text style={styles.saveButtonText}>
                {mode === "create" ? "Create" : "Save"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 50,
    maxHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    minHeight: 150,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
  warningText: {
    fontSize: 13,
    color: "#FF9800",
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
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
    borderColor: "#ddd",
    backgroundColor: "white",
  },
  statusButtonActive: {
    borderColor: "#2196F3",
    backgroundColor: "#2196F3",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  statusTextActive: {
    color: "white",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "white",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#2196F3",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
