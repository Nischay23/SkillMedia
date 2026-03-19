import { useTheme } from "@/providers/ThemeProvider";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Typography } from "@/components/ui/Typography";

// Badge component for unread counts
const UnreadBadge = ({ count }: { count: number }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 300,
    });
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.badgeContainer, animatedStyle]}
    >
      <LinearGradient
        colors={["#FF6B6B", "#EE5A5A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          count > 9 && styles.badgeWide,
          count > 99 && styles.badgeExtraWide,
        ]}
      >
        <Typography
          variant="caption"
          style={styles.badgeText}
        >
          {displayCount}
        </Typography>
      </LinearGradient>
    </Animated.View>
  );
};

// Custom Tab Bar Icon with scale animation and glow dot
const TabIcon = ({
  name,
  color,
  focused,
  glowColor,
  badge = 0,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  glowColor: string;
  badge?: number;
}) => {
  const dotScale = useSharedValue(0);
  const dotOpacity = useSharedValue(0);
  const iconScale = useSharedValue(1);

  // Animate values in useEffect to avoid writing during render
  useEffect(() => {
    dotScale.value = withSpring(focused ? 1 : 0, {
      damping: 15,
      stiffness: 300,
    });
    dotOpacity.value = withTiming(focused ? 1 : 0, {
      duration: 200,
    });
    iconScale.value = withSpring(focused ? 1.15 : 1, {
      damping: 12,
      stiffness: 200,
    });
  }, [focused, dotScale, dotOpacity, iconScale]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <View style={styles.tabIconContainer}>
      <Animated.View style={iconAnimatedStyle}>
        <Ionicons name={name} size={24} color={color} />
        {badge > 0 && <UnreadBadge count={badge} />}
      </Animated.View>
      {/* Small dot indicator */}
      <Animated.View
        style={[
          styles.glowDot,
          {
            backgroundColor: glowColor,
            shadowColor: glowColor,
          },
          dotAnimatedStyle,
        ]}
      />
    </View>
  );
};

export default function TabLayout() {
  const { theme } = useTheme();

  // Query total unread messages across all groups
  const totalUnread = useQuery(api.groups.getTotalUnreadCount) ?? 0;

  // Haptic feedback on tab press
  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          bottom: 12,
          left: 16,
          right: 16,
          height: 60,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          borderRadius: 24,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "compass" : "compass-outline"}
              color={color}
              focused={focused}
              glowColor={theme.colors.primary}
            />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={
                focused ? "bookmark" : "bookmark-outline"
              }
              color={color}
              focused={focused}
              glowColor={theme.colors.primary}
            />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "people" : "people-outline"}
              color={color}
              focused={focused}
              glowColor={theme.colors.primary}
              badge={totalUnread}
            />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "heart" : "heart-outline"}
              color={color}
              focused={focused}
              glowColor={theme.colors.primary}
            />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Me",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              color={color}
              focused={focused}
              glowColor={theme.colors.primary}
            />
          ),
        }}
        listeners={{ tabPress: handleTabPress }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
    // Glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeContainer: {
    position: "absolute",
    top: -6,
    right: -10,
    zIndex: 10,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeWide: {
    minWidth: 22,
    paddingHorizontal: 5,
  },
  badgeExtraWide: {
    minWidth: 28,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});
