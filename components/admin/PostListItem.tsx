import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CommunityPost } from "../../types";

interface Props {
  post: CommunityPost;
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
}

export default function PostListItem({
  post,
  bulkMode,
  isSelected,
  onToggleSelect,
  onEdit,
}: Props) {
  const getStatusColor = (status: string) => {
    return status === "published" ? "#4CAF50" : "#FF9800";
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
      ]}
      onPress={bulkMode ? onToggleSelect : onEdit}
      activeOpacity={0.7}
    >
      {/* Checkbox (Bulk Mode) */}
      {bulkMode && (
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && (
            <MaterialIcons
              name="check"
              size={16}
              color="white"
            />
          )}
        </View>
      )}

      {/* Post Image Thumbnail */}
      {post.imageUrl && (
        <Image
          source={post.imageUrl}
          style={styles.thumbnail}
          contentFit="cover"
        />
      )}

      {/* Post Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>

        {/* Content Preview */}
        <Text style={styles.description} numberOfLines={2}>
          {truncate(post.content, 120)}
        </Text>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusColor(
                  post.status
                ),
              },
            ]}
          >
            <MaterialIcons
              name={
                post.status === "published"
                  ? "check-circle"
                  : "drafts"
              }
              size={12}
              color="white"
            />
            <Text style={styles.statusText}>
              {post.status === "published"
                ? "Published"
                : "Draft"}
            </Text>
          </View>

          {/* Date */}
          <Text style={styles.date}>
            {formatDate(post.publishedAt || post.createdAt)}
          </Text>
        </View>

        {/* Linked Filters */}
        {post.linkedFilterOptionIds.length > 0 && (
          <View style={styles.filtersRow}>
            <MaterialIcons
              name="filter-list"
              size={14}
              color="#666"
            />
            <Text style={styles.filterCount}>
              {post.linkedFilterOptionIds.length} filter
              {post.linkedFilterOptionIds.length > 1
                ? "s"
                : ""}
            </Text>
          </View>
        )}

        {/* Engagement Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialIcons
              name="favorite"
              size={14}
              color="#F44336"
            />
            <Text style={styles.statText}>
              {post.likes}
            </Text>
          </View>
          <View style={styles.stat}>
            <MaterialIcons
              name="comment"
              size={14}
              color="#2196F3"
            />
            <Text style={styles.statText}>
              {post.comments}
            </Text>
          </View>
        </View>
      </View>

      {/* Edit Button (Non-Bulk Mode) */}
      {!bulkMode && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
        >
          <MaterialIcons
            name="edit"
            size={20}
            color="#2196F3"
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "flex-start",
  },
  containerSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "white",
  },
  checkboxSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  filterCount: {
    fontSize: 12,
    color: "#666",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#666",
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
});
