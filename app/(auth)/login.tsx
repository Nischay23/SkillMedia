import { useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
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
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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
      marginTop: height * 0.12,
    },
    logoContainer: {
      width: 60,
      height: 60,
      borderRadius: 18,
      backgroundColor: t.colors.primary + "26",
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginBottom: t.spacing.lg,
    },
    illustrationContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingHorizontal: 40,
    },
    illustration: {
      width: width * 0.75,
      height: width * 0.75,
      maxHeight: 280,
    },
    loginSection: {
      width: "100%" as const,
      paddingHorizontal: t.spacing.lg,
      paddingBottom: 40 + insets.bottom,
      alignItems: "center" as const,
    },
    googleButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: "#FFFFFF",
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      borderRadius: 14,
      marginBottom: t.spacing.lg,
      width: "100%" as const,
      maxWidth: 300,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    googleIconContainer: {
      width: 24,
      height: 24,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: t.spacing.md,
    },
  }));

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* BRAND SECTION */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Ionicons
            name="leaf"
            size={32}
            color={theme.colors.primary}
          />
        </View>
        <Typography
          variant="h1"
          color="primary"
          weight="bold"
          style={{
            fontSize: 42,
            letterSpacing: 0.5,
            fontFamily: "JetBrainsMono-Medium",
          }}
        >
          SkillMedia
        </Typography>
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
      </View>

      {/* ILLUSTRATION */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require("../../assets/images/auth-bg-2.png")}
          style={styles.illustration}
          resizeMode="cover"
        />
      </View>

      {/* LOGIN SECTION */}
      <View style={styles.loginSection}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.9}
        >
          <View style={styles.googleIconContainer}>
            <Ionicons
              name="logo-google"
              size={20}
              color={theme.colors.surface}
            />
          </View>
          <Typography
            variant="body"
            weight="semibold"
            style={{ color: theme.colors.surface }}
          >
            Continue with Google
          </Typography>
        </TouchableOpacity>

        <Typography
          variant="caption"
          color="textMuted"
          align="center"
          style={{ maxWidth: 280 }}
        >
          By continuing, you agree to our Terms and Privacy
          Policy
        </Typography>
      </View>
    </View>
  );
}
