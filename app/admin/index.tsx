import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminDashboard() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const allFilters = useQuery(api.adminFilters.getAllFilters);
  
  const filterStats = {
    total: allFilters?.length || 0,
    active: allFilters?.filter(f => f.isActive).length || 0,
    inactive: allFilters?.filter(f => !f.isActive).length || 0,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>
            Welcome back, {currentUser?.fullname || 'Admin'}
          </Text>
        </View>
        <View style={styles.adminBadge}>
          <MaterialIcons name="verified" size={20} color="#4CAF50" />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <MaterialIcons name="widgets" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{filterStats.total}</Text>
            <Text style={styles.statLabel}>Total Filters</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <MaterialIcons name="check-circle" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{filterStats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
            <MaterialIcons name="cancel" size={32} color="#F44336" />
            <Text style={styles.statNumber}>{filterStats.inactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>
      </View>

      {/* Feature Cards */}
      <Text style={styles.sectionTitle}>Management Tools</Text>

      <TouchableOpacity
        style={styles.featureCard}
        onPress={() => router.push("/admin/filters" as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
          <MaterialIcons name="account-tree" size={32} color="#4CAF50" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureHeader}>
            <Text style={styles.featureTitle}>Filter Hierarchy</Text>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </View>
          <Text style={styles.featureDesc}>
            Manage career path filters • Create & edit nodes • Toggle visibility
          </Text>
          {allFilters && (
            <View style={styles.featureMeta}>
              <MaterialIcons name="info-outline" size={14} color="#666" />
              <Text style={styles.featureMetaText}>
                {filterStats.total} filters across 6 hierarchy levels
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.featureCard, styles.featureCardDisabled]}
        disabled
      >
        <View style={[styles.featureIcon, { backgroundColor: '#F5F5F5' }]}>
          <MaterialIcons name="post-add" size={32} color="#999" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureHeader}>
            <Text style={[styles.featureTitle, { color: '#999' }]}>Content Management</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </View>
          <Text style={[styles.featureDesc, { color: '#999' }]}>
            Create and manage community posts • Bulk operations • Analytics
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.featureCard, styles.featureCardDisabled]}
        disabled
      >
        <View style={[styles.featureIcon, { backgroundColor: '#F5F5F5' }]}>
          <MaterialIcons name="analytics" size={32} color="#999" />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureHeader}>
            <Text style={[styles.featureTitle, { color: '#999' }]}>Analytics Dashboard</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </View>
          <Text style={[styles.featureDesc, { color: '#999' }]}>
            User engagement metrics • Content performance • Growth insights
          </Text>
        </View>
      </TouchableOpacity>

      {!allFilters && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  adminBadgeText: {
    color: "#4CAF50",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  featureCardDisabled: {
    opacity: 0.6,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  featureDesc: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  featureMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  featureMetaText: {
    fontSize: 12,
    color: "#666",
  },
  comingSoonBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    color: "#F57C00",
    fontSize: 11,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
});
