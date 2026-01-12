import { CommunityPost } from "@/types";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PostsTableProps {
  posts: CommunityPost[];
  selectedIds: Set<string>;
  onToggleSelect: (postId: string) => void;
  onSelectAll: () => void;
  allSelected: boolean;
  bulkMode: boolean;
  onDelete: (postId: string) => void;
}

export default function PostsTable({
  posts,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  allSelected,
  bulkMode,
  onDelete,
}: PostsTableProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    return status === "published" ? "#10B981" : "#F59E0B";
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {bulkMode && (
              <TouchableOpacity
                style={styles.headerCell}
                onPress={onSelectAll}
              >
                <View
                  style={[
                    styles.checkbox,
                    allSelected && styles.checkboxSelected,
                  ]}
                >
                  {allSelected && (
                    <MaterialIcons
                      name="check"
                      size={14}
                      color="white"
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
            <View
              style={[styles.headerCell, styles.titleCell]}
            >
              <Text style={styles.headerText}>Title</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Status</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Filters</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>
                Engagement
              </Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Date</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Actions</Text>
            </View>
          </View>

          {/* Table Body */}
          {posts.map((post) => {
            const isSelected = selectedIds.has(post._id);
            return (
              <View
                key={post._id}
                style={[
                  styles.tableRow,
                  isSelected && styles.tableRowSelected,
                ]}
              >
                {bulkMode && (
                  <TouchableOpacity
                    style={styles.cell}
                    onPress={() => onToggleSelect(post._id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected &&
                          styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <MaterialIcons
                          name="check"
                          size={14}
                          color="white"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                <View
                  style={[styles.cell, styles.titleCell]}
                >
                  <Text
                    style={styles.titleText}
                    numberOfLines={2}
                  >
                    {post.title}
                  </Text>
                  <Text
                    style={styles.contentPreview}
                    numberOfLines={1}
                  >
                    {post.content.substring(0, 80)}...
                  </Text>
                </View>
                <View style={styles.cell}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(post.status)}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: getStatusColor(
                            post.status
                          ),
                        },
                      ]}
                    >
                      {post.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.cell}>
                  <Text style={styles.filterCount}>
                    {post.linkedFilterOptionIds.length}{" "}
                    linked
                  </Text>
                </View>
                <View style={styles.cell}>
                  <View style={styles.engagementContainer}>
                    <View style={styles.engagementItem}>
                      <MaterialIcons
                        name="favorite"
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.engagementText}>
                        {post.likes}
                      </Text>
                    </View>
                    <View style={styles.engagementItem}>
                      <MaterialIcons
                        name="comment"
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.engagementText}>
                        {post.comments}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cell}>
                  <Text style={styles.dateText}>
                    {formatDate(
                      post.publishedAt || post.createdAt
                    )}
                  </Text>
                </View>
                <View style={styles.cell}>
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        router.push(
                          `/admin/posts/${post._id}` as any
                        )
                      }
                    >
                      <MaterialIcons
                        name="edit"
                        size={18}
                        color="#3B82F6"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onDelete(post._id)}
                    >
                      <MaterialIcons
                        name="delete"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#151515",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    overflow: "hidden",
  },
  table: {
    minWidth: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1F1F1F",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  headerCell: {
    padding: 16,
    width: 120,
  },
  titleCell: {
    width: 300,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A0A0A0",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  tableRowSelected: {
    backgroundColor: "#1E40AF20",
  },
  cell: {
    padding: 16,
    width: 120,
    justifyContent: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  titleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  contentPreview: {
    fontSize: 12,
    color: "#666666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  filterCount: {
    fontSize: 13,
    color: "#A0A0A0",
  },
  engagementContainer: {
    flexDirection: "row",
    gap: 12,
  },
  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  engagementText: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  dateText: {
    fontSize: 13,
    color: "#A0A0A0",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#1F1F1F",
  },
});
