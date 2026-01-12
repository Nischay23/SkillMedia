import PageHeader from "@/components/admin/desktop/PageHeader";
import PostsTable from "@/components/admin/desktop/PostsTable";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
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

export default function PostsListPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<
    Set<string>
  >(new Set());

  const posts = useQuery(
    api.communityPosts.searchCommunityPosts,
    searchQuery.length >= 2
      ? { searchQuery, statusFilter }
      : "skip"
  );

  const allPosts = useQuery(
    api.communityPosts.getCommunityPosts,
    searchQuery.length < 2 ? { statusFilter } : "skip"
  );

  const bulkDelete = useMutation(
    api.communityPosts.bulkDeletePosts
  );
  const bulkUpdateStatus = useMutation(
    api.communityPosts.bulkUpdateStatus
  );
  const deletePost = useMutation(
    api.communityPosts.deleteCommunityPost
  );

  const postsToDisplay =
    searchQuery.length >= 2 ? posts : allPosts;

  const handleToggleSelect = (postId: string) => {
    const newSelected = new Set(selectedPostIds);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPostIds(newSelected);
  };

  const handleSelectAll = () => {
    if (!postsToDisplay) return;
    if (selectedPostIds.size === postsToDisplay.length) {
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(
        new Set(postsToDisplay.map((p) => p._id))
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPostIds.size === 0) return;
    Alert.alert(
      "Delete Posts",
      `Delete ${selectedPostIds.size} posts? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await bulkDelete({
                postIds: Array.from(
                  selectedPostIds
                ) as Id<"communityPosts">[],
              });
              setSelectedPostIds(new Set());
              setBulkMode(false);
              toast({
                title: "Deleted",
                description: "Posts deleted successfully",
                variant: "success",
              });
            } catch {
              Alert.alert(
                "Error",
                "Failed to delete posts"
              );
            }
          },
        },
      ]
    );
  };

  const handleBulkPublish = async () => {
    if (selectedPostIds.size === 0) return;
    try {
      await bulkUpdateStatus({
        postIds: Array.from(
          selectedPostIds
        ) as Id<"communityPosts">[],
        status: "published",
      });
      setSelectedPostIds(new Set());
      setBulkMode(false);
      toast({
        title: "Updated",
        description: "Posts published successfully",
        variant: "success",
      });
    } catch {
      Alert.alert("Error", "Failed to publish posts");
    }
  };

  const handleBulkDraft = async () => {
    if (selectedPostIds.size === 0) return;
    try {
      await bulkUpdateStatus({
        postIds: Array.from(
          selectedPostIds
        ) as Id<"communityPosts">[],
        status: "draft",
      });
      setSelectedPostIds(new Set());
      setBulkMode(false);
      toast({
        title: "Updated",
        description: "Posts moved to draft",
        variant: "success",
      });
    } catch {
      Alert.alert("Error", "Failed to unpublish posts");
    }
  };

  const handleDelete = (postId: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost({
                postId: postId as Id<"communityPosts">,
              });
              toast({
                title: "Deleted",
                description: "Post deleted successfully",
                variant: "success",
              });
            } catch {
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Posts"
        description="Manage all community posts and content"
        action={
          <TouchableOpacity
            style={styles.createButton}
            onPress={() =>
              router.push("/admin/posts/new" as any)
            }
          >
            <MaterialIcons
              name="add"
              size={20}
              color="white"
            />
            <Text style={styles.createButtonText}>
              Create Post
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Filters Bar */}
        <View style={styles.filtersBar}>
          <View style={styles.searchContainer}>
            <MaterialIcons
              name="search"
              size={20}
              color="#666"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts (min 2 characters)..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterButtons}>
            {(["all", "published", "draft"] as const).map(
              (status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    statusFilter === status &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      statusFilter === status &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() +
                      status.slice(1)}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.bulkModeButton,
              bulkMode && styles.bulkModeButtonActive,
            ]}
            onPress={() => {
              setBulkMode(!bulkMode);
              setSelectedPostIds(new Set());
            }}
          >
            <MaterialIcons
              name="checklist"
              size={20}
              color={bulkMode ? "#3B82F6" : "#666"}
            />
            <Text
              style={[
                styles.bulkModeText,
                bulkMode && styles.bulkModeTextActive,
              ]}
            >
              Bulk Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts Table */}
        {postsToDisplay && postsToDisplay.length > 0 ? (
          <PostsTable
            posts={postsToDisplay}
            selectedIds={selectedPostIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            allSelected={
              postsToDisplay.length > 0 &&
              selectedPostIds.size === postsToDisplay.length
            }
            bulkMode={bulkMode}
            onDelete={handleDelete}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="article"
              size={48}
              color="#666"
            />
            <Text style={styles.emptyText}>
              {searchQuery.length >= 2
                ? "No posts found"
                : "No posts yet"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bulk Actions Toolbar */}
      {bulkMode && selectedPostIds.size > 0 && (
        <View style={styles.bulkToolbar}>
          <Text style={styles.bulkCount}>
            {selectedPostIds.size} selected
          </Text>
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={styles.bulkAction}
              onPress={handleBulkPublish}
            >
              <MaterialIcons
                name="publish"
                size={20}
                color="#10B981"
              />
              <Text
                style={[
                  styles.bulkActionText,
                  { color: "#10B981" },
                ]}
              >
                Publish
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkAction}
              onPress={handleBulkDraft}
            >
              <MaterialIcons
                name="drafts"
                size={20}
                color="#F59E0B"
              />
              <Text
                style={[
                  styles.bulkActionText,
                  { color: "#F59E0B" },
                ]}
              >
                Draft
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkAction}
              onPress={handleBulkDelete}
            >
              <MaterialIcons
                name="delete"
                size={20}
                color="#EF4444"
              />
              <Text
                style={[
                  styles.bulkActionText,
                  { color: "#EF4444" },
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkAction}
              onPress={() => {
                setSelectedPostIds(new Set());
                setBulkMode(false);
              }}
            >
              <MaterialIcons
                name="close"
                size={20}
                color="#666"
              />
              <Text
                style={[
                  styles.bulkActionText,
                  { color: "#666" },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 32,
    paddingBottom: 100,
  },
  filtersBar: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151515",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#FFFFFF",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  filterButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A0A0A0",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  bulkModeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  bulkModeButtonActive: {
    backgroundColor: "#1E40AF20",
    borderColor: "#3B82F6",
  },
  bulkModeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  bulkModeTextActive: {
    color: "#3B82F6",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  bulkToolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#151515",
    borderTopWidth: 2,
    borderTopColor: "#3B82F6",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bulkCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bulkActions: {
    flexDirection: "row",
    gap: 16,
  },
  bulkAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulkActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
