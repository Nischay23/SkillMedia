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

  // Get stats
  const stats = useMemo(() => {
    const activeCount = allFilters?.filter(f => f.isActive).length || 0;
    const inactiveCount = (allFilters?.length || 0) - activeCount;
    return { total: allFilters?.length || 0, active: activeCount, inactive: inactiveCount };
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
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search filters by name or type..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialIcons name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <MaterialIcons name="widgets" size={18} color="#666" />
          <Text style={styles.statText}>
            {stats.total} Total
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
          <Text style={styles.statText}>
            {stats.active} Active
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialIcons name="cancel" size={18} color="#F44336" />
          <Text style={styles.statText}>
            {stats.inactive} Inactive
          </Text>
        </View>
      </View>

      {/* Tree Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={expandAll}>
          <MaterialIcons name="unfold-more" size={18} color="#2196F3" />
          <Text style={styles.controlText}>Expand All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={collapseAll}>
          <MaterialIcons name="unfold-less" size={18} color="#2196F3" />
          <Text style={styles.controlText}>Collapse All</Text>
        </TouchableOpacity>
      </View>

      {/* Tree View */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredTree.length === 0 ? (
          <View style={styles.noResults}>
            <MaterialIcons name="search-off" size={48} color="#ddd" />
            <Text style={styles.noResultsText}>No filters match &quot;{searchQuery}&quot;</Text>
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
              <Text style={styles.clearSearchText}>Clear Search</Text>
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
    backgroundColor: "#fafafa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
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
  statsBar: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
  },
  controls: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    gap: 12,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  controlText: {
    color: "#2196F3",
    fontSize: 13,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "white",
  },
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#2196F3",
    borderRadius: 8,
  },
  clearSearchText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
