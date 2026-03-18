import { useTheme } from "@/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Custom Tab Bar Icon with scale animation and glow dot
const TabIcon = ({
  name,
  color,
  focused,
  glowColor,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  glowColor: string;
}) => {
  const dotScale = useSharedValue(focused ? 1 : 0);
  const dotOpacity = useSharedValue(focused ? 1 : 0);
  const iconScale = useSharedValue(focused ? 1.1 : 1);

  // Animate the glow dot
  dotScale.value = withSpring(focused ? 1 : 0, {
    damping: 15,
    stiffness: 300,
  });
  dotOpacity.value = withTiming(focused ? 1 : 0, {
    duration: 200,
  });

  // Animate icon scale
  iconScale.value = withSpring(focused ? 1.15 : 1, {
    damping: 12,
    stiffness: 200,
  });

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
  const { theme, isDark } = useTheme();

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
});
