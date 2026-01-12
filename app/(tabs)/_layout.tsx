import { api } from "@/convex/_generated/api";
import { useTheme } from "@/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const { theme } = useTheme();
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
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          position: "absolute",
          elevation: 0,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingTop: theme.spacing.sm,
          height: 60,
          paddingBottom: theme.spacing.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ size, color }) => (
            <Ionicons
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bookmark"
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* Hide create tab for non-admin users - mobile app is READ-ONLY */}
      {isAdmin && (
        <Tabs.Screen
          name="create"
          options={{
            tabBarIcon: ({ size }) => (
              <Ionicons
                name="add-circle"
                size={size + 4}
                color={theme.colors.primary}
              />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="heart"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-circle"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
