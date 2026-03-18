import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import InitialLayout from "@/components/InitialLayout";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import {
  ThemeProvider,
  useTheme,
} from "@/providers/ThemeProvider";
import { SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { useCallback, useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

// Inner component to access theme after provider is set up
function ThemedApp() {
  const { theme, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(
        theme.colors.background,
      );
      NavigationBar.setButtonStyleAsync(
        isDark ? "light" : "dark",
      );
    }
  }, [theme.colors.background, isDark]);

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
  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
    Roboto: require("../assets/fonts/SpaceMono-Regular.ttf"), // Using available font as fallback
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  return (
    <ClerkAndConvexProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </ClerkAndConvexProvider>
  );
}
