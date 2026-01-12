import Sidebar from "@/components/admin/desktop/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { Redirect, Slot } from "expo-router";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Redirect if not admin
  if (!currentUser?.isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0b0f19"
      />
      <Sidebar />
      <View style={styles.main}>
        <ToastProvider>
          <Slot />
        </ToastProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0b0f19",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b0f19",
  },
  main: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
});
