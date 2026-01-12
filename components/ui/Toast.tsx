import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ToastVariant = "default" | "success" | "destructive";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext =
  createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      "useToast must be used within ToastProvider"
    );
  }
  return ctx;
}

function variantStyles(variant: ToastVariant | undefined) {
  switch (variant) {
    case "success":
      return {
        borderColor: "rgba(16, 185, 129, 0.35)",
        titleColor: "#e5e7eb",
        descriptionColor: "#9ca3af",
        accentDot: "#10b981",
      };
    case "destructive":
      return {
        borderColor: "rgba(239, 68, 68, 0.35)",
        titleColor: "#e5e7eb",
        descriptionColor: "#9ca3af",
        accentDot: "#ef4444",
      };
    default:
      return {
        borderColor: "#2d3748",
        titleColor: "#e5e7eb",
        descriptionColor: "#9ca3af",
        accentDot: "#6b7280",
      };
  }
}

function ToastItem({
  record,
  onDismiss,
}: {
  record: ToastRecord;
  onDismiss: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();

    return () => {
      anim.stopAnimation();
    };
  }, [anim]);

  const v = variantStyles(record.variant);

  const handleDismiss = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDismiss();
    });
  };

  return (
    <Pressable
      onPress={handleDismiss}
      style={[styles.toast, { borderColor: v.borderColor }]}
    >
      <Animated.View
        style={{
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-6, 0],
              }),
            },
          ],
        }}
      >
        <View style={styles.toastRow}>
          <View
            style={[
              styles.accentDot,
              { backgroundColor: v.accentDot },
            ]}
          />
          <View style={styles.toastBody}>
            <Text
              style={[
                styles.toastTitle,
                { color: v.titleColor },
              ]}
            >
              {record.title}
            </Text>
            {!!record.description && (
              <Text
                style={[
                  styles.toastDescription,
                  { color: v.descriptionColor },
                ]}
                numberOfLines={3}
              >
                {record.description}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant,
      durationMs,
    }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const record: ToastRecord = {
        id,
        title,
        description,
        variant,
        durationMs,
      };

      setToasts((prev) => [record, ...prev].slice(0, 3));

      const timeout = setTimeout(() => {
        dismiss(id);
      }, durationMs ?? 3200);

      timers.current.set(id, timeout);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <View pointerEvents="box-none" style={styles.stack}>
          {toasts.map((t) => (
            <ToastItem
              key={t.id}
              record={t}
              onDismiss={() => dismiss(t.id)}
            />
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  stack: {
    position: "absolute",
    top: 16,
    right: 16,
    left: 16,
    alignItems: "flex-end",
    gap: 10,
  },
  toast: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  toastRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 6,
  },
  toastBody: {
    flex: 1,
    gap: 4,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  toastDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
