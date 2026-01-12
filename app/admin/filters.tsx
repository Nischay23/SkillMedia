import AddChildModal from "@/components/admin/AddChildModal";
import FilterEditor from "@/components/admin/FilterEditor";
import FilterTree from "@/components/admin/FilterTree";
import PageHeader from "@/components/admin/desktop/PageHeader";
import { Id } from "@/convex/_generated/dataModel";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FilterNode {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  parentId?: Id<"FilterOption">;
  description?: string;
  requirements?: string;
  avgSalary?: string;
  relevantExams?: string;
  image?: string;
  isActive: boolean;
  children?: FilterNode[];
}

export default function FiltersManager() {
  const [selectedNode, setSelectedNode] =
    useState<FilterNode | null>(null);
  const [parentForNewChild, setParentForNewChild] =
    useState<FilterNode | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNodeSelect = (node: FilterNode) => {
    setSelectedNode(node);
  };

  const handleAddChild = (node: FilterNode) => {
    setParentForNewChild(node);
  };

  const handleCloseEditor = () => {
    setSelectedNode(null);
  };

  const handleCloseAddChild = () => {
    setParentForNewChild(null);
  };

  const handleSaveSuccess = () => {
    // Trigger tree refresh by updating key
    setRefreshKey((prev) => prev + 1);
    setSelectedNode(null);
    setParentForNewChild(null);
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Filters Management"
        description="Hierarchical content filtering system"
      />

      <View style={styles.content}>
        {/* Tree Explorer */}
        <View style={styles.treePanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>
              Filter Hierarchy
            </Text>
          </View>
          <ScrollView style={styles.treeScroll}>
            <FilterTree
              key={refreshKey}
              onNodeSelect={handleNodeSelect}
              onAddChild={handleAddChild}
            />
          </ScrollView>
        </View>

        {/* Inspector Panel */}
        <View style={styles.inspectorPanel}>
          {selectedNode ? (
            <>
              <View style={styles.inspectorHeader}>
                <View style={styles.inspectorTitleRow}>
                  <MaterialIcons
                    name="filter-list"
                    size={24}
                    color="#3B82F6"
                  />
                  <Text style={styles.inspectorTitle}>
                    {selectedNode.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedNode(null)}
                >
                  <MaterialIcons
                    name="close"
                    size={20}
                    color="#A0A0A0"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.inspectorContent}>
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Type</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {selectedNode.type}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>
                    Status
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      selectedNode.isActive
                        ? styles.statusActive
                        : styles.statusInactive,
                    ]}
                  >
                    <MaterialIcons
                      name={
                        selectedNode.isActive
                          ? "check-circle"
                          : "cancel"
                      }
                      size={16}
                      color={
                        selectedNode.isActive
                          ? "#10B981"
                          : "#EF4444"
                      }
                    />
                    <Text
                      style={[
                        styles.statusText,
                        selectedNode.isActive
                          ? styles.statusTextActive
                          : styles.statusTextInactive,
                      ]}
                    >
                      {selectedNode.isActive
                        ? "Active"
                        : "Inactive"}
                    </Text>
                  </View>
                </View>

                {selectedNode.description && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>
                      Description
                    </Text>
                    <Text style={styles.infoValue}>
                      {selectedNode.description}
                    </Text>
                  </View>
                )}

                {selectedNode.requirements && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>
                      Requirements
                    </Text>
                    <Text style={styles.infoValue}>
                      {selectedNode.requirements}
                    </Text>
                  </View>
                )}

                {selectedNode.avgSalary && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>
                      Average Salary
                    </Text>
                    <Text style={styles.infoValue}>
                      {selectedNode.avgSalary}
                    </Text>
                  </View>
                )}

                {selectedNode.relevantExams && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>
                      Relevant Exams
                    </Text>
                    <Text style={styles.infoValue}>
                      {selectedNode.relevantExams}
                    </Text>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleCloseEditor}
                  >
                    <MaterialIcons
                      name="edit"
                      size={18}
                      color="white"
                    />
                    <Text style={styles.editButtonText}>
                      Edit Filter
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addChildButton}
                    onPress={() =>
                      handleAddChild(selectedNode)
                    }
                  >
                    <MaterialIcons
                      name="add"
                      size={18}
                      color="white"
                    />
                    <Text style={styles.addChildButtonText}>
                      Add Child
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="filter-list"
                size={64}
                color="#2A2A2A"
              />
              <Text style={styles.emptyText}>
                Select a filter to view details
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Editor Modal */}
      <Modal
        visible={
          selectedNode !== null &&
          parentForNewChild === null
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseEditor}
      >
        {selectedNode && (
          <FilterEditor
            node={selectedNode}
            onClose={handleCloseEditor}
            onSaveSuccess={handleSaveSuccess}
          />
        )}
      </Modal>

      {/* Add Child Modal */}
      <Modal
        visible={parentForNewChild !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseAddChild}
      >
        {parentForNewChild && (
          <AddChildModal
            parentNode={parentForNewChild}
            onClose={handleCloseAddChild}
            onSuccess={handleSaveSuccess}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    padding: 24,
    gap: 24,
  },
  treePanel: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
    overflow: "hidden",
  },
  panelHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2d3748",
    backgroundColor: "#1f2937",
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  treeScroll: {
    flex: 1,
  },
  inspectorPanel: {
    width: 380, // Fixed width inspector
    backgroundColor: "#1f2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d3748",
    overflow: "hidden",
  },
  inspectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2d3748",
    backgroundColor: "#1f2937",
  },
  inspectorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  inspectorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#2d3748",
  },
  inspectorContent: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9ca3af",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: "#e5e7eb",
    lineHeight: 22,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#2d3748",
    borderWidth: 1,
    borderColor: "#374151",
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#e5e7eb",
    textTransform: "capitalize",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  statusActive: {
    borderColor: "rgba(16, 185, 129, 0.3)",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  statusInactive: {
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#10B981",
  },
  statusTextInactive: {
    color: "#EF4444",
  },
  actionButtons: {
    marginTop: 32,
    gap: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addChildButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#2d3748",
    borderWidth: 1,
    borderColor: "#374151",
  },
  addChildButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
