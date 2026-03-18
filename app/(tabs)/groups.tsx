import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";

// ── Skeleton Card ──────────────────────────────────────
function SkeletonCard({ index }: { index: number }) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true,
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 100)}
      style={[
        {
          height: 80,
          borderRadius: 16,
          backgroundColor: theme.colors.surface,
          marginHorizontal: 16,
          marginBottom: 10,
        },
        pulseStyle,
      ]}
    />
  );
}

// ── Group Card ─────────────────────────────────────────
function GroupCard({
  group,
  index,
  onPress,
}: {
  group: any;
  index: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = useThemedStyles((t) => ({
    card: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: t.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginHorizontal: 16,
    },
    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 999,
      overflow: "hidden" as const,
    },
    avatarGradient: {
      width: 48,
      height: 48,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    avatarLetter: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: "#FFFFFF",
    },
    content: {
      flex: 1,
      marginLeft: 14,
      gap: 4,
    },
    chip: {
      alignSelf: "flex-start" as const,
      backgroundColor: t.colors.primary + "26",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
    },
    memberRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
    },
  }));

  return (
    <AnimatedCard
      variant="transparent"
      delay={Math.min(index * 70, 350)}
      useEnteringAnimation
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
      >
        <Animated.View style={[styles.card, scaleStyle]}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              style={styles.avatarGradient}
            >
              <Typography
                variant="h3"
                weight="bold"
                style={{ color: "#FFFFFF" }}
              >
                {(group.name || "G")[0].toUpperCase()}
              </Typography>
            </LinearGradient>
          </View>

          <View style={styles.content}>
            <Typography
              variant="body"
              weight="semibold"
              numberOfLines={1}
            >
              {group.name}
            </Typography>

            <View style={styles.chip}>
              <Typography
                variant="caption"
                color="primary"
                weight="medium"
              >
                {group.filterOptionName}
              </Typography>
            </View>

            <View style={styles.memberRow}>
              <Ionicons
                name="people-outline"
                size={12}
                color={theme.colors.textMuted}
              />
              <Typography
                variant="caption"
                color="textMuted"
              >
                {group.memberCount.toLocaleString()} members
              </Typography>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.textMuted}
          />
        </Animated.View>
      </Pressable>
    </AnimatedCard>
  );
}

