// app/(tabs)/index.tsx (Main Feed Screen)
import React, { useState, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// --- Components ---
import { Loader } from "@/components/Loader";
import Post from "@/components/Post";
import FilterModal from "@/components/FilterModal";
import { NoPostsFound } from "@/components/NoPostsFound";

// --- Convex & Auth ---
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";

// --- Types ---
import { Post as PostType } from "@/types";
import { Id } from "@/convex/_generated/dataModel";

export default function FeedScreen() {
  const { signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // State to manage the currently selected filter path (array of FilterOption _ids)
  const [selectedFilters, setSelectedFilters] = useState<Id<"FilterOption">[]>(
    []
  );
  // State to control the visibility of the FilterModal
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch posts from Convex based on the selected filters
  const posts = useQuery(api.posts.getFilteredPosts, {
    selectedFilterIds: selectedFilters,
  });

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // --- Loading and Empty State Handling ---
  if (posts === undefined) {
    return <Loader />;
  }

  if (posts.length === 0) {
    if (selectedFilters.length === 0) {
      return (
        <NoPostsFound
          message="No job or skill opportunities available yet. Tap 'Filter' to explore options!"
          onOpenFilter={() => setShowFilterModal(true)}
        />
      );
    } else {
      return (
        <NoPostsFound
          message="No opportunities match your current filters. Try adjusting them!"
          onOpenFilter={() => setShowFilterModal(true)}
        />
      );
    }
  }

  // --- Main Feed UI ---
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs & Skills</Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* FILTER BUTTON */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilterModal(true)}
      >
        <Ionicons name="options-outline" size={20} color={COLORS.background} />
        <Text style={styles.filterButtonText}>Filter</Text>
        {selectedFilters.length > 0 && (
          <View style={styles.filterCountBadge}>
            <Text style={styles.filterCountText}>{selectedFilters.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Optional: Display currently active filters as breadcrumbs/tags */}
      {selectedFilters.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Applied ({selectedFilters.length})
          </Text>
          <TouchableOpacity
            onPress={() => setSelectedFilters([])}
            style={styles.clearFiltersButton}
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={COLORS.gray}
            />
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* POSTS LIST (FlatList) */}
      <FlatList
        data={posts as PostType[]}
        renderItem={({ item }) => <Post post={item} />}
        keyExtractor={(item) => String(item._id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      />

      {/* FILTER MODAL COMPONENT */}
      <FilterModal
        isVisible={showFilterModal}
        initialSelected={selectedFilters}
        onApply={(newFilters) => {
          setSelectedFilters(newFilters);
          setShowFilterModal(false);
        }}
        onCancel={() => setShowFilterModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50, // Adjust for status bar/notch
    paddingBottom: 15,
    backgroundColor: COLORS.headerBackground,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 15,
    alignSelf: "flex-end",
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  filterButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  filterCountBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 20, // ensure badge doesn't collapse for single digit
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  filterCountText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "bold",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    padding: 10,
    marginHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  activeFiltersText: {
    color: COLORS.gray, // Should be readable on cardBackground
    fontSize: 13,
    flexShrink: 1,
    marginRight: 10,
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearFiltersText: {
    color: COLORS.gray,
    fontSize: 13,
    marginLeft: 4,
  },
  flatListContent: {
    paddingBottom: 60,
  },
});
