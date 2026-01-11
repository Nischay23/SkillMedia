import { Id } from "@/convex/_generated/dataModel";
import { MaterialIcons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FilterNode {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  isActive: boolean;
  children?: FilterNode[];
}

interface Props {
  node: FilterNode;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onAddChild: (node: FilterNode) => void;
  expandedNodes: Set<string>;
  onToggleExpandChild: (nodeId: string) => void;
}

export default function FilterTreeNode({
  node,
  depth,
  isExpanded,
  onToggleExpand,
  onSelect,
  onAddChild,
  expandedNodes,
  onToggleExpandChild,
}: Props) {
  const hasChildren =
    node.children && node.children.length > 0;
  const indentWidth = depth * 24;

  // Check if this node type can have children
  const canHaveChildren = node.type !== "role";

  // Type color mapping
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      qualification: "#FF6B6B",
      category: "#4ECDC4",
      sector: "#45B7D1",
      subSector: "#FFA07A",
      branch: "#98D8C8",
      role: "#6C5CE7",
    };
    return colors[type] || "#999";
  };

  return (
    <View>
      {/* Node Row */}
      <View
        style={[
          styles.nodeRow,
          { paddingLeft: indentWidth + 12 },
          !node.isActive && styles.inactiveNode,
        ]}
      >
        {/* Expand/Collapse Icon */}
        <TouchableOpacity
          onPress={onToggleExpand}
          style={styles.expandButton}
          disabled={!hasChildren}
        >
          <MaterialIcons
            name={
              hasChildren
                ? isExpanded
                  ? "expand-more"
                  : "chevron-right"
                : "fiber-manual-record"
            }
            size={20}
            color={hasChildren ? "#333" : "#ddd"}
          />
        </TouchableOpacity>

        {/* Node Name */}
        <TouchableOpacity
          onPress={onSelect}
          style={styles.nodeContent}
        >
          <View style={styles.nodeHeader}>
            <Text
              style={[
                styles.nodeName,
                !node.isActive && styles.inactiveText,
              ]}
              numberOfLines={1}
            >
              {node.name}
            </Text>
            {!node.isActive && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  Hidden
                </Text>
              </View>
            )}
          </View>
          <View style={styles.nodeFooter}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: getTypeColor(node.type),
                },
              ]}
            >
              <Text style={styles.typeText}>
                {node.type}
              </Text>
            </View>
            {hasChildren && (
              <Text style={styles.childCount}>
                {node.children!.length}{" "}
                {node.children!.length === 1
                  ? "child"
                  : "children"}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Edit Icon */}
        <TouchableOpacity
          onPress={onSelect}
          style={styles.editButton}
        >
          <MaterialIcons
            name="edit"
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        {/* Add Child Icon */}
        {canHaveChildren && (
          <TouchableOpacity
            onPress={() => onAddChild(node)}
            style={styles.addButton}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={20}
              color="#4CAF50"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Children (recursive) */}
      {isExpanded && hasChildren && (
        <View>
          {node.children!.map((child) => (
            <FilterTreeNode
              key={child._id}
              node={child}
              depth={depth + 1}
              isExpanded={expandedNodes.has(child._id)}
              onToggleExpand={() =>
                onToggleExpandChild(child._id)
              }
              onSelect={onSelect}
              onAddChild={onAddChild}
              expandedNodes={expandedNodes}
              onToggleExpandChild={onToggleExpandChild}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "white",
  },
  inactiveNode: {
    backgroundColor: "#f9f9f9",
  },
  expandButton: {
    padding: 4,
    marginRight: 4,
  },
  nodeContent: {
    flex: 1,
    marginLeft: 8,
  },
  nodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  inactiveText: {
    color: "#999",
    textDecorationLine: "line-through",
  },
  nodeFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  childCount: {
    fontSize: 12,
    color: "#999",
  },
  statusBadge: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
    marginLeft: 4,
  },
});
