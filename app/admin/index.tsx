import PageHeader from "@/components/admin/desktop/PageHeader";
import StatsCard from "@/components/admin/desktop/StatsCard";
import { api } from "@/convex/_generated/api";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminDashboard() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const allFilters = useQuery(
    api.adminFilters.getAllFilters
  );
  const postStats = useQuery(
    api.communityPosts.getPostStats
  );

  const filterStats = {
    total: allFilters?.length || 0,
    active:
      allFilters?.filter((f) => f.isActive).length || 0,
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Dashboard"
        description="Manage your content and career paths from here"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatsCard
            title="Total Posts"
            value={postStats?.total || 0}
            icon="article"
            color="#3B82F6"
            subtitle={`${postStats?.published || 0} published, ${postStats?.drafts || 0} drafts`}
          />
          <StatsCard
            title="Published Posts"
            value={postStats?.published || 0}
            icon="check-circle"
            color="#10B981"
          />
          <StatsCard
            title="Draft Posts"
            value={postStats?.drafts || 0}
            icon="edit"
            color="#F59E0B"
          />
          <StatsCard
            title="Total Filters"
            value={filterStats.total}
            icon="account-tree"
            color="#8B5CF6"
            subtitle={`${filterStats.active} active`}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                router.push("/admin/posts/new" as any)
              }
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: "#1E40AF20" },
                ]}
              >
                <MaterialIcons
                  name="add-circle"
                  size={32}
                  color="#3B82F6"
                />
              </View>
              <Text style={styles.actionTitle}>
                Create New Post
              </Text>
              <Text style={styles.actionDesc}>
                Write and publish content for mobile app
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                router.push("/admin/filters" as any)
              }
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: "#7C3AED20" },
                ]}
              >
                <MaterialIcons
                  name="account-tree"
                  size={32}
                  color="#8B5CF6"
                />
              </View>
              <Text style={styles.actionTitle}>
                Manage Filters
              </Text>
              <Text style={styles.actionDesc}>
                Edit career path hierarchy and settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                router.push("/admin/posts" as any)
              }
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: "#10b98120" },
                ]}
              >
                <MaterialIcons
                  name="list"
                  size={32}
                  color="#10B981"
                />
              </View>
              <Text style={styles.actionTitle}>
                View All Posts
              </Text>
              <Text style={styles.actionDesc}>
                Browse, search, and bulk edit posts
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            System Overview
          </Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <MaterialIcons
                  name="favorite"
                  size={20}
                  color="#EF4444"
                />
                <Text style={styles.overviewText}>
                  {postStats?.totalLikes || 0} Total Likes
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <MaterialIcons
                  name="comment"
                  size={20}
                  color="#3B82F6"
                />
                <Text style={styles.overviewText}>
                  {postStats?.totalComments || 0} Total
                  Comments
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.overviewRow,
                { marginTop: 16 },
              ]}
            >
              <View style={styles.overviewItem}>
                <MaterialIcons
                  name="person"
                  size={20}
                  color="#10B981"
                />
                <Text style={styles.overviewText}>
                  Logged in as{" "}
                  {currentUser?.fullname || "Admin"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 64,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
    flexWrap: "wrap",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  actionCard: {
    flex: 1,
    minWidth: 250,
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2d3748",
    padding: 24,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 8,
  },
  actionDesc: {
    fontSize: 13,
    color: "#9ca3af",
    lineHeight: 18,
  },
  overviewCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2d3748",
    padding: 24,
  },
  overviewRow: {
    flexDirection: "row",
    gap: 32,
  },
  overviewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  overviewText: {
    fontSize: 14,
    color: "#9ca3af",
  },
});
