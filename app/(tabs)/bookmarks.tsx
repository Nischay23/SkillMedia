import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Typography } from "@/components/ui/Typography";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { 
  View, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useTheme, useThemedStyles } from "@/providers/ThemeProvider";
import { useState, useCallback } from "react";

export default function Bookmarks() {
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const headerOpacity = useSharedValue(1);
  
  // For now, use dummy data since bookmarks API doesn't exist yet
  // const bookmarkedPosts = useQuery(api.bookmarks.getBookmarkedPosts);
  const bookmarkedPosts: any[] = []; // Empty array for now

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
      alignItems: 'center' as const,
    },
    gridContainer: {
      padding: theme.spacing.xs,
    },
    gridItem: {
      width: '33.33%' as const,
      padding: theme.spacing.xs,
    },
    gridImage: {
      width: '100%' as const,
      aspectRatio: 1,
      borderRadius: theme.borderRadius.sm,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: theme.spacing.xl,
    },
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    headerOpacity.value = withTiming(0.8, { duration: 200 });
    setTimeout(() => {
      setRefreshing(false);
      headerOpacity.value = withTiming(1, { duration: 200 });
    }, 1000);
  }, [headerOpacity]);

  if (bookmarkedPosts.length === 0) return <NoBookmarksFound />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? "light-content" : "dark-content"} />
      
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Typography variant="h2" color="primary" weight="bold">
          Bookmarks
        </Typography>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.gridContainer, { flexDirection: 'row', flexWrap: 'wrap' }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {bookmarkedPosts.map((post, index) => {
          if (!post) return null;
          return (
            <View key={post._id} style={styles.gridItem}>
              <AnimatedCard delay={index * 50}>
                <TouchableOpacity>
                  <Image
                    source={post.imageUrl}
                    style={styles.gridImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              </AnimatedCard>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function NoBookmarksFound() {
  const { theme } = useTheme();
  
  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: theme.spacing.xl,
    },
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <Ionicons name="bookmark-outline" size={48} color={theme.colors.primary} />
        <Typography variant="h4" color="text" style={{ marginTop: theme.spacing.md }}>
          No bookmarked posts yet
        </Typography>
        <Typography variant="body" color="textSecondary" align="center" style={{ marginTop: theme.spacing.sm }}>
          Posts you bookmark will appear here
        </Typography>
      </View>
    </SafeAreaView>
  );
}
