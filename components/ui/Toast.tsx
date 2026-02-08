/**
 * Toast notification system
 * ─────────────────────────────────────────────
 * Provides a global `showToast(message, type)` via React context.
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast("Career path saved!", "success");
 *
 * Wrap your app in <ToastProvider>{children}</ToastProvider>.
 */
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { Typography } from "@/components/ui/Typography";
import { useTheme } from "@/providers/ThemeProvider";

// ── Types ────────────────────────────────────────────────
export type ToastType = "success" | "error" | "info";

interface ToastRecord {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  /** New recommended API */
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number,
  ) => void;
  /** Legacy-compatible API (title → message) */
  toast: (input: {
    title: string;
    description?: string;
    variant?: "default" | "success" | "destructive";
    durationMs?: number;
  }) => void;
}

// ── Icon / colour config ─────────────────────────────────
const CONFIG: Record<
  ToastType,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  success: { icon: "checkmark-circle", color: "#22C55E" },
  error: { icon: "close-circle", color: "#EF4444" },
  info: { icon: "information-circle", color: "#3B82F6" },
};

// ── Context ──────────────────────────────────────────────
const ToastContext =
  createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx)
    throw new Error(
      "useToast must be used within <ToastProvider>",
    );
  return ctx;
}

// ── Single toast card ────────────────────────────────────
function ToastCard({
  record,
  index,
  onDismiss,
}: {
  record: ToastRecord;
  index: number;
  onDismiss: (id: string) => void;
}) {
  const { theme, isDark } = useTheme();
  const { icon, color } = CONFIG[record.type];

  // Auto-dismiss progress
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      250, // let the enter animation finish
      withTiming(
        0,
        { duration: record.duration },
        (done) => {
          if (done) runOnJS(onDismiss)(record.id);
        },
      ),
    );
  }, [record.id, record.duration, onDismiss, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as unknown as number,
  }));

  const topOffset = 8 + index * 72;
  const bgColor = isDark
    ? "rgba(24,26,32,0.92)"
    : "rgba(255,255,255,0.92)";
  const borderColor = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.06)";

  return (
    <Animated.View
      entering={SlideInUp.duration(300)
        .springify()
        .damping(18)}
      exiting={SlideOutUp.duration(250)}
      style={[styles.cardWrapper, { top: topOffset }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => onDismiss(record.id)}
        style={[
          styles.card,
          {
            backgroundColor:
              Platform.OS === "ios"
                ? "transparent"
                : bgColor,
            borderColor,
          },
        ]}
      >
        {Platform.OS === "ios" && (
          <BlurView
            intensity={60}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Icon */}
        <Ionicons
          name={icon}
          size={22}
          color={color}
          style={styles.icon}
        />

        {/* Message */}
        <Typography
          variant="body"
          weight="medium"
          color="text"
          numberOfLines={2}
          style={styles.message}
        >
          {record.message}
        </Typography>

        {/* Progress bar */}
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: color + "44" },
            progressStyle,
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

// ── Provider ─────────────────────────────────────────────
const MAX_VISIBLE = 3;

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idCounter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = "info",
      duration = 3000,
    ) => {
      idCounter.current += 1;
      const id = `toast-${idCounter.current}-${Date.now()}`;
      setToasts((prev) =>
        [{ id, message, type, duration }, ...prev].slice(
          0,
          MAX_VISIBLE,
        ),
      );
    },
    [],
  );

  // Legacy-compatible bridge
  const toast = useCallback(
    (input: {
      title: string;
      description?: string;
      variant?: "default" | "success" | "destructive";
      durationMs?: number;
    }) => {
      const typeMap: Record<string, ToastType> = {
        success: "success",
        destructive: "error",
        default: "info",
      };
      const mapped =
        typeMap[input.variant ?? "default"] ?? "info";
      const msg = input.description
        ? `${input.title} — ${input.description}`
        : input.title;
      showToast(msg, mapped, input.durationMs ?? 3000);
    },
    [showToast],
  );

  const value = useMemo(
    () => ({ showToast, toast }),
    [showToast, toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast layer */}
      <View pointerEvents="box-none" style={styles.overlay}>
        {toasts.map((t, i) => (
          <ToastCard
            key={t.id}
            record={t}
            index={i}
            onDismiss={dismiss}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: "box-none",
  },
  cardWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: "box-none",
  },
  card: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
  },
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 3,
    borderBottomLeftRadius: 16,
  },
});
