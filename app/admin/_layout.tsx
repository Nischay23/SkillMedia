import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AdminLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn ? {} : "skip"
  );

  // Loading state
  if (
    !isLoaded ||
    (isSignedIn && currentUser === undefined)
  ) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  // Redirect if not admin
  if (!currentUser?.isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FF6B6B" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Admin Dashboard" }}
      />
      <Stack.Screen
        name="filters"
        options={{ title: "Manage Filters" }}
      />
    </Stack>
  );
}
