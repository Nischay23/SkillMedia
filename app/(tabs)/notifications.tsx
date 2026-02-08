import { Loader } from "@/components/Loader";
import Notification from "@/components/Notification";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Typography } from "@/components/ui/Typography";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  FlatList,
  View,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { useState, useCallback, useEffect } from "react";

export default function Notifications() {
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const headerOpacity = useSharedValue(1);

  const notifications = useQuery(
    api.notifications.getNotifications,
  );

  // Disable entering animations after first data load
  useEffect(() => {
    if (notifications !== undefined && isFirstLoad) {
      const timer = setTimeout(
        () => setIsFirstLoad(false),
        800,
      );
      return () => clearTimeout(timer);
    }
  }, [notifications, isFirstLoad]);

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
    listContainer: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing["6xl"],
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

  if (notifications === undefined) return <Loader />;
  if (notifications.length === 0) {
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
          type="no-notifications"
          title="No Notifications"
          description="When you get notifications, they'll show up here."
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
          Notifications
        </Typography>
      </Animated.View>

      <FlatList
        data={notifications}
        renderItem={({ item, index }) => (
          <AnimatedCard
            delay={Math.min(index * 100, 500)}
            useEnteringAnimation={isFirstLoad}
            style={{ marginBottom: theme.spacing.md }}
          >
            <Notification notification={item} />
          </AnimatedCard>
        )}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}
