// app/(auth)/login.tsx — Premium animated login screen
import { useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  View,
  Image,
  Pressable,
  Dimensions,
  StatusBar,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";
import { Typography } from "@/components/ui/Typography";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Logo spring bounce on mount
  const logoScale = useSharedValue(0);
  const logoBounce = useSharedValue(0);

  // Button scale for press
  const btnScale = useSharedValue(1);

  // Pulse ring animation
  const pulseOpacity = useSharedValue(0.4);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Logo springy bounce entrance
    logoScale.value = withSpring(1, {
      damping: 8,
      stiffness: 120,
      mass: 0.8,
    });

    // Subtle floating pulse ring
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1400 }),
        withTiming(0.3, { duration: 1400 }),
      ),
      -1,
      true,
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 1400 }),
        withTiming(1.0, { duration: 1400 }),
      ),
      -1,
      true,
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const btnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } =
        await startSSOFlow({
          strategy: "oauth_google",
        });

      if (setActive && createdSessionId) {
        setActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("OAuth error:", error);
    }
  };

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    brandSection: {
      alignItems: "center" as const,
      marginTop: insets.top + height * 0.06,
    },
    logoWrapper: {
      width: 100,
      height: 100,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: t.spacing.lg,
    },
    pulseRing: {
      position: "absolute" as const,
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: t.colors.primary,
    },
    logoContainer: {
      width: 76,
      height: 76,
      borderRadius: 22,
      overflow: "hidden" as const,
    },
    logoGradient: {
      width: 76,
      height: 76,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    illustrationContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingHorizontal: 40,
    },
    illustration: {
      width: width * 0.78,
      height: width * 0.78,
      maxHeight: 300,
    },
    loginSection: {
      width: "100%" as const,
      paddingHorizontal: 24,
      paddingBottom: insets.bottom + 36,
      alignItems: "center" as const,
    },
    googleButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: "#FFFFFF",
      height: 52,
      paddingHorizontal: 28,
      borderRadius: 14,
      marginBottom: t.spacing.lg,
      width: "100%" as const,
      maxWidth: 320,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 6,
    },
    googleIconContainer: {
      width: 24,
      height: 24,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: 10,
    },
  }));

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* BRAND SECTION */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(50)}
        style={styles.brandSection}
      >
        <Animated.View
          style={[styles.logoWrapper, logoAnimatedStyle]}
        >
          {/* Pulse ring */}
          <Animated.View style={[styles.pulseRing, pulseStyle]} />

          {/* Logo gradient */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#6C5DD3", "#8676FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="compass" size={38} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <Typography
            variant="h1"
            color="primary"
            weight="bold"
            style={{
              fontSize: 40,
              letterSpacing: 0.5,
              fontFamily: "JetBrainsMono-Medium",
            }}
          >
            SkillMedia
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <Typography
            variant="body"
            color="textMuted"
            style={{
              letterSpacing: 1,
              marginTop: theme.spacing.xs,
            }}
          >
            Career Path & Field Guide
          </Typography>
        </Animated.View>
      </Animated.View>

      {/* ILLUSTRATION */}
      <Animated.View
        entering={FadeIn.duration(600).delay(300)}
        style={styles.illustrationContainer}
      >
        <Image
          source={require("../../assets/images/auth-bg-2.png")}
          style={styles.illustration}
          resizeMode="cover"
        />
      </Animated.View>

      {/* LOGIN SECTION */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(400)}
        style={styles.loginSection}
      >
        {/* Google Sign-In button */}
        <Animated.View style={btnAnimatedStyle}>
          <Pressable
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            onPressIn={() => {
              btnScale.value = withSpring(0.96, {
                damping: 15,
                stiffness: 300,
              });
            }}
            onPressOut={() => {
              btnScale.value = withSpring(1, {
                damping: 15,
                stiffness: 300,
              });
            }}
          >
            <View style={styles.googleIconContainer}>
              <Ionicons
                name="logo-google"
                size={20}
                color="#EA4335"
              />
            </View>
            <Typography
              variant="body"
              weight="semibold"
              style={{ color: "#1a1a1a" }}
            >
              Continue with Google
            </Typography>
          </Pressable>
        </Animated.View>

        <Typography
          variant="caption"
          color="textMuted"
          align="center"
          style={{ maxWidth: 280 }}
        >
          By continuing, you agree to our Terms and Privacy
          Policy
        </Typography>
      </Animated.View>
    </View>
  );
}
