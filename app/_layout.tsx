import InitialLayout from "@/components/InitialLayout";
import { ToastProvider } from "@/components/ui/Toast";
import { useDeepLinking } from "@/hooks/useDeepLinking";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import { PushNotificationProvider } from "@/providers/PushNotificationProvider";
import {
  ThemeProvider,
  useTheme,
} from "@/providers/ThemeProvider";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as NavigationBar from "expo-navigation-bar";
import { SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@clerk/clerk-expo";

SplashScreen.preventAutoHideAsync();

// Inner component to access theme after provider is set up
function ThemedApp() {
  const { theme, isDark, fontsLoaded } = useTheme();

  // Handle deep linking
  useDeepLinking();

  useEffect(() => {
    if (Platform.OS === "android" && fontsLoaded) {
      NavigationBar.setBackgroundColorAsync(
        theme.colors.background,
      );
      NavigationBar.setButtonStyleAsync(
        isDark ? "light" : "dark",
      );
    }
  }, [theme.colors.background, isDark, fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <BottomSheetModalProvider>
      <ToastProvider>
        <PushNotificationProvider>
          <SafeAreaProvider>
            <SafeAreaView
              style={{
                flex: 1,
                backgroundColor: theme.colors.background,
              }}
            >
              <InitialLayout />
            </SafeAreaView>
            <StatusBar
              style={isDark ? "light" : "dark"}
              translucent
              backgroundColor="transparent"
            />
          </SafeAreaProvider>
        </PushNotificationProvider>
      </ToastProvider>
    </BottomSheetModalProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ClerkAndConvexProvider>
          <ThemeProvider>
            <ThemedApp />
          </ThemeProvider>
        </ClerkAndConvexProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
