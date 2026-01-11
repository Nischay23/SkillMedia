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

interface Props {
  parentNode: {
    _id: Id<"FilterOption">;
    name: string;
    type: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

// Hierarchy rules
const CHILD_TYPE_MAP: Record<string, string> = {
  qualification: "category",
  category: "sector",
  sector: "subSector",
  subSector: "branch",
  branch: "role",
  role: "", // No children allowed
};

const TYPE_LABELS: Record<string, string> = {
  category: "Category",
  sector: "Sector",
  subSector: "Sub-Sector",
  branch: "Branch",
  role: "Role",
};

export default function AddChildModal({
  parentNode,
  onClose,
  onSuccess,
}: Props) {
  const createNode = useMutation(
    api.adminFilters.createFilterNode
  );

  const childType = CHILD_TYPE_MAP[parentNode.type];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }

    if (!childType) {
      Alert.alert(
        "Error",
        "This node type cannot have children"
      );
      return;
    }

    setIsCreating(true);
    try {
      await createNode({
        name: formData.name.trim(),
        type: childType as any,
        parentId: parentNode._id,
        description:
          formData.description.trim() || undefined,
      });

      Alert.alert(
        "Success",
        `${TYPE_LABELS[childType]} created successfully`
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to create filter"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (!childType) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cannot Add Child</Text>
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
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color="#ff9800"
          />
          <Text style={styles.errorText}>
            &apos;{parentNode.type}&apos; nodes cannot have
            children
          </Text>
          <Text style={styles.errorSubtext}>
            This is a leaf node type
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Add {TYPE_LABELS[childType]}
          </Text>
          <Text style={styles.subtitle}>
            Parent: {parentNode.name}
          </Text>
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
        <View style={styles.infoBox}>
          <MaterialIcons
            name="info-outline"
            size={20}
            color="#2196F3"
          />
          <Text style={styles.infoText}>
            Creating a new{" "}
            <Text style={styles.infoBold}>
              {TYPE_LABELS[childType]}
            </Text>{" "}
            under{" "}
            <Text style={styles.infoBold}>
              {parentNode.name}
            </Text>
          </Text>
        </View>

        {/* Name Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) =>
              setFormData({ ...formData, name: text })
            }
            placeholder={`Enter ${TYPE_LABELS[childType].toLowerCase()} name`}
            placeholderTextColor="#999"
            autoFocus
          />
        </View>

        {/* Description Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Description (Optional)
          </Text>
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
          <Text style={styles.hint}>
            You can add more details later by editing the
            node
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.createButton,
            isCreating && styles.buttonDisabled,
          ]}
          onPress={handleCreate}
          disabled={isCreating}
        >
          <MaterialIcons
            name="add"
            size={20}
            color="white"
          />
          <Text style={styles.buttonText}>
            {isCreating ? "Creating..." : "Create"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1976D2",
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: "600",
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
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
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
  cancelButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
});
