import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FilterTreeNode from "./FilterTreeNode";

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

export default function FilterTree({
  onNodeSelect,
  onAddChild,
}: {
  onNodeSelect: (node: FilterNode) => void;
  onAddChild: (node: FilterNode) => void;
}) {
  const allFilters = useQuery(
    api.adminFilters.getAllFilters
  );
  const [expandedNodes, setExpandedNodes] = useState<
    Set<string>
  >(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Build tree structure from flat array
  const tree = useMemo(() => {
    if (!allFilters) return [];

    const nodeMap = new Map<string, FilterNode>();
    const rootNodes: FilterNode[] = [];

    // First pass: create node objects
    allFilters.forEach((filter) => {
      nodeMap.set(filter._id, {
        ...filter,
        children: [],
      });
    });

    // Second pass: build parent-child relationships
    allFilters.forEach((filter) => {
      const node = nodeMap.get(filter._id)!;
      if (filter.parentId) {
        const parent = nodeMap.get(filter.parentId);
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort alphabetically at each level
    const sortNodes = (nodes: FilterNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach((node) => {
        if (node.children) sortNodes(node.children);
      });
    };
    sortNodes(rootNodes);

    return rootNodes;
  }, [allFilters]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree;

    const query = searchQuery.toLowerCase();

    const filterNode = (
      node: FilterNode
    ): FilterNode | null => {
      const matches =
        node.name.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query);

      const filteredChildren =
        node.children
          ?.map(filterNode)
          .filter((n): n is FilterNode => n !== null) || [];

      if (matches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    return tree
      .map(filterNode)
      .filter((n): n is FilterNode => n !== null);
  }, [tree, searchQuery]);

  // Get stats
  const stats = useMemo(() => {
    const activeCount =
      allFilters?.filter((f) => f.isActive).length || 0;
    const inactiveCount =
      (allFilters?.length || 0) - activeCount;
    return {
      total: allFilters?.length || 0,
      active: activeCount,
      inactive: inactiveCount,
    };
  }, [allFilters]);

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

  const expandAll = () => {
    if (!allFilters) return;
    const allIds = new Set(allFilters.map((f) => f._id));
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Auto-expand all when searching
    if (text.trim() && allFilters) {
      const allIds = new Set(allFilters.map((f) => f._id));
      setExpandedNodes(allIds);
    }
  };

  if (!allFilters) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>
          Loading filters...
        </Text>
      </View>
    );
  }

  if (tree.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No filters found
        </Text>
        <Text style={styles.emptySubtext}>
          Run the seeding script to populate filters
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={18}
            color="#6B7280"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search filters..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
            >
              <MaterialIcons
                name="close"
                size={18}
                color="#6B7280"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {stats.total}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNumber,
              { color: "#10B981" },
            ]}
          >
            {stats.active}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNumber,
              { color: "#EF4444" },
            ]}
          >
            {stats.inactive}
          </Text>
          <Text style={styles.statLabel}>Hidden</Text>
        </View>
      </View>

      {/* Tree Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={expandAll}
        >
          <Text style={styles.controlText}>Expand All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={collapseAll}
        >
          <Text style={styles.controlText}>
            Collapse All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tree View */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredTree.length === 0 ? (
          <View style={styles.noResults}>
            <MaterialIcons
              name="search-off"
              size={32}
              color="#374151"
            />
            <Text style={styles.noResultsText}>
              No matches found
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearSearchButton}
            >
              <Text style={styles.clearSearchText}>
                Clear Search
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTree.map((node) => (
            <FilterTreeNode
              key={node._id}
              node={node}
              depth={0}
              isExpanded={expandedNodes.has(node._id)}
              onToggleExpand={() => toggleExpand(node._id)}
              onSelect={() => onNodeSelect(node)}
              onAddChild={onAddChild}
              expandedNodes={expandedNodes}
              onToggleExpandChild={toggleExpand}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f2937", // Matches card bg
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1f2937",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1f2937",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E5E7EB",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  searchSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2d3748",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#374151",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#E5E7EB",
    padding: 0, // Reset default padding
    height: 20,
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2d3748",
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#374151",
  },
  controls: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2d3748",
    flexDirection: "row",
    gap: 8,
  },
  controlButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#111827",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#374151",
  },
  controlText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#1f2937",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  noResultsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  clearSearchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
  },
  clearSearchText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "600",
  },
});
