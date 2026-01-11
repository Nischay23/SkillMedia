import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface FilterNode {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  description?: string;
  requirements?: string;
  avgSalary?: string;
  relevantExams?: string;
  image?: string;
  isActive: boolean;
}

interface Props {
  node: FilterNode;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function FilterEditor({
  node,
  onClose,
  onSaveSuccess,
}: Props) {
  const updateNode = useMutation(
    api.adminFilters.updateFilterNode
  );
  const toggleActive = useMutation(
    api.adminFilters.toggleFilterActive
  );

  const [formData, setFormData] = useState({
    name: node.name,
    description: node.description || "",
    requirements: node.requirements || "",
    avgSalary: node.avgSalary || "",
    relevantExams: node.relevantExams || "",
    image: node.image || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  // Check if form has changes
  const hasChanges =
    JSON.stringify(formData) !==
    JSON.stringify({
      name: node.name,
      description: node.description || "",
      requirements: node.requirements || "",
      avgSalary: node.avgSalary || "",
      relevantExams: node.relevantExams || "",
      image: node.image || "",
    });

  // Field configuration based on node type
  const editableFields = getEditableFields(node.type);

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert(
        "Validation Error",
        "Name cannot be empty"
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateNode({
        filterId: node._id,
        name: formData.name,
        description: formData.description || undefined,
        requirements: formData.requirements || undefined,
        avgSalary: formData.avgSalary || undefined,
        relevantExams: formData.relevantExams || undefined,
        image: formData.image || undefined,
      });
      Alert.alert("Success", "Filter updated successfully");
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to update filter"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    const action = node.isActive ? "hide" : "show";
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Filter`,
      `Are you sure you want to ${action} this filter?${
        !node.isActive
          ? ""
          : "\n\nThis will also hide all child filters."
      }`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: node.isActive ? "destructive" : "default",
          onPress: async () => {
            try {
              await toggleActive({
                filterId: node._id,
                isActive: !node.isActive,
              });
              Alert.alert(
                "Success",
                `Filter ${action === "hide" ? "hidden" : "activated"} successfully`
              );
              onSaveSuccess();
              onClose();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to toggle filter"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Edit {node.type}</Text>
          <Text style={styles.subtitle}>{node.name}</Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
        >
          <MaterialIcons
            name="close"
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView style={styles.form}>
        {/* Name Field (always editable) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) =>
              setFormData({ ...formData, name: text })
            }
            placeholder="Enter name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        {editableFields.description && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  description: text,
                })
              }
              placeholder="Enter description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Requirements */}
        {editableFields.requirements === true && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.requirements}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  requirements: text,
                })
              }
              placeholder="Enter requirements"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Average Salary */}
        {editableFields.avgSalary === true && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Average Salary</Text>
            <TextInput
              style={styles.input}
              value={formData.avgSalary}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  avgSalary: text,
                })
              }
              placeholder="e.g., ₹3-6 LPA"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Relevant Exams */}
        {editableFields.relevantExams === true && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Relevant Exams</Text>
            <TextInput
              style={styles.input}
              value={formData.relevantExams}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  relevantExams: text,
                })
              }
              placeholder="e.g., UPSC, SSC CGL"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Image URL */}
        {editableFields.image && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={formData.image}
              onChangeText={(text) =>
                setFormData({ ...formData, image: text })
              }
              placeholder="https://..."
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.toggleButton]}
          onPress={handleToggleActive}
        >
          <MaterialIcons
            name={
              node.isActive
                ? "visibility-off"
                : "visibility"
            }
            size={20}
            color="white"
          />
          <Text style={styles.buttonText}>
            {node.isActive ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            (!hasChanges || isSaving) &&
              styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          <MaterialIcons
            name="save"
            size={20}
            color="white"
          />
          <Text style={styles.buttonText}>
            {isSaving
              ? "Saving..."
              : hasChanges
                ? "Save"
                : "No Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Determine which fields should be editable based on node type
 */
function getEditableFields(type: string): {
  description: boolean;
  image: boolean;
  requirements?: boolean;
  avgSalary?: boolean;
  relevantExams?: boolean;
} {
  // All types can have description and image
  const base = {
    description: true,
    image: true,
  };

  // More detailed fields for deeper levels
  if (type === "role" || type === "branch") {
    return {
      ...base,
      requirements: true,
      avgSalary: true,
      relevantExams: true,
    };
  }

  if (type === "subSector" || type === "sector") {
    return {
      ...base,
      requirements: true,
      relevantExams: true,
    };
  }

  // Top levels (qualification, category) - basic fields only
  return base;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textTransform: "capitalize",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    color: "#333",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
    backgroundColor: "#f9f9f9",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  toggleButton: {
    backgroundColor: "#ff9800",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
