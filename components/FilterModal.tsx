import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Button,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { FilterOption } from "@/types";

interface FilterModalProps {
  initialSelected: Id<"FilterOption">[];
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
  console.log("FilterModal - isVisible prop received:", isVisible);
  const [path, setPath] = useState<Id<"FilterOption">[]>(initialSelected);
  const parentId: Id<"FilterOption"> | undefined =
    path.length > 0 ? path[path.length - 1] : undefined;
  const children = useQuery(
    api.filter.getFilterChildren,
    parentId ? { parentId } : {}
  );

  useEffect(() => {
    setPath(initialSelected);
  }, [initialSelected]);

  const handleOptionSelect = useCallback((item: FilterOption) => {
    setPath((prevPath) => [...prevPath, item._id]);
  }, []);

  const handleBack = useCallback(() => {
    setPath((prevPath) => prevPath.slice(0, Math.max(0, prevPath.length - 1)));
  }, []);

  const currentBreadcrumb =
    path.length > 0 ? `Selected depth: ${path.length}` : "Choose qualification";

  if (children === undefined) {
    return (
      <Modal animationType="slide" transparent={true} visible={isVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.loadingText}>Loading filters…</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.breadcrumbText}>{currentBreadcrumb}</Text>

            {children.length === 0 ? (
              <Text style={styles.noFiltersText}>
                No further filters available for this selection.
              </Text>
            ) : (
              <FlatList
                data={children as FilterOption[]}
                keyExtractor={(item) => item._id as unknown as string}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleOptionSelect(item)}
                    style={styles.filterOptionButton}
                  >
                    <Text style={styles.filterOptionText}>{item.name}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.grey}
                    />
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.flatListContent}
              />
            )}

            <View style={styles.buttonContainer}>
              <Button
                title="Back"
                onPress={handleBack}
                disabled={path.length === 0}
                color={COLORS.primary}
              />
              <Button
                title="Cancel"
                onPress={onCancel}
                color={COLORS.secondary}
              />
              <Button
                title="Apply"
                onPress={() => onApply(path)}
                color={COLORS.primary}
              />
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    backgroundColor: COLORS.surface,
    maxHeight: "80%",
    minHeight: 300,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalContent: {
    // Avoid forcing flex:1 which can lead to collapsing views when layouting
  },
  loadingText: {
    fontSize: 18,

    color: COLORS.white,
    textAlign: "center",
    paddingVertical: 30,
  },
  breadcrumbText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 15,
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
    color: COLORS.white,
  },
  noFiltersText: {
    fontSize: 16,
    color: COLORS.grey,
    textAlign: "center",
    paddingVertical: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.lightGray,
    paddingTop: 15,
  },
});
