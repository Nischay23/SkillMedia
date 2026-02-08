import { useTheme } from "@/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable =
  Animated.createAnimatedComponent(Pressable);

const FAB_SIZE = 56;

interface FloatingActionButtonProps {
  onPress: () => void;
  visible?: boolean;
  isAdmin?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
}

export default function FloatingActionButton({
  onPress,
  visible = true,
  isAdmin = false,
  icon = "add",
  size = FAB_SIZE,
}: FloatingActionButtonProps) {
  const { theme, isDark } = useTheme();

  const scale = useSharedValue(1);
  const opacity = useSharedValue(
    visible && isAdmin ? 1 : 0,
  );
  const translateY = useSharedValue(
    visible && isAdmin ? 0 : 20,
  );

  // Show/hide animation
  opacity.value = withTiming(visible && isAdmin ? 1 : 0, {
    duration: 200,
  });
  translateY.value = withSpring(
    visible && isAdmin ? 0 : 20,
    {
      damping: 15,
      stiffness: 200,
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 400,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 300,
    });
  };

  // Don't render at all if not admin
  if (!isAdmin) return null;

  const gradientStart = isDark
    ? (theme.colors.accentGradientStart ??
      theme.colors.primary)
    : theme.colors.primary;
  const gradientEnd = isDark
    ? (theme.colors.accentGradientEnd ??
      theme.colors.primaryLight)
    : theme.colors.primaryLight;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Ionicons name={icon} size={28} color="#FFFFFF" />
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    right: 16,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#6C5DD3",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
  },
});
