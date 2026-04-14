import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function Bookmarks() {
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const headerOpacity = useSharedValue(1);

  const bookmarkedPostsQuery = useQuery(
    api.savedContent.getBookmarkedContent,
  );
  const bookmarkedPosts = bookmarkedPostsQuery ?? [];

  // Disable entering animations after first data load
  useEffect(() => {
    if (isFirstLoad) {
      const timer = setTimeout(
        () => setIsFirstLoad(false),
        800,
      );
      return () => clearTimeout(timer);
    }
  }, [isFirstLoad]);

  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      alignItems: "center" as const,
    },
    gridContainer: {
      padding: theme.spacing.xs,
    },
    gridItem: {
      width: "33.33%" as const,
      padding: theme.spacing.xs,
    },
    gridImage: {
      width: "100%" as const,
      aspectRatio: 1,
      borderRadius: theme.borderRadius.sm,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingHorizontal: theme.spacing.xl,
    },
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    headerOpacity.value = withTiming(0.8, {
      duration: 200,
    });
    setTimeout(() => {
      setRefreshing(false);
      headerOpacity.value = withTiming(1, {
        duration: 200,
      });
    }, 1000);
  }, [headerOpacity]);

  if (bookmarkedPosts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={
            isDark ? "light-content" : "dark-content"
          }
        />
        <EmptyState
          type="no-saved"
          title="No Bookmarks Yet"
          description="Posts you bookmark will appear here for quick access."
        />
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

      <Animated.View
        style={[styles.header, headerAnimatedStyle]}
      >
        <Typography
          variant="h2"
          color="primary"
          weight="bold"
        >
          Bookmarks
        </Typography>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.gridContainer,
          { flexDirection: "row", flexWrap: "wrap" },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {bookmarkedPosts.map((item, index) => {
          if (!item) return null;

          const isFilterOption =
            item.itemType === "filterOption";
          const imageUrl = isFilterOption
            ? item.image
            : item.imageUrl;
          const titleText = isFilterOption
            ? item.name
            : item.title || item.content;

          return (
            <View key={item._id} style={styles.gridItem}>
              <AnimatedCard
                delay={Math.min(index * 100, 500)}
                useEnteringAnimation={isFirstLoad}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.sm,
                    overflow: "hidden",
                  }}
                >
                  {imageUrl ? (
                    <Image
                      source={imageUrl}
                      style={styles.gridImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View
                      style={[
                        styles.gridImage,
                        {
                          justifyContent: "center",
                          alignItems: "center",
                          padding: 8,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isFilterOption
                            ? "briefcase-outline"
                            : "document-text-outline"
                        }
                        size={24}
                        color={theme.colors.primary}
                      />
                      <Typography
                        variant="caption"
                        color="text"
                        numberOfLines={2}
                        style={{
                          textAlign: "center",
                          marginTop: 4,
                        }}
                      >
                        {titleText}
                      </Typography>
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedCard>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
