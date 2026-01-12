import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BulkActionsToolbar from "../../components/admin/BulkActionsToolbar";
import PostForm from "../../components/admin/PostForm";
import PostListItem from "../../components/admin/PostListItem";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type TabType = "all" | "published" | "draft";

export default function ContentManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] =
    useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostIds, setSelectedPostIds] = useState<
    Set<string>
  >(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [editingPostId, setEditingPostId] =
    useState<Id<"communityPosts"> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  // Queries
  const posts = useQuery(
    api.communityPosts.searchCommunityPosts,
    searchQuery.length >= 2
      ? {
          searchQuery: searchQuery,
          statusFilter: activeTab,
        }
      : "skip"
  );

  const allPosts = useQuery(
    api.communityPosts.getCommunityPosts,
    searchQuery.length < 2
      ? { statusFilter: activeTab }
      : "skip"
  );

  const stats = useQuery(api.communityPosts.getPostStats);
  const editingPost = useQuery(
    api.communityPosts.getCommunityPostById,
    editingPostId ? { postId: editingPostId } : "skip"
  );

  // Mutations
  const bulkDelete = useMutation(
    api.communityPosts.bulkDeletePosts
  );
  const bulkUpdateStatus = useMutation(
    api.communityPosts.bulkUpdateStatus
  );
  const updatePost = useMutation(
    api.communityPosts.updateCommunityPost
  );

  const displayedPosts = (
    searchQuery.length >= 2 ? posts : allPosts
  ) as any[] | undefined;

  const handleToggleSelect = (postId: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!displayedPosts) return;
    if (selectedPostIds.size === displayedPosts.length) {
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(
        new Set(displayedPosts.map((p: any) => p._id))
      );
    }
  };

  const handleBulkDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await bulkDelete({
        postIds: Array.from(
          selectedPostIds
        ) as Id<"communityPosts">[],
      });
      setSelectedPostIds(new Set());
      setBulkMode(false);
      setShowDeleteConfirm(false);
    } catch {
      Alert.alert("Error", "Failed to delete posts");
    }
  };

  const handleBulkPublish = async () => {
    try {
      await bulkUpdateStatus({
        postIds: Array.from(
          selectedPostIds
        ) as Id<"communityPosts">[],
        status: "published",
      });
      setSelectedPostIds(new Set());
      setBulkMode(false);
    } catch {
      Alert.alert("Error", "Failed to publish posts");
    }
  };

  const handleBulkDraft = async () => {
    try {
      await bulkUpdateStatus({
        postIds: Array.from(
          selectedPostIds
        ) as Id<"communityPosts">[],
        status: "draft",
      });
      setSelectedPostIds(new Set());
      setBulkMode(false);
    } catch {
      Alert.alert("Error", "Failed to update posts");
    }
  };

  const handleSavePost = async (data: any) => {
    if (!editingPostId) return;
    try {
      await updatePost({
        postId: editingPostId,
        ...data,
      });
      setEditingPostId(null);
    } catch {
      Alert.alert("Error", "Failed to update post");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="#333"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Content Management
        </Text>
        <TouchableOpacity
          onPress={() => setBulkMode(!bulkMode)}
        >
          <MaterialIcons
            name={bulkMode ? "close" : "checklist"}
            size={24}
            color={bulkMode ? "#F44336" : "#2196F3"}
          />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      {stats && (
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
                { color: "#4CAF50" },
              ]}
            >
              {stats.published}
            </Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statNumber,
                { color: "#FF9800" },
              ]}
            >
              {stats.drafts}
            </Text>
            <Text style={styles.statLabel}>Drafts</Text>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color="#999"
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or content..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
          >
            <MaterialIcons
              name="close"
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "all" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.tabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "published" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("published")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "published" &&
                styles.tabTextActive,
            ]}
          >
            Published
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "draft" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("draft")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "draft" && styles.tabTextActive,
            ]}
          >
            Drafts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Post List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {!displayedPosts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#2196F3"
            />
            <Text style={styles.loadingText}>
              Loading posts...
            </Text>
          </View>
        ) : displayedPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="post-add"
              size={64}
              color="#ddd"
            />
            <Text style={styles.emptyText}>
              No posts found
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try different search terms"
                : "Create your first post to get started"}
            </Text>
          </View>
        ) : (
          displayedPosts.map((post) => (
            <PostListItem
              key={post._id}
              post={post}
              bulkMode={bulkMode}
              isSelected={selectedPostIds.has(post._id)}
              onToggleSelect={() =>
                handleToggleSelect(post._id)
              }
              onEdit={() => setEditingPostId(post._id)}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {!bulkMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            router.push("/(tabs)/create" as any)
          }
        >
          <MaterialIcons
            name="add"
            size={28}
            color="white"
          />
        </TouchableOpacity>
      )}

      {/* Bulk Actions Toolbar */}
      {bulkMode && selectedPostIds.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedPostIds.size}
          onSelectAll={handleSelectAll}
          allSelected={
            displayedPosts
              ? selectedPostIds.size ===
                displayedPosts.length
              : false
          }
          onPublish={handleBulkPublish}
          onDraft={handleBulkDraft}
          onDelete={handleBulkDelete}
          onCancel={() => {
            setSelectedPostIds(new Set());
            setBulkMode(false);
          }}
        />
      )}

      {/* Edit Post Modal */}
      <Modal
        visible={editingPostId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingPostId(null)}
      >
        {editingPost && (
          <PostForm
            mode="edit"
            initialData={editingPost}
            onSave={handleSavePost}
            onCancel={() => setEditingPostId(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <MaterialIcons
              name="warning"
              size={48}
              color="#F44336"
            />
            <Text style={styles.deleteTitle}>
              Delete Posts?
            </Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete{" "}
              {selectedPostIds.size} post
              {selectedPostIds.size > 1 ? "s" : ""}? This
              action cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  styles.cancelButton,
                ]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  styles.confirmButton,
                ]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmButtonText}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
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
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#2196F3",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  tabTextActive: {
    color: "#2196F3",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModal: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
  },
  deleteMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  deleteActions: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
    width: "100%",
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  confirmButton: {
    backgroundColor: "#F44336",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
