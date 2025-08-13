// app/components/FilterModal.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel"; // Ensure Id is imported
import { useConvex, useQuery } from "convex/react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { FilterOption } from "@/types";

interface FilterModalProps {
  initialSelected: Id<"FilterOption">[]; // Using Convex's Id type for consistency
  onApply: (filters: Id<"FilterOption">[]) => void;
  onCancel: () => void;
  isVisible: boolean;
}

export default function FilterModal({
  initialSelected,
  onApply,
  onCancel,
  isVisible,
}: FilterModalProps) {
  const [path, setPath] = useState<Id<"FilterOption">[]>(initialSelected);

  const isInitialRender = useRef(true);
  const convex = useConvex();

  // Current parent ID for fetching children
  const parentId: Id<"FilterOption"> | undefined =
    path.length > 0 ? path[path.length - 1] : undefined;

  // Fetch children for the current level
  const children = useQuery(
    api.filter.getFilterChildren,
    parentId ? { parentId, limit: 200 } : { limit: 200 }
  );

  // Fetch names for the breadcrumb path (this query will run whenever 'path' changes)
  const breadcrumbOptions = useQuery(api.filter.getFilterNamesByIds, {
    filterIds: path,
  });

  // Cache last successful children and breadcrumb to avoid UI flicker while queries are undefined
  const [childrenCache, setChildrenCache] = useState<FilterOption[]>([]);
  const [breadcrumbCache, setBreadcrumbCache] = useState<string>("");

  // In-memory map cache for previously visited parents -> children
  const childrenByParentRef = useRef<Map<string | undefined, FilterOption[]>>(
    new Map()
  );
  // In-memory map of optionId -> option for instant breadcrumb names
  const optionByIdRef = useRef<Map<string, FilterOption>>(new Map());

  useEffect(() => {
    if (children) {
      const list = children as FilterOption[];
      setChildrenCache(list);
      childrenByParentRef.current.set(
        parentId as unknown as string | undefined,
        list
      );
      // Index children for instant breadcrumb name lookup
      for (const child of list) {
        optionByIdRef.current.set(child._id as unknown as string, child);
      }
    }
  }, [children]);

  useEffect(() => {
    if (breadcrumbOptions) {
      const names = breadcrumbOptions
        .filter((opt) => opt)
        .map((opt) => opt!.name)
        .join(" > ");
      setBreadcrumbCache(names);
      // Index breadcrumb options as well
      for (const opt of breadcrumbOptions) {
        if (opt) {
          optionByIdRef.current.set(
            opt._id as unknown as string,
            opt as unknown as FilterOption
          );
        }
      }
    }
  }, [breadcrumbOptions]);

  // Update internal path if initialSelected changes (e.g., from clear filters)
  useEffect(() => {
    if (isVisible && isInitialRender.current) {
      setPath(initialSelected);
      isInitialRender.current = false; // Mark that initial render/open setup is done
    } else if (!isVisible) {
      // When modal closes, reset the flag for next time it opens
      isInitialRender.current = true;
    }
  }, [isVisible, initialSelected]);

  // Handle drilling down
  const handleOptionSelect = useCallback((item: FilterOption) => {
    // Optimistically extend breadcrumb cache and index this item
    optionByIdRef.current.set(item._id as unknown as string, item);
    setBreadcrumbCache((prev) => (prev ? `${prev} > ${item.name}` : item.name));
    setPath((prevPath) => [...prevPath, item._id as Id<"FilterOption">]);
  }, []);

  // Handle going back up
  const handleBack = useCallback(() => {
    setPath((prevPath) => {
      const next = prevPath.slice(0, Math.max(0, prevPath.length - 1));
      const names = next
        .map((id) => optionByIdRef.current.get(id as unknown as string)?.name)
        .filter(Boolean) as string[];
      setBreadcrumbCache(names.join(" > "));
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setPath([]);
    setBreadcrumbCache("");
  }, []);

  // Determine breadcrumb display string, preferring instant local names
  const localNames = path
    .map((id) => optionByIdRef.current.get(id as unknown as string)?.name)
    .filter(Boolean) as string[];
  const serverNames = breadcrumbOptions
    ? breadcrumbOptions.filter((opt) => opt).map((opt) => opt!.name)
    : undefined;
  const breadcrumbDisplay =
    path.length === 0
      ? "Choose qualification"
      : localNames.length === path.length
        ? localNames.join(" > ")
        : serverNames?.length
          ? serverNames.join(" > ")
          : breadcrumbCache;

  const childrenToShow = (children ??
    childrenByParentRef.current.get(
      parentId as unknown as string | undefined
    ) ??
    childrenCache) as FilterOption[];

  // Prefetch next level on render when possible
  useEffect(() => {
    let cancelled = false;
    const prefetch = async () => {
      try {
        // Heuristic: prefetch for the first item to keep UX snappy on tap
        const first = childrenToShow?.[0];
        if (!first) return;
        const key = first._id as unknown as string;
        if (childrenByParentRef.current.has(key)) return;
        const next = await convex.query(api.filter.getFilterChildren, {
          parentId: first._id as Id<"FilterOption">,
          limit: 200,
        });
        if (cancelled) return;
        childrenByParentRef.current.set(key, next as FilterOption[]);
      } catch (e) {
        // ignore prefetch errors
      }
    };
    prefetch();
    return () => {
      cancelled = true;
    };
  }, [childrenToShow, convex]);

  // Purpose of Apply button:
  // It finalizes the currently selected filter path and passes it back
  // to the main feed screen. The feed screen then displays posts matching this path.
  // If the user hasn't drilled down at all, applying an empty path clears filters.
  // If they drilled partway, it applies filters up to that level.

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel} // Android back button closes
      statusBarTranslucent // Allows content to go behind status bar
      presentationStyle="overFullScreen" // Covers the whole screen in iOS
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header with breadcrumbs and close icon */}
            <View style={styles.modalHeader}>
              <Text style={styles.breadcrumbText}>{breadcrumbDisplay}</Text>
              <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            {/* Filter Options List */}
            {children !== undefined && childrenToShow.length === 0 ? (
              <Text style={styles.noFiltersText}>
                No further options available here.
              </Text>
            ) : (
              <FlatList
                data={childrenToShow as FilterOption[]}
                keyExtractor={(item) => item._id as string} // Explicitly cast to string
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleOptionSelect(item)}
                    style={styles.filterOptionButton}
                  >
                    <Text style={styles.filterOptionText}>{item.name}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.gray}
                    />
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.flatListContent}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleBack}
                disabled={path.length === 0}
                style={[
                  styles.buttonBase,
                  styles.buttonBack,
                  path.length === 0 && styles.buttonDisabled,
                ]}
              >
                <Text style={[styles.buttonTextMuted]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearAll}
                style={[styles.buttonBase, styles.buttonDanger]}
              >
                <Text style={styles.buttonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onApply(path)}
                style={[styles.buttonBase, styles.buttonPrimary]}
              >
                <Text style={styles.buttonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "98%",
    minHeight: 560, // Make it even larger
  },
  modalContent: {
    flex: 1, // Allow content to expand
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.white,
    textAlign: "center",
    paddingVertical: 30,
  },
  breadcrumbText: {
    fontSize: 16, // Slightly larger for breadcrumb
    fontWeight: "bold",
    color: COLORS.white, // Ensure white for visibility
    flexShrink: 1, // Allow text to wrap
    marginRight: 10,
  },
  closeButton: {
    padding: 5, // Make touch area larger
  },
  filterOptionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray,
  },
  filterOptionText: {
    fontSize: 18,
    color: COLORS.white, // Ensure white for clarity
  },
  noFiltersText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
    paddingVertical: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.lightGray,
    paddingTop: 15,
  },
  buttonBase: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonBack: {
    backgroundColor: COLORS.surfaceLight,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonDanger: {
    backgroundColor: COLORS.danger,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: "bold",
  },
  buttonTextMuted: {
    color: COLORS.gray,
    fontWeight: "bold",
  },
});
