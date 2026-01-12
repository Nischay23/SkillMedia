import { useToast } from "@/components/ui/Toast";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
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
  const { toast } = useToast();
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
      toast({
        title: "Saved",
        description: "Filter updated successfully",
        variant: "success",
      });
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
              toast({
                title: "Updated",
                description: `Filter ${action === "hide" ? "hidden" : "activated"} successfully`,
                variant: "success",
              });
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
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView
        style={styles.form}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.card}>
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
              placeholderTextColor="#4B5563"
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
                placeholderTextColor="#4B5563"
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          {/* Requirements */}
          {editableFields.requirements && (
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
                placeholder="List requirements"
                placeholderTextColor="#4B5563"
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          {/* Average Salary */}
          {editableFields.avgSalary && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Avg Salary</Text>
              <TextInput
                style={styles.input}
                value={formData.avgSalary}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    avgSalary: text,
                  })
                }
                placeholder="e.g. $80,000 - $120,000"
                placeholderTextColor="#4B5563"
              />
            </View>
          )}

          {/* Relevant Exams */}
          {editableFields.relevantExams && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Relevant Exams
              </Text>
              <TextInput
                style={styles.input}
                value={formData.relevantExams}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    relevantExams: text,
                  })
                }
                placeholder="e.g. AWS Certified Solutions Architect"
                placeholderTextColor="#4B5563"
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
                placeholderTextColor="#4B5563"
                autoCapitalize="none"
              />
            </View>
          )}
        </View>

        {/* Actions Card */}
        <View style={[styles.card, styles.actionCard]}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={handleToggleActive}
          >
            <MaterialIcons
              name={
                node.isActive
                  ? "visibility-off"
                  : "visibility"
              }
              size={20}
              color={node.isActive ? "#EF4444" : "#10B981"}
            />
            <Text
              style={[
                styles.toggleButtonText,
                {
                  color: node.isActive
                    ? "#EF4444"
                    : "#10B981",
                },
              ]}
            >
              {node.isActive
                ? "Deactivate Filter"
                : "Activate Filter"}
            </Text>
            <Text style={styles.toggleHelperText}>
              {node.isActive
                ? "Hide this filter from the app"
                : "Make this filter visible in the app"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !hasChanges && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Changes
            </Text>
          )}
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
    backgroundColor: "#0b0f19",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    backgroundColor: "#111827",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E5E7EB",
    textTransform: "capitalize",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#1F2937",
  },
  form: {
    flex: 1,
    padding: 24,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
    padding: 20,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#E5E7EB",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  actionCard: {
    padding: 0,
    overflow: "hidden",
  },
  toggleButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
    backgroundColor: "#111827",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  toggleHelperText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    backgroundColor: "#111827",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#374151",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
    minWidth: 100,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#1F2937",
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
