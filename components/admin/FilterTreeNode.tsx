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
    return colors[type] || "#9ca3af";
  };

  return (
    <View>
      <View
        style={[
          styles.nodeRow,
          {
            paddingLeft:
              indentWidth > 0 ? indentWidth + 12 : 12,
          },
          !node.isActive && styles.inactiveNode,
        ]}
      >
        <TouchableOpacity
          onPress={onSelect}
          style={styles.contentWrapper}
          activeOpacity={0.7}
        >
          {/* Expand Toggle */}
          <TouchableOpacity
            onPress={onToggleExpand}
            style={[
              styles.expandButton,
              !hasChildren && styles.invisible,
            ]}
            disabled={!hasChildren}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
          >
            <MaterialIcons
              name={
                hasChildren
                  ? isExpanded
                    ? "expand-more"
                    : "chevron-right"
                  : "fiber-manual-record"
              }
              size={18}
              color={
                hasChildren ? "#6B7280" : "transparent"
              }
            />
          </TouchableOpacity>

          {/* Node Name */}
          <Text
            style={[
              styles.nodeName,
              !node.isActive && styles.inactiveText,
            ]}
            numberOfLines={1}
          >
            {node.name}
          </Text>

          {/* Type Badge */}
          <View
            style={[
              styles.typeBadge,
              {
                borderColor: getTypeColor(node.type) + "40",
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                { color: getTypeColor(node.type) },
              ]}
            >
              {node.type}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          {canHaveChildren && (
            <TouchableOpacity
              onPress={() => onAddChild(node)}
              style={styles.actionButton}
            >
              <MaterialIcons
                name="add"
                size={16}
                color="#9ca3af"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onSelect}
            style={styles.actionButton}
          >
            <MaterialIcons
              name="edit"
              size={16}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Children */}
      {isExpanded && hasChildren && node.children && (
        <View>
          {node.children.map((child) => (
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
    paddingVertical: 8,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    backgroundColor: "#111827",
    height: 44,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  inactiveNode: {
    opacity: 0.6,
  },
  expandButton: {
    padding: 4,
    marginRight: 4,
    width: 28,
    alignItems: "center",
  },
  invisible: {
    opacity: 0,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#E5E7EB",
    flex: 1,
    marginRight: 8,
  },
  inactiveText: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 12,
    backgroundColor: "#1f2937",
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: "transparent",
  },
});
