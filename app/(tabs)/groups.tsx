import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Platform,
  Pressable,
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
      withTiming(0.25, { duration: 700 }),
      -1,
      true,
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index * 60)}
      style={[
        {
          height: 100,
          borderRadius: 20,
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
  const badgeScale = useSharedValue(group.unreadCount > 0 ? 1 : 0);

  // Animate badge when it appears
  useEffect(() => {
    if (group.unreadCount > 0) {
      badgeScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    } else {
      badgeScale.value = withSpring(0, { damping: 10, stiffness: 300 });
    }
  }, [group.unreadCount, badgeScale]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeScale.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, {
      damping: 15,
      stiffness: 300,
    });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  }, [scale]);

  // Format last message time
  const formatMessageTime = (timestamp: number | undefined) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index * 60)}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                },
                android: {
                  elevation: 2,
                },
              }),
            },
            scaleStyle,
          ]}
        >
          {/* Avatar with unread badge */}
          <View style={{ position: "relative" }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={["#6C5DD3", "#8676FF"]}
                style={{
                  width: 52,
                  height: 52,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="h3"
                  weight="bold"
                  style={{ color: "#FFFFFF", fontSize: 20 }}
                >
                  {(group.name || "G")[0].toUpperCase()}
                </Typography>
              </LinearGradient>
            </View>
            {/* Unread badge */}
            {group.unreadCount > 0 && (
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: 22,
                    height: 22,
                    borderRadius: 11,
                    overflow: "hidden",
                  },
                  badgeStyle,
                ]}
              >
                <LinearGradient
                  colors={["#EF4444", "#F87171"]}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 6,
                  }}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: "#FFFFFF", fontSize: 11 }}
                  >
                    {group.unreadCount > 99 ? "99+" : group.unreadCount}
                  </Typography>
                </LinearGradient>
              </Animated.View>
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1, marginLeft: 14 }}>
            {/* Row 1: Name + Timestamp */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="body"
                weight={group.unreadCount > 0 ? "bold" : "semibold"}
                color="text"
                numberOfLines={1}
                style={{ flex: 1, fontSize: 15 }}
              >
                {group.name}
              </Typography>
              <Typography
                variant="caption"
                color={group.unreadCount > 0 ? "primary" : "textMuted"}
                style={{ fontSize: 11, marginLeft: 8 }}
              >
                {formatMessageTime(group.lastMessage?.createdAt)}
              </Typography>
            </View>

            {/* Row 2: Last message preview or career path */}
            {group.lastMessage ? (
              <Typography
                variant="caption"
                color={group.unreadCount > 0 ? "text" : "textMuted"}
                weight={group.unreadCount > 0 ? "medium" : "normal"}
                numberOfLines={1}
                style={{ marginTop: 4, fontSize: 13 }}
              >
                {group.lastMessage.senderName}: {group.lastMessage.content}
              </Typography>
            ) : (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: theme.colors.primary + "18",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  marginTop: 6,
                }}
              >
                <Typography
                  variant="caption"
                  color="primary"
                  weight="semibold"
                  style={{ fontSize: 11 }}
                >
                  {group.filterOptionName}
                </Typography>
              </View>
            )}

            {/* Row 3: Member count */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 6,
              }}
            >
              <Ionicons
                name="people-outline"
                size={12}
                color={theme.colors.textMuted}
              />
              <Typography
                variant="caption"
                color="textMuted"
                style={{ fontSize: 12 }}
              >
                {group.memberCount.toLocaleString()} members
              </Typography>
            </View>
          </View>

          {/* Chevron */}
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.textMuted}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ────────────────────────────────────────
export default function GroupsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useQuery(api.users.getCurrentUser);
  const myGroups = useQuery(api.groups.getMyGroups);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

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

  // Add button animation
  const addScale = useSharedValue(1);
  const addScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addScale.value }],
  }));

  const allFilters = useQuery(
    api.filter.getAllFilterOptions,
    sheetOpen ? {} : "skip",
  );
  const createGroupMutation = useMutation(
    api.groups.createGroup,
  );

  const snapPoints = useMemo(
    () => (selectingFilter ? ["80%"] : ["75%", "92%"]),
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

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!myGroups) return [];
    if (!searchQuery.trim()) return myGroups;
    const q = searchQuery.toLowerCase();
    return myGroups.filter((g: any) =>
      g.name.toLowerCase().includes(q),
    );
  }, [myGroups, searchQuery]);

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
    headerContainer: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    headerRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      justifyContent: "space-between" as const,
    },
    searchContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      height: 44,
      borderRadius: 24,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 14,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: t.colors.text,
      marginLeft: 8,
    },
    listContent: {
      paddingTop: 12,
      paddingBottom: insets.bottom + 90,
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
      backgroundColor: t.colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    // Sheet styles
    sheetBg: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    sheetHandle: {
      backgroundColor: t.colors.textMuted,
      width: 40,
      height: 4,
    },
    sheetInput: {
      backgroundColor: "rgba(255,255,255,0.06)",
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
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    createButton: {
      height: 50,
      borderRadius: 16,
      overflow: "hidden" as const,
    },
    createGradient: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
    },
    filterItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    filterSearchInput: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingLeft: 36,
      paddingRight: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: t.colors.text,
    },
    searchInputContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginHorizontal: 16,
      marginBottom: 8,
      position: "relative" as const,
    },
    searchIcon: {
      position: "absolute" as const,
      left: 12,
      zIndex: 1,
    },
    filterHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
  }));

  // Loading
  if (myGroups === undefined) {
    return (
      <View style={styles.container}>
        <Animated.View
          entering={FadeInDown.duration(300).delay(50)}
          style={styles.headerContainer}
        >
          <View style={styles.headerRow}>
            <View>
              <Typography
                variant="h1"
                weight="bold"
                color="text"
                style={{ fontSize: 28 }}
              >
                My Groups
              </Typography>
              <Typography
                variant="caption"
                color="textMuted"
                style={{ marginTop: 4 }}
              >
                Your career communities
              </Typography>
            </View>
          </View>
        </Animated.View>
        <View style={{ marginTop: 20 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(50)}
        style={styles.headerContainer}
      >
        <View style={styles.headerRow}>
          <View>
            <Typography
              variant="h1"
              weight="bold"
              color="text"
              style={{ fontSize: 28 }}
            >
              My Groups
            </Typography>
            <Typography
              variant="caption"
              color="textMuted"
              style={{ marginTop: 4 }}
            >
              Your career communities
            </Typography>
          </View>

          {/* Add button (admin only) */}
          {currentUser?.isAdmin && (
            <Pressable
              onPressIn={() => {
                addScale.value = withSpring(0.92, {
                  damping: 15,
                });
              }}
              onPressOut={() => {
                addScale.value = withSpring(1, {
                  damping: 15,
                });
              }}
              onPress={handleOpenSheet}
            >
              <Animated.View style={addScaleStyle}>
                <LinearGradient
                  colors={["#6C5DD3", "#8676FF"]}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </Animated.View>
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={16}
          color={theme.colors.textMuted}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <Typography
            variant="h3"
            weight="bold"
            color="text"
            align="center"
            style={{ marginTop: 20, fontSize: 20 }}
          >
            No Groups Yet
          </Typography>
          <Typography
            variant="body"
            color="textMuted"
            align="center"
            style={{
              marginTop: 8,
              maxWidth: 240,
              fontSize: 14,
            }}
          >
            Join career communities to connect with others
            on the same path
          </Typography>
          <Pressable
            onPress={() =>
              router.replace("/(tabs)/" as any)
            }
            style={{ marginTop: 24 }}
          >
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              style={{
                borderRadius: 24,
                paddingHorizontal: 32,
                paddingVertical: 14,
              }}
            >
              <Typography
                variant="body"
                weight="bold"
                style={{ color: "#FFFFFF" }}
              >
                Explore Careers
              </Typography>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      ) : (
        <FlatList
          data={filteredGroups}
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
              {/* Header - Fixed */}
              <View style={styles.filterHeader}>
                <Pressable
                  onPress={() => setSelectingFilter(false)}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={theme.colors.text}
                  />
                </Pressable>
                <Typography
                  variant="h4"
                  weight="bold"
                  color="text"
                >
                  Select Career Path
                </Typography>
              </View>

              {/* Search Input - Fixed (outside FlatList) */}
              <View style={styles.searchInputContainer}>
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

              {/* Filter List */}
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
                paddingHorizontal: 20,
                paddingBottom: insets.bottom + 90,
                gap: 16,
              }}
            >
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
                  color="textMuted"
                  style={{ marginBottom: 6 }}
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
                  color="textMuted"
                  style={{ marginBottom: 6 }}
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
                  color="textMuted"
                  style={{ marginBottom: 6 }}
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

              {/* Submit */}
              <View style={{ paddingTop: 8 }}>
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
            </BottomSheetScrollView>
          )}
        </BottomSheet>
      )}
    </View>
  );
}
