import InitialLayout from "@/components/InitialLayout";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import {
  ThemeProvider,
  useTheme,
} from "@/providers/ThemeProvider";
import * as NavigationBar from "expo-navigation-bar";
import { SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

// Inner component to access theme after provider is set up
function ThemedApp() {
  const { theme, isDark, fontsLoaded } = useTheme();

  useEffect(() => {
    if (Platform.OS === "android" && fontsLoaded) {
      NavigationBar.setBackgroundColorAsync(
        theme.colors.background
      );
      NavigationBar.setButtonStyleAsync(
        isDark ? "light" : "dark"
      );
    }
  }, [theme.colors.background, isDark, fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
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
  );
}

export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </ClerkAndConvexProvider>
  );
}
