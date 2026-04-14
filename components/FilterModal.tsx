// app/components/FilterModal.tsx
/**
 * Modern Filter Wizard Bottom Sheet
 * Step-by-step filter selection with:
 * - ProgressBar showing current level
 * - SelectableCardGrid for option selection
 * - Auto-advance on selection
 * - Slide transitions between levels
 * - @gorhom/bottom-sheet with snap points
 */
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { FilterOption } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useConvex, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProgressBar from "@/components/ui/ProgressBar";
import SelectableCardGrid from "@/components/ui/SelectableCardGrid";
import { Typography } from "@/components/ui/Typography";
import {
  ScreenPadding,
  SpacingValues,
} from "@/constants/theme";

const MAX_FILTER_LEVELS = 6;

const LEVEL_TITLES = [
  "Choose Your Qualification",
  "Select Category",
  "Pick a Sector",
  "Choose Sub-Sector",
  "Select Branch",
  "Final Selection",
];

const LEVEL_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "school-outline",
  "grid-outline",
  "briefcase-outline",
  "layers-outline",
  "git-branch-outline",
  "flag-outline",
];

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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const convex = useConvex();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["65%", "95%"], []);

  const [path, setPath] =
    useState<Id<"FilterOption">[]>(initialSelected);
  const [direction, setDirection] = useState<
    "forward" | "backward"
  >("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  // ── Caches ────────────────────────────────────────
  const childrenByParent = useRef<
    Map<string | undefined, FilterOption[]>
  >(new Map());
  const optionById = useRef<Map<string, FilterOption>>(
    new Map(),
  );
  const [childrenCache, setChildrenCache] = useState<
    FilterOption[]
  >([]);

  // ── Convex queries ────────────────────────────────
  const parentId: Id<"FilterOption"> | undefined =
    path.length > 0 ? path[path.length - 1] : undefined;

  const children = useQuery(
    api.filter.getFilterChildren,
    parentId ? { parentId, limit: 200 } : { limit: 200 },
  );

  const breadcrumbOptions = useQuery(
    api.filter.getFilterNamesByIds,
    { filterIds: path },
  );

  // Sync children → cache
  useEffect(() => {
    if (children) {
      const list = children as FilterOption[];
      setChildrenCache(list);
      childrenByParent.current.set(
        parentId as unknown as string | undefined,
        list,
      );
      for (const c of list) {
        optionById.current.set(
          c._id as unknown as string,
          c,
        );
      }
    }
  }, [children, parentId]);

  // Sync breadcrumb options → cache
  useEffect(() => {
    if (breadcrumbOptions) {
      for (const opt of breadcrumbOptions) {
        if (opt) {
          optionById.current.set(
            opt._id as unknown as string,
            opt as unknown as FilterOption,
          );
        }
      }
    }
  }, [breadcrumbOptions]);

  // Open/close bottom sheet when isVisible changes
  useEffect(() => {
    if (isVisible) {
      setPath(initialSelected);
      setDirection("forward");
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]); // Only run when isVisible changes

  // Prefetch first child's children
  useEffect(() => {
    let cancelled = false;
    const prefetch = async () => {
      try {
        const first = childrenToShow?.[0];
        if (!first) return;
        const key = first._id as unknown as string;
        if (childrenByParent.current.has(key)) return;
        const next = await convex.query(
          api.filter.getFilterChildren,
          {
            parentId: first._id as Id<"FilterOption">,
            limit: 200,
          },
        );
        if (cancelled) return;
        childrenByParent.current.set(
          key,
          next as FilterOption[],
        );
      } catch {
        /* ignore prefetch errors */
      }
    };
    prefetch();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, convex]);

  // ── Derived data ──────────────────────────────────
  const childrenToShow = (children ??
    childrenByParent.current.get(
      parentId as unknown as string | undefined,
    ) ??
    childrenCache) as FilterOption[];

  const breadcrumbLabels: string[] = path.map(
    (id) =>
      optionById.current.get(id as unknown as string)
        ?.name ??
      breadcrumbOptions?.find(
        (o) =>
          o &&
          (o._id as unknown as string) ===
            (id as unknown as string),
      )?.name ??
      "…",
  );

  const currentLevel = path.length; // 0-indexed internally, displayed as 1-indexed
  const isLastLevel =
    children !== undefined && childrenToShow.length === 0;
  const currentTitle =
    LEVEL_TITLES[
      Math.min(currentLevel, LEVEL_TITLES.length - 1)
    ];

  // ── Handlers ──────────────────────────────────────
  const handleSelect = useCallback(
    (id: string) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setDirection("forward");

      const item =
        optionById.current.get(id) ??
        childrenToShow.find(
          (c) => (c._id as unknown as string) === id,
        );

      if (item) {
        optionById.current.set(id, item);
      }

      // Auto-advance after short delay
      setTimeout(() => {
        setPath((prev) => [
          ...prev,
          id as unknown as Id<"FilterOption">,
        ]);
        setIsAnimating(false);
      }, 300);
    },
    [isAnimating, childrenToShow],
  );

  const handleBreadcrumbJump = useCallback(
    (index: number) => {
      if (isAnimating) return;
      // Tapping crumb at index → keep path[0..index], show children of that item
      const targetLength = index + 1;
      if (targetLength >= path.length) return; // already at or past this level
      setIsAnimating(true);
      setDirection("backward");
      setTimeout(() => {
        setPath((prev) => prev.slice(0, targetLength));
        setIsAnimating(false);
      }, 50);
    },
    [isAnimating, path.length],
  );

  const handleApply = useCallback(() => {
    onApply(path);
  }, [onApply, path]);

  // ── Map FilterOptions → CardOption[] ──────────────
  const gridOptions = childrenToShow.map((opt) => ({
    id: opt._id as unknown as string,
    title: opt.name,
    description: opt.description,
    icon: LEVEL_ICONS[
      Math.min(currentLevel, LEVEL_ICONS.length - 1)
    ],
  }));

  // ── Breadcrumb scroll ref ─────────────────────────
  const breadcrumbScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (path.length > 0) {
      const timer = setTimeout(() => {
        breadcrumbScrollRef.current?.scrollToEnd({
          animated: true,
        });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [path.length]);

  // ── Styles ────────────────────────────────────────
  const styles = useThemedStyles((t) => ({
    sheetBackground: {
      backgroundColor: t.colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    handleIndicator: {
      backgroundColor: t.colors.textMuted,
      width: 40,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: insets.bottom + 12,
    },
    topSection: {
      paddingHorizontal: ScreenPadding.vertical,
      paddingBottom: SpacingValues.sm,
    },
    breadcrumbRow: {
      height: SpacingValues.xl,
      marginTop: SpacingValues.xs,
    },
    breadcrumbScroll: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: SpacingValues.base,
      gap: 6,
    },
    breadcrumbCrumb: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      height: 28,
      paddingHorizontal: SpacingValues.sm,
      borderRadius: 6,
    },
    breadcrumbCrumbPressable: {
      backgroundColor: t.colors.surface + "80",
    },
    titleRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      marginTop: SpacingValues.md,
      marginBottom: SpacingValues.xs,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.surfaceLight,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    middleSection: {
      flex: 1,
      paddingHorizontal: ScreenPadding.vertical,
      overflow: "hidden" as const,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: 40,
    },
    applyButton: {
      padding: 4,
      marginRight: 8,
    },
  }));

  // ── Handle sheet close ────────────────────────────
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onCancel();
      }
    },
    [onCancel],
  );

  // ── Render ────────────────────────────────────────
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* ── Top section: Progress + Title ── */}
        <View style={styles.topSection}>
          <ProgressBar
            currentStep={Math.max(currentLevel, 1)}
            totalSteps={MAX_FILTER_LEVELS}
            labels={breadcrumbLabels}
          />

          {/* ── Breadcrumb navigation ── */}
          {breadcrumbLabels.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.breadcrumbRow}
            >
              <ScrollView
                ref={breadcrumbScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={
                  styles.breadcrumbScroll
                }
              >
                {breadcrumbLabels.map((label, index) => {
                  const isLast =
                    index === breadcrumbLabels.length - 1;
                  return (
                    <React.Fragment key={`bc-${index}`}>
                      {index > 0 && (
                        <Ionicons
                          name="chevron-forward"
                          size={12}
                          color={theme.colors.textMuted}
                        />
                      )}
                      <Pressable
                        onPress={() =>
                          handleBreadcrumbJump(index)
                        }
                        disabled={isLast}
                        style={[
                          styles.breadcrumbCrumb,
                          !isLast &&
                            styles.breadcrumbCrumbPressable,
                        ]}
                      >
                        <Typography
                          variant="caption"
                          weight={
                            isLast ? "semibold" : "normal"
                          }
                          style={{
                            color: isLast
                              ? theme.colors.primary
                              : theme.colors.textMuted,
                            fontSize:
                              theme.typography.sizes
                                .bodySmall,
                          }}
                        >
                          {label}
                        </Typography>
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          <View style={styles.titleRow}>
            <Typography
              variant="h3"
              weight="bold"
              style={{
                flex: 1,
                marginRight: SpacingValues.md,
              }}
            >
              {isLastLevel
                ? "You've reached the end!"
                : currentTitle}
            </Typography>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(
                  Haptics.ImpactFeedbackStyle.Medium,
                );
                handleApply();
              }}
              style={styles.applyButton}
            >
              <Ionicons
                name="checkmark-circle"
                size={26}
                color={theme.colors.primary}
              />
            </Pressable>

            <Pressable
              onPress={onCancel}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Middle section: Grid / Empty ── */}
        <BottomSheetScrollView
          style={styles.middleSection}
          showsVerticalScrollIndicator={false}
        >
          {isLastLevel ? (
            <Animated.View
              entering={FadeIn.duration(250)}
              style={styles.emptyContainer}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={56}
                color={theme.colors.primary}
              />
              <Typography
                variant="body"
                color="textSecondary"
                align="center"
                style={{
                  marginTop: SpacingValues.base,
                  paddingHorizontal: SpacingValues.xl,
                }}
              >
                Tap ✓ to apply your filters
              </Typography>
            </Animated.View>
          ) : (
            <Animated.View
              key={currentLevel}
              entering={
                direction === "forward"
                  ? SlideInRight.duration(250)
                  : SlideInLeft.duration(250)
              }
            >
              <SelectableCardGrid
                options={gridOptions}
                selectedId={null}
                onSelect={handleSelect}
                columns={2}
              />
            </Animated.View>
          )}
        </BottomSheetScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}
