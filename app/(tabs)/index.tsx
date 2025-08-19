// app/(tabs)/index.tsx (Main Feed Screen - Hybrid Display)
import React, { useState, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Loader } from "@/components/Loader";
import CareerPathDetails from "@/components/CareerPathDetails";
import CommunityPost from "@/components/CommunityPost";
import FilterModal from "@/components/FilterModal";
import { NoPostsFound } from "@/components/NoPostsFound";

import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import type { FilterOption, CommunityPost as CommunityPostType } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

export default function FeedScreen() {
  const { signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Id<"FilterOption">[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const isViewingSpecificPath = selectedFilters.length > 0;
  const lastSelectedFilterId = isViewingSpecificPath ? selectedFilters[selectedFilters.length - 1] : null;

  // NEW QUERY - Fetch full details of selected FilterOption
  const selectedFilterDetails = useQuery(
    api.filter.getFilterOptionById,
    lastSelectedFilterId ? { filterOptionId: lastSelectedFilterId } : "skip"
  );

  const communityPostsResult = useQuery(
    api.communityPosts.getCommunityPosts,
    {}
  );

  const activeFilterNames = useQuery(
    api.filter.getFilterNamesByIds,
    selectedFilters.length > 0 ? { filterIds: selectedFilters } : "skip"
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Loading state handling - only check what's actually needed
  if (communityPostsResult === undefined) {
    return <Loader />;
  }

  // If viewing specific path, also check selectedFilterDetails
  if (isViewingSpecificPath && selectedFilterDetails === undefined) {
    return <Loader />;
  }

  // Updated displayContent function
  const displayContent = () => {
    if (!isViewingSpecificPath) {
        // No filters selected - show general community posts
        if (!communityPostsResult || communityPostsResult.length === 0) {
             return (
                <NoPostsFound
                    message="No community posts yet. Explore career paths or be the first to share!"
                    onOpenFilter={() => setShowFilterModal(true)}
                />
             );
        }
        return (
            <FlatList
                data={communityPostsResult}
                renderItem={({ item }) => <CommunityPost post={item as CommunityPostType} />}
                keyExtractor={(item) => item._id}
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
        );
    } else {
        // Filters selected - display detailed path info
        const finalFilterOption = selectedFilterDetails as FilterOption | null;

        if (!finalFilterOption) {
            return (
                <NoPostsFound
                    message="Details for this selected path are not available. Try another selection."
                    onOpenFilter={() => setShowFilterModal(true)}
                />
            );
        }

        // Check if FilterOption has content to display
        const hasPathContent = finalFilterOption.description || finalFilterOption.requirements || 
                              finalFilterOption.avgSalary || finalFilterOption.relevantExams || 
                              finalFilterOption.image;

        return (
            <ScrollView 
              contentContainerStyle={styles.flatListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                />
              }
            >
                {hasPathContent ? (
                    <CareerPathDetails filterOption={finalFilterOption} />
                ) : (
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="information-circle-outline" size={40} color={COLORS.gray} />
                        <Text style={styles.emptyStateText}>
                            No detailed content available for &quot;{finalFilterOption.name}&quot;. Explore sub-categories or check community discussions.
                        </Text>
                        {(!communityPostsResult || communityPostsResult.length === 0) && (
                            <Text style={styles.emptyStateText}>No community discussions found for this path yet.</Text>
                        )}
                    </View>
                )}

                {/* Community posts related to this path */}
                {communityPostsResult && communityPostsResult.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>Community Discussions on {finalFilterOption.name}</Text>
                        {communityPostsResult.map((item) => (
                          <CommunityPost key={item._id} post={item as CommunityPostType} />
                        ))}
                    </View>
                )}
            </ScrollView>
        );
    }
  };

  // --- Main Feed UI ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Jobs & Skills
        </Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </View>

      {/* FILTER BUTTON */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilterModal(true)}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={COLORS.background}
        />
        <Text style={styles.filterButtonText}>Filter</Text>
        {selectedFilters.length > 0 && (
          <View style={styles.filterCountBadge}>
            <Text style={styles.filterCountText}>
              {selectedFilters.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {selectedFilters.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Applied:{" "}
            {activeFilterNames
              ? activeFilterNames
                  .filter((opt) => opt)
                  .map((opt) => opt!.name)
                  .join(" > ")
              : "Loading..."}
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
            <Text style={styles.clearFiltersText}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {displayContent()}

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
    paddingTop: 50,
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
    minWidth: 20,
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
    color: COLORS.gray,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 50,
  },
  emptyStateText: {
    color: COLORS.gray,
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 24,
  },
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
});
