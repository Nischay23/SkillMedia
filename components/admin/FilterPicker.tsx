import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useMemo } from "react";

interface FilterNode {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  isActive: boolean;
  children?: FilterNode[];
}

interface Props {
  filters: FilterNode[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  maxSelections?: number;
}

export default function FilterPicker({ filters, selectedIds, onSelectionChange, maxSelections }: Props) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Build tree structure
  const tree = useMemo(() => {
    const map = new Map<string, FilterNode>();
    filters.forEach((filter) => {
      map.set(filter._id, { ...filter, children: [] });
    });

    const roots: FilterNode[] = [];
    filters.forEach((filter) => {
      const node = map.get(filter._id)!;
      if (!("parentId" in filter) || !(filter as any).parentId) {
        roots.push(node);
      } else {
        const parent = map.get((filter as any).parentId);
        if (parent) parent.children!.push(node);
      }
    });

    // Sort alphabetically at each level
    const sortNodes = (nodes: FilterNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach((node) => {
        if (node.children) sortNodes(node.children);
      });
    };
    sortNodes(roots);

    return roots;
  }, [filters]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree;

    const query = searchQuery.toLowerCase();

    const filterNode = (node: FilterNode): FilterNode | null => {
      const matches = node.name.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query);
      
      const filteredChildren = node.children
        ?.map(filterNode)
        .filter((n): n is FilterNode => n !== null) || [];

      if (matches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    return tree.map(filterNode).filter((n): n is FilterNode => n !== null);
  }, [tree, searchQuery]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const toggleSelection = (nodeId: string) => {
    const newSelection = selectedIds.includes(nodeId)
      ? selectedIds.filter((id) => id !== nodeId)
      : maxSelections && selectedIds.length >= maxSelections
      ? selectedIds
      : [...selectedIds, nodeId];

    onSelectionChange(newSelection);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const addAllIds = (nodes: FilterNode[]) => {
      nodes.forEach((node) => {
        allIds.add(node._id);
        if (node.children) addAllIds(node.children);
      });
    };
    addAllIds(filteredTree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search filters..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialIcons name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.leftControls}>
          <TouchableOpacity style={styles.controlButton} onPress={expandAll}>
            <MaterialIcons name="unfold-more" size={18} color="#2196F3" />
            <Text style={styles.controlText}>Expand All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={collapseAll}>
            <MaterialIcons name="unfold-less" size={18} color="#2196F3" />
            <Text style={styles.controlText}>Collapse All</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearSelection}>
          <Text style={styles.clearText}>Clear ({selectedIds.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Tree */}
      <ScrollView style={styles.treeContainer} showsVerticalScrollIndicator={false}>
        {filteredTree.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="filter-list-off" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No filters found</Text>
          </View>
        ) : (
          filteredTree.map((node) => (
            <FilterPickerNode
              key={node._id}
              node={node}
              depth={0}
              isExpanded={expandedNodes.has(node._id)}
              onToggleExpand={() => toggleExpand(node._id)}
              isSelected={selectedIds.includes(node._id)}
              onToggleSelect={toggleSelection}
              expandedNodes={expandedNodes}
              onToggleExpandChild={(nodeId) => toggleExpand(nodeId)}
              selectedIds={selectedIds}
            />
          ))
        )}
      </ScrollView>

      {/* Selection Limit Warning */}
      {maxSelections && selectedIds.length >= maxSelections && (
        <View style={styles.warningBanner}>
          <MaterialIcons name="info" size={18} color="#FF9800" />
          <Text style={styles.warningText}>
            Maximum {maxSelections} filter{maxSelections > 1 ? "s" : ""} reached
          </Text>
        </View>
      )}
    </View>
  );
}

interface NodeProps {
  node: FilterNode;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSelected: boolean;
  onToggleSelect: (nodeId: string) => void;
  expandedNodes: Set<string>;
  onToggleExpandChild: (nodeId: string) => void;
  selectedIds: string[];
}

function FilterPickerNode({
  node,
  depth,
  isExpanded,
  onToggleExpand,
  isSelected,
  onToggleSelect,
  expandedNodes,
  onToggleExpandChild,
  selectedIds,
}: NodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const indentWidth = depth * 20;

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

  const selectedChildCount = useMemo(() => {
    if (!node.children) return 0;
    const countSelected = (nodes: FilterNode[]): number => {
      return nodes.reduce((count, child) => {
        const isChildSelected = selectedIds.includes(child._id) ? 1 : 0;
        const descendantCount = child.children ? countSelected(child.children) : 0;
        return count + isChildSelected + descendantCount;
      }, 0);
    };
    return countSelected(node.children);
  }, [node.children, selectedIds]);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.nodeRow,
          { paddingLeft: indentWidth + 12 },
          isSelected && styles.selectedNode,
          !node.isActive && styles.inactiveNode,
        ]}
        onPress={() => onToggleSelect(node._id)}
        activeOpacity={0.7}
      >
        {/* Expand/Collapse Icon */}
        <TouchableOpacity
          onPress={onToggleExpand}
          style={styles.expandButton}
          disabled={!hasChildren}
        >
          <MaterialIcons
            name={hasChildren ? (isExpanded ? "expand-more" : "chevron-right") : "fiber-manual-record"}
            size={20}
            color={hasChildren ? "#666" : "#e0e0e0"}
          />
        </TouchableOpacity>

        {/* Checkbox */}
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <MaterialIcons name="check" size={16} color="white" />}
        </View>

        {/* Node Info */}
        <View style={styles.nodeContent}>
          <View style={styles.nodeHeader}>
            <Text
              style={[styles.nodeName, !node.isActive && styles.inactiveText]}
              numberOfLines={1}
            >
              {node.name}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(node.type) }]}>
              <Text style={styles.typeText}>{node.type}</Text>
            </View>
          </View>
          {selectedChildCount > 0 && (
            <Text style={styles.selectedCount}>
              {selectedChildCount} selected below
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Children (recursive) */}
      {isExpanded && hasChildren && (
        <View>
          {node.children!.map((child) => (
            <FilterPickerNode
              key={child._id}
              node={child}
              depth={depth + 1}
              isExpanded={expandedNodes.has(child._id)}
              onToggleExpand={() => onToggleExpandChild(child._id)}
              isSelected={selectedIds.includes(child._id)}
              onToggleSelect={onToggleSelect}
              expandedNodes={expandedNodes}
              onToggleExpandChild={onToggleExpandChild}
              selectedIds={selectedIds}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  leftControls: {
    flexDirection: "row",
    gap: 12,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  controlText: {
    color: "#2196F3",
    fontSize: 13,
    fontWeight: "600",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
  },
  clearText: {
    color: "#F44336",
    fontSize: 13,
    fontWeight: "600",
  },
  treeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999",
  },
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    backgroundColor: "white",
  },
  selectedNode: {
    backgroundColor: "#E8F5E9",
  },
  inactiveNode: {
    backgroundColor: "#fafafa",
  },
  expandButton: {
    padding: 4,
    marginRight: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "white",
  },
  checkboxSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  nodeContent: {
    flex: 1,
  },
  nodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nodeName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  inactiveText: {
    color: "#999",
    textDecorationLine: "line-through",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  selectedCount: {
    fontSize: 11,
    color: "#4CAF50",
    marginTop: 2,
    fontWeight: "600",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#FFE0B2",
  },
  warningText: {
    color: "#F57C00",
    fontSize: 13,
    fontWeight: "600",
  },
});