// ── Main Screen ────────────────────────────────────────
export default function GroupsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useQuery(api.users.getCurrentUser);
  const myGroups = useQuery(api.groups.getMyGroups);

  // Create group sheet
  const sheetRef = useRef<BottomSheet>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedFilterId, setSelectedFilterId] =
    useState<Id<"FilterOption"> | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [selectingFilter, setSelectingFilter] =
    useState(false);

  const allFilters = useQuery(
    api.filter.getAllFilterOptions,
    sheetOpen ? {} : "skip",
  );
  const createGroupMutation = useMutation(
    api.groups.createGroup,
  );

  const snapPoints = useMemo(
    () => (selectingFilter ? ["75%", "92%"] : ["75%", "92%"]),
    [selectingFilter],
  );

  const filteredFilters = useMemo(() => {
    if (!allFilters) return [];
    const q = filterSearch.toLowerCase();
    return allFilters.filter((f: any) =>
      f.name.toLowerCase().includes(q),
    );
  }, [allFilters, filterSearch]);

  const selectedFilterName = useMemo(() => {
    if (!selectedFilterId || !allFilters) return "";
    const f = allFilters.find(
      (f: any) => f._id === selectedFilterId,
    );
    return f?.name ?? "";
  }, [selectedFilterId, allFilters]);

  const handleOpenSheet = useCallback(() => {
    setSheetOpen(true);
    setSelectedFilterId(null);
    setGroupName("");
    setGroupDesc("");
    setSelectingFilter(false);
    setTimeout(() => sheetRef.current?.snapToIndex(0), 100);
  }, []);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      setSheetOpen(false);
      setSelectingFilter(false);
    }
  }, []);

  const handleSelectFilter = useCallback(
    (id: Id<"FilterOption">, name: string) => {
      setSelectedFilterId(id);
      setGroupName(name);
      setSelectingFilter(false);
    },
    [],
  );

  const handleCreateGroup = useCallback(async () => {
    if (!selectedFilterId || !groupName.trim()) return;
    const id = await createGroupMutation({
      filterOptionId: selectedFilterId,
      name: groupName.trim(),
      description: groupDesc.trim() || undefined,
    });
    sheetRef.current?.close();
    router.push(`/group/${id}` as any);
  }, [
    selectedFilterId,
    groupName,
    groupDesc,
    createGroupMutation,
    router,
  ]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.primary + "18",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    listContent: {
      paddingTop: 12,
      paddingBottom: 90,
      gap: 10,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: 32,
    },
    emptyIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: t.colors.primary + "1F",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    emptyButton: {
      borderWidth: 1.5,
      borderColor: t.colors.primary,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
    // Sheet styles
    sheetBg: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    sheetHandle: {
      backgroundColor: t.colors.textMuted,
      width: 36,
      height: 4,
    },
    sheetContent: {
      paddingHorizontal: 20,
      gap: 16,
      paddingBottom: insets.bottom + 90,
    },
    sheetLabel: {
      marginBottom: 6,
    },
    sheetInput: {
      backgroundColor: t.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: t.colors.text,
    },
    filterSelector: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      backgroundColor: t.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    createButton: {
      height: 48,
      borderRadius: 12,
      overflow: "hidden" as const,
    },
    createButtonWrapper: {
      paddingBottom: insets.bottom + 90,
      paddingHorizontal: 16,
    },
    createGradient: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    filterItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    filterSearchContainer: {
      marginHorizontal: 16,
      marginBottom: 8,
      position: "relative" as const,
    },
    filterSearchInput: {
      backgroundColor: t.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingLeft: 36,
      paddingRight: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: t.colors.text,
    },
    searchIcon: {
      position: "absolute" as const,
      left: 12,
      top: 12,
      zIndex: 1,
    },
    filterHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
  }));

  // Loading
  if (myGroups === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={
            isDark ? "light-content" : "dark-content"
          }
        />
        <View style={styles.header}>
          <Typography
            variant="h2"
            weight="bold"
            color="text"
          >
            My Groups
          </Typography>
          <View style={{ width: 36 }} />
        </View>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" weight="bold" color="text">
          My Groups
        </Typography>
        {currentUser?.isAdmin && (
          <Pressable
            onPress={handleOpenSheet}
            style={styles.addButton}
          >
            <Ionicons
              name="add"
              size={22}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
      </View>

      {/* Group List or Empty State */}
      {myGroups.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.emptyContainer}
        >
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="people-outline"
              size={64}
              color={theme.colors.primary}
            />
          </View>
          <View style={{ height: 16 }} />
          <Typography
            variant="h3"
            weight="bold"
            color="text"
            align="center"
          >
            No Groups Yet
          </Typography>
          <View style={{ height: 8 }} />
          <Typography
            variant="body"
            color="textMuted"
            align="center"
            style={{ maxWidth: 260 }}
          >
            Join career communities to connect with others
            on the same path
          </Typography>
          <View style={{ height: 16 }} />
          <Pressable
            onPress={() =>
              router.replace("/(tabs)/" as any)
            }
            style={styles.emptyButton}
          >
            <Typography
              variant="body"
              weight="semibold"
              color="primary"
            >
              Explore Careers
            </Typography>
          </Pressable>
        </Animated.View>
      ) : (
        <FlatList
          data={myGroups}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <GroupCard
              group={item}
              index={index}
              onPress={() =>
                router.push(`/group/${item._id}` as any)
              }
            />
          )}
        />
      )}

      {/* Create Group Bottom Sheet */}
      {sheetOpen && (
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChange}
          enablePanDownToClose
          enableDynamicSizing={false}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          bottomInset={insets.bottom + 80}
        >
          {selectingFilter ? (
            <>
              {/* Fixed Header */}
              <BottomSheetView style={styles.filterHeader}>
                <Pressable
                  onPress={() => setSelectingFilter(false)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={theme.colors.text}
                  />
                  <Typography
                    variant="h4"
                    weight="bold"
                    color="text"
                  >
                    Select Career Path
                  </Typography>
                </Pressable>
              </BottomSheetView>

              {/* Fixed Search Input */}
              <View style={styles.filterSearchContainer}>
                <Ionicons
                  name="search-outline"
                  size={16}
                  color={theme.colors.textMuted}
                  style={styles.searchIcon}
                />
                <BottomSheetTextInput
                  style={styles.filterSearchInput}
                  placeholder="Search career paths..."
                  placeholderTextColor={
                    theme.colors.textMuted
                  }
                  value={filterSearch}
                  onChangeText={setFilterSearch}
                />
              </View>

              {/* Scrollable Filter List */}
              <BottomSheetFlatList
                data={filteredFilters}
                keyExtractor={(item: any) => item._id}
                renderItem={({ item }: { item: any }) => (
                  <Pressable
                    onPress={() =>
                      handleSelectFilter(
                        item._id,
                        item.name,
                      )
                    }
                    style={styles.filterItem}
                  >
                    <Typography variant="body" color="text">
                      {item.name}
                    </Typography>
                    {selectedFilterId === item._id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </Pressable>
                )}
              />
            </>
          ) : (
            <BottomSheetScrollView
              contentContainerStyle={{
                paddingBottom: insets.bottom + 90,
              }}
            >
              <View style={styles.sheetContent}>
                <Typography
                  variant="h3"
                  weight="bold"
                  color="text"
                >
                  Create Group
                </Typography>

                {/* Career Path */}
                <View>
                  <Typography
                    variant="caption"
                    weight="medium"
                    color="textSecondary"
                    style={styles.sheetLabel}
                  >
                    Career Path
                  </Typography>
                  <Pressable
                    onPress={() => setSelectingFilter(true)}
                    style={styles.filterSelector}
                  >
                    <Typography
                      variant="body"
                      color={
                        selectedFilterId
                          ? "text"
                          : "textMuted"
                      }
                      numberOfLines={1}
                      style={{ flex: 1 }}
                    >
                      {selectedFilterName ||
                        "Select a career path"}
                    </Typography>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.colors.textMuted}
                    />
                  </Pressable>
                </View>

                {/* Group Name */}
                <View>
                  <Typography
                    variant="caption"
                    weight="medium"
                    color="textSecondary"
                    style={styles.sheetLabel}
                  >
                    Group Name
                  </Typography>
                  <BottomSheetTextInput
                    style={styles.sheetInput}
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Enter group name"
                    placeholderTextColor={
                      theme.colors.textMuted
                    }
                  />
                </View>

                {/* Description */}
                <View>
                  <Typography
                    variant="caption"
                    weight="medium"
                    color="textSecondary"
                    style={styles.sheetLabel}
                  >
                    Description (optional)
                  </Typography>
                  <BottomSheetTextInput
                    style={[
                      styles.sheetInput,
                      {
                        height: 80,
                        textAlignVertical: "top" as const,
                      },
                    ]}
                    value={groupDesc}
                    onChangeText={setGroupDesc}
                    placeholder="Describe this group..."
                    placeholderTextColor={
                      theme.colors.textMuted
                    }
                    multiline
                  />
                </View>

                {/* Submit Button */}
                <View style={styles.createButtonWrapper}>
                  <Pressable
                    onPress={handleCreateGroup}
                    disabled={!selectedFilterId}
                    style={[
                      styles.createButton,
                      !selectedFilterId && { opacity: 0.5 },
                    ]}
                  >
                    <LinearGradient
                      colors={["#6C5DD3", "#8676FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.createGradient}
                    >
                      <Typography
                        variant="body"
                        weight="bold"
                        style={{ color: "#FFFFFF" }}
                      >
                        Create Group
                      </Typography>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </BottomSheetScrollView>
          )}
        </BottomSheet>
      )}
    </SafeAreaView>
  );
}
