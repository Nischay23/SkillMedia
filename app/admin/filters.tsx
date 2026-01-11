import AddChildModal from "@/components/admin/AddChildModal";
import FilterEditor from "@/components/admin/FilterEditor";
import FilterTree from "@/components/admin/FilterTree";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";

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
  };

  return (
    <View style={styles.container}>
      <FilterTree
        key={refreshKey}
        onNodeSelect={handleNodeSelect}
        onAddChild={handleAddChild}
      />

      {/* Editor Modal */}
      <Modal
        visible={selectedNode !== null}
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
    backgroundColor: "#f5f5f5",
  },
});
