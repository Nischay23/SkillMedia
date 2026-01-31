// app/components/FilterModal.tsx
/**
 * Modern Filter Wizard Modal
 * A step-by-step filter selection experience with:
 * - Selectable cards in a 2-column grid
 * - Progress bar showing current level
 * - Animated slide transitions
 * - Bottom sheet style with backdrop blur
 */
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "@/providers/ThemeProvider";
import { FilterOption } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useConvex, useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

// Maximum levels in the filter hierarchy (adjust based on your data)
const MAX_FILTER_LEVELS = 6;

interface FilterModalProps {
  initialSelected: Id<"FilterOption">[];
  onApply: (filters: Id<"FilterOption">[]) => void;
  onCancel: () => void;
  isVisible: boolean;
}

// Animated selectable card component
const SelectableCard = React.memo(
  ({
    item,
    isSelected,
    onSelect,
    index,
  }: {
    item: FilterOption;
    isSelected: boolean;
    onSelect: (item: FilterOption) => void;
    index: number;
  }) => {
    const { theme, isDark } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.96);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    return (
      <Animated.View
        entering={FadeIn.delay(index * 50).duration(300)}
        style={[
          {
            width: CARD_WIDTH,
            marginBottom: CARD_GAP,
          },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          onPress={() => onSelect(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={[
            styles.card,
            {
              backgroundColor: isSelected
                ? theme.colors.primary
                : isDark
                  ? theme.colors.surfaceHighlight
                  : theme.colors.surface,
              borderColor: isSelected
                ? theme.colors.primary
                : isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : theme.colors.border,
              ...(Platform.OS === "ios" &&
                !isDark && {
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isSelected ? 0.3 : 0.1,
                  shadowRadius: 8,
                }),
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Text
              style={[
                styles.cardText,
                {
                  color: isSelected
                    ? "#FFFFFF"
                    : theme.colors.textPrimary,
                  fontFamily:
                    theme.typography.fontFamily.semibold,
                },
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>

            {/* Checkmark for selected state */}
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#FFFFFF"
                />
              </View>
            )}
          </View>

          {/* Chevron indicator */}
          {!isSelected && (
            <View style={styles.chevronContainer}>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.textSecondary}
              />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

// Progress bar component
const ProgressBar = ({
  currentLevel,
  maxLevels,
}: {
  currentLevel: number;
  maxLevels: number;
}) => {
  const { theme, isDark } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(
      (currentLevel + 1) / maxLevels,
      {
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      },
    );
  }, [currentLevel, maxLevels]);

  const animatedWidth = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(108, 93, 211, 0.1)",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.colors.primary,
            },
            animatedWidth,
          ]}
        />
      </View>
      <Text
        style={[
          styles.progressText,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.regular,
          },
        ]}
      >
        {currentLevel + 1} / {maxLevels}
      </Text>
    </View>
  );
};

// Level titles based on filter hierarchy
const LEVEL_TITLES = [
  "What is your qualification?",
  "Choose your field of study",
  "Select your specialization",
  "Pick your focus area",
  "Narrow down further",
  "Final selection",
];

export default function FilterModal({
  initialSelected,
  onApply,
  onCancel,
  isVisible,
}: FilterModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [path, setPath] =
    useState<Id<"FilterOption">[]>(initialSelected);
  const [direction, setDirection] = useState<
    "forward" | "backward"
  >("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  const isInitialRender = useRef(true);
  const convex = useConvex();

  // Current parent ID for fetching children
  const parentId: Id<"FilterOption"> | undefined =
    path.length > 0 ? path[path.length - 1] : undefined;

  // Fetch children for the current level
  const children = useQuery(
    api.filter.getFilterChildren,
    parentId ? { parentId, limit: 200 } : { limit: 200 },
  );

  // Fetch names for the breadcrumb path
  const breadcrumbOptions = useQuery(
    api.filter.getFilterNamesByIds,
    {
      filterIds: path,
    },
  );

  // Cache for UI stability
  const [childrenCache, setChildrenCache] = useState<
    FilterOption[]
  >([]);
  const [breadcrumbCache, setBreadcrumbCache] =
    useState<string>("");

  // In-memory caches
  const childrenByParentRef = useRef<
    Map<string | undefined, FilterOption[]>
  >(new Map());
  const optionByIdRef = useRef<Map<string, FilterOption>>(
    new Map(),
  );

  useEffect(() => {
    if (children) {
      const list = children as FilterOption[];
      setChildrenCache(list);
      childrenByParentRef.current.set(
        parentId as unknown as string | undefined,
        list,
      );
      for (const child of list) {
        optionByIdRef.current.set(
          child._id as unknown as string,
          child,
        );
      }
    }
  }, [children, parentId]);

  useEffect(() => {
    if (breadcrumbOptions) {
      const names = breadcrumbOptions
        .filter((opt) => opt)
        .map((opt) => opt!.name)
        .join(" > ");
      setBreadcrumbCache(names);
      for (const opt of breadcrumbOptions) {
        if (opt) {
          optionByIdRef.current.set(
            opt._id as unknown as string,
            opt as unknown as FilterOption,
          );
        }
      }
    }
  }, [breadcrumbOptions]);

  // Reset path when modal opens
  useEffect(() => {
    if (isVisible && isInitialRender.current) {
      setPath(initialSelected);
      isInitialRender.current = false;
    } else if (!isVisible) {
      isInitialRender.current = true;
    }
  }, [isVisible, initialSelected]);

  // Handle drilling down with animation
  const handleOptionSelect = useCallback(
    (item: FilterOption) => {
      if (isAnimating) return;

      setIsAnimating(true);
      setDirection("forward");

      // Small delay for animation coordination
      setTimeout(() => {
        optionByIdRef.current.set(
          item._id as unknown as string,
          item,
        );
        setBreadcrumbCache((prev) =>
          prev ? `${prev} > ${item.name}` : item.name,
        );
        setPath((prevPath) => [
          ...prevPath,
          item._id as Id<"FilterOption">,
        ]);
        setIsAnimating(false);
      }, 50);
    },
    [isAnimating],
  );

  // Handle going back with animation
  const handleBack = useCallback(() => {
    if (isAnimating || path.length === 0) return;

    setIsAnimating(true);
    setDirection("backward");

    setTimeout(() => {
      setPath((prevPath) => {
        const next = prevPath.slice(
          0,
          Math.max(0, prevPath.length - 1),
        );
        const names = next
          .map(
            (id) =>
              optionByIdRef.current.get(
                id as unknown as string,
              )?.name,
          )
          .filter(Boolean) as string[];
        setBreadcrumbCache(names.join(" > "));
        return next;
      });
      setIsAnimating(false);
    }, 50);
  }, [isAnimating, path.length]);

  const handleClearAll = useCallback(() => {
    setDirection("backward");
    setPath([]);
    setBreadcrumbCache("");
  }, []);

  // Get current level title
  const currentTitle =
    LEVEL_TITLES[
      Math.min(path.length, LEVEL_TITLES.length - 1)
    ];

  // Get breadcrumb display
  const localNames = path
    .map(
      (id) =>
        optionByIdRef.current.get(id as unknown as string)
          ?.name,
    )
    .filter(Boolean) as string[];
  const breadcrumbDisplay =
    path.length === 0
      ? ""
      : localNames.length === path.length
        ? localNames.join(" > ")
        : breadcrumbCache;

  const childrenToShow = (children ??
    childrenByParentRef.current.get(
      parentId as unknown as string | undefined,
    ) ??
    childrenCache) as FilterOption[];

  // Prefetch next level
  useEffect(() => {
    let cancelled = false;
    const prefetch = async () => {
      try {
        const first = childrenToShow?.[0];
        if (!first) return;
        const key = first._id as unknown as string;
        if (childrenByParentRef.current.has(key)) return;
        const next = await convex.query(
          api.filter.getFilterChildren,
          {
            parentId: first._id as Id<"FilterOption">,
            limit: 200,
          },
        );
        if (cancelled) return;
        childrenByParentRef.current.set(
          key,
          next as FilterOption[],
        );
      } catch (e) {
        // ignore prefetch errors
      }
    };
    prefetch();
    return () => {
      cancelled = true;
    };
  }, [childrenToShow, convex]);

  // Render grid of cards
  const renderGrid = () => {
    if (
      children !== undefined &&
      childrenToShow.length === 0
    ) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="checkmark-circle-outline"
            size={64}
            color={theme.colors.primary}
          />
          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily:
                  theme.typography.fontFamily.semibold,
              },
            ]}
          >
            You've reached the end!
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: theme.colors.textSecondary,
                fontFamily:
                  theme.typography.fontFamily.regular,
              },
            ]}
          >
            Tap "Apply Filters" to see matching content
          </Text>
        </View>
      );
    }

    return (
      <Animated.View
        key={path.length}
        entering={
          direction === "forward"
            ? SlideInRight.duration(300)
            : SlideInLeft.duration(300)
        }
        exiting={
          direction === "forward"
            ? SlideOutLeft.duration(300)
            : SlideOutRight.duration(300)
        }
        style={styles.gridContainer}
      >
        <View style={styles.grid}>
          {childrenToShow.map((item, index) => (
            <SelectableCard
              key={item._id as string}
              item={item}
              isSelected={false}
              onSelect={handleOptionSelect}
              index={index}
            />
          ))}
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Backdrop with blur */}
      <View style={styles.backdrop}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={30}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.7)"
                  : "rgba(0, 0, 0, 0.5)",
              },
            ]}
          />
        )}

        {/* Dismiss on backdrop tap */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
        />

        {/* Bottom Sheet Container */}
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: insets.bottom + 16,
              borderTopColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : theme.colors.border,
            },
          ]}
        >
          {/* Handle indicator */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.3)"
                    : "rgba(0, 0, 0, 0.2)",
                },
              ]}
            />
          </View>

          {/* Progress Bar */}
          <ProgressBar
            currentLevel={path.length}
            maxLevels={MAX_FILTER_LEVELS}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily:
                      theme.typography.fontFamily.bold,
                  },
                ]}
              >
                {currentTitle}
              </Text>
              {breadcrumbDisplay ? (
                <Text
                  style={[
                    styles.breadcrumb,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily:
                        theme.typography.fontFamily.regular,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {breadcrumbDisplay}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={onCancel}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                },
              ]}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Content Area - Grid of Cards */}
          <View style={styles.contentArea}>
            {renderGrid()}
          </View>

          {/* Action Buttons */}
          <View
            style={[
              styles.buttonContainer,
              {
                borderTopColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : theme.colors.border,
              },
            ]}
          >
            {/* Back Button */}
            <TouchableOpacity
              onPress={handleBack}
              disabled={path.length === 0}
              style={[
                styles.button,
                styles.buttonSecondary,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : theme.colors.surfaceLight,
                  opacity: path.length === 0 ? 0.5 : 1,
                },
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily:
                      theme.typography.fontFamily.semibold,
                  },
                ]}
              >
                Back
              </Text>
            </TouchableOpacity>

            {/* Clear Button */}
            <TouchableOpacity
              onPress={handleClearAll}
              style={[
                styles.button,
                styles.buttonSecondary,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 107, 107, 0.2)"
                    : "rgba(239, 68, 68, 0.1)",
                },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={isDark ? "#FF6B6B" : "#EF4444"}
              />
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: isDark ? "#FF6B6B" : "#EF4444",
                    fontFamily:
                      theme.typography.fontFamily.semibold,
                  },
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={() => onApply(path)}
              style={[
                styles.button,
                styles.buttonPrimary,
                {
                  backgroundColor: theme.colors.primary,
                  flex: 1.5,
                },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={18}
                color="#FFFFFF"
              />
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: "#FFFFFF",
                    fontFamily:
                      theme.typography.fontFamily.semibold,
                  },
                ]}
              >
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    minWidth: 36,
    textAlign: "right",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 4,
  },
  breadcrumb: {
    fontSize: 14,
    opacity: 0.8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  gridContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minHeight: 80,
    justifyContent: "center",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardText: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  chevronContainer: {
    position: "absolute",
    right: 12,
    top: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  buttonSecondary: {},
  buttonPrimary: {},
  buttonText: {
    fontSize: 15,
  },
});
