import { api } from "@/convex/_generated/api";
import { useTheme } from "@/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Custom Tab Bar Icon with Glow Dot
const TabIcon = ({
  name,
  color,
  size,
  focused,
  glowColor,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
  glowColor: string;
}) => {
  const dotScale = useSharedValue(focused ? 1 : 0);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  // Animate the glow dot
  dotScale.value = withSpring(focused ? 1 : 0, {
    damping: 15,
    stiffness: 300,
  });
  dotOpacity.value = withTiming(focused ? 1 : 0, { duration: 200 });

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value,
  }));

  return (
    <View style={styles.tabIconContainer}>
      <Ionicons name={name} size={size} color={color} />
      {/* Glowing dot indicator */}
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

// Custom Tab Bar Background with Blur
const TabBarBackground = ({ isDark }: { isDark: boolean }) => {
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return null;
};

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Only show create tab for admin users
  const isAdmin = currentUser?.isAdmin || false;

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarBackground: () => <TabBarBackground isDark={isDark} />,
        tabBarStyle: {
          backgroundColor: Platform.OS === "ios"
            ? isDark
              ? "rgba(24, 26, 32, 0.85)"
              : "rgba(255, 255, 255, 0.85)"
            : theme.colors.surface,
          borderTopWidth: 0,
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "transparent",
          position: "absolute",
          bottom: Math.max(insets.bottom, 16),
          left: 20,
          right: 20,
          elevation: 0,
          borderRadius: 30,
          height: 70,
          paddingTop: 10,
          paddingBottom: 10,
          ...(Platform.OS === "ios" && {
            shadowColor: isDark ? theme.colors.primary : "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: isDark ? 0.3 : 0.15,
            shadowRadius: 20,
          }),
          ...(Platform.OS === "android" && {
            elevation: 20,
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon
              name="home"
              size={size}
              color={color}
              focused={focused}
              glowColor={theme.colors.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="bookmark"
              size={size}
              color={color}
              focused={focused}
              glowColor={theme.colors.primary}
            />
          ),
        }}
      />
      {/* Hide create tab for non-admin users - mobile app is READ-ONLY */}
      {isAdmin && (
        <Tabs.Screen
          name="create"
          options={{
            tabBarIcon: ({ size, focused }) => (
              <TabIcon
                name="add-circle"
                size={size + 4}
                color={theme.colors.primary}
                focused={focused}
                glowColor={theme.colors.primary}
              />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="heart"
              size={size}
              color={color}
              focused={focused}
              glowColor={theme.colors.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="person-circle"
              size={size}
              color={color}
              focused={focused}
              glowColor={theme.colors.primary}
            />
          ),
        }}
      />
      {/* Hidden screens that shouldn't appear in tab bar */}
      <Tabs.Screen
        name="index_new"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
    // Glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});
