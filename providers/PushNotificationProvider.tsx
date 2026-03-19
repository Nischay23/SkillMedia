import { Typography } from "@/components/ui/Typography";
import { useTheme } from "@/providers/ThemeProvider";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useAuth } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface PushNotificationContextType {
  expoPushToken: string | null;
  isRegistered: boolean;
  showPermissionPrompt: () => void;
}

const PushNotificationContext =
  createContext<PushNotificationContextType>({
    expoPushToken: null,
    isRegistered: false,
    showPermissionPrompt: () => {},
  });

export const usePushNotificationContext = () =>
  useContext(PushNotificationContext);

export function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const { isSignedIn } = useAuth();
  const {
    expoPushToken,
    permissionStatus,
    registerForPushNotifications,
    checkPermissionStatus,
  } = usePushNotifications();

  const [hasPrompted, setHasPrompted] = useState(false);
  const [isPromptVisible, setIsPromptVisible] =
    useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Bell animation
  const bellRotation = useSharedValue(0);

  useEffect(() => {
    if (isPromptVisible) {
      bellRotation.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 100 }),
          withTiming(15, { duration: 100 }),
          withTiming(-10, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(0, { duration: 100 }),
        ),
        3,
        false,
      );
    }
  }, [isPromptVisible, bellRotation]);

  const bellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotation.value}deg` }],
  }));

  // Check permission status on mount
  useEffect(() => {
    if (isSignedIn) {
      checkPermissionStatus();
    }
  }, [isSignedIn, checkPermissionStatus]);

  const showPermissionPrompt = useCallback(() => {
    if (permissionStatus === "granted" || hasPrompted)
      return;
    setIsPromptVisible(true);
    bottomSheetRef.current?.expand();
  }, [permissionStatus, hasPrompted]);

  // Auto-show prompt after a delay if not granted and not prompted
  useEffect(() => {
    if (
      isSignedIn &&
      permissionStatus !== null &&
      permissionStatus !== "granted" &&
      !hasPrompted
    ) {
      const timer = setTimeout(() => {
        showPermissionPrompt();
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [
    isSignedIn,
    permissionStatus,
    hasPrompted,
    showPermissionPrompt,
  ]);

  const handleAccept = useCallback(async () => {
    setHasPrompted(true);
    bottomSheetRef.current?.close();
    setIsPromptVisible(false);
    await registerForPushNotifications();
  }, [registerForPushNotifications]);

  const handleDecline = useCallback(() => {
    setHasPrompted(true);
    bottomSheetRef.current?.close();
    setIsPromptVisible(false);
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  const contextValue = useMemo(
    () => ({
      expoPushToken,
      isRegistered: permissionStatus === "granted",
      showPermissionPrompt,
    }),
    [expoPushToken, permissionStatus, showPermissionPrompt],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        sheetContainer: {
          padding: 24,
          paddingBottom: 40,
        },
        iconContainer: {
          alignSelf: "center",
          marginBottom: 20,
        },
        iconGradient: {
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          textAlign: "center",
          marginBottom: 12,
        },
        description: {
          textAlign: "center",
          color: theme.colors.textSecondary,
          marginBottom: 24,
          lineHeight: 22,
        },
        benefitsList: {
          marginBottom: 32,
          gap: 12,
        },
        benefitItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        benefitIconContainer: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${theme.colors.primary}15`,
          alignItems: "center",
          justifyContent: "center",
        },
        benefitText: {
          flex: 1,
          color: theme.colors.text,
        },
        buttonsContainer: {
          gap: 12,
        },
        acceptButton: {
          borderRadius: 16,
          overflow: "hidden",
        },
        acceptButtonGradient: {
          paddingVertical: 16,
          alignItems: "center",
          justifyContent: "center",
        },
        acceptButtonText: {
          color: "#FFFFFF",
          fontWeight: "700",
        },
        declineButton: {
          paddingVertical: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        declineButtonText: {
          color: theme.colors.textMuted,
        },
      }),
    [theme],
  );

  const benefits = [
    {
      icon: "chatbubbles" as const,
      text: "Get notified when someone messages in your groups",
    },
    {
      icon: "heart" as const,
      text: "See reactions to your messages instantly",
    },
    {
      icon: "flash" as const,
      text: "Never miss important announcements",
    },
  ];

  return (
    <PushNotificationContext.Provider value={contextValue}>
      <View style={styles.container}>
        {children}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={["55%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: theme.colors.surface,
          }}
          handleIndicatorStyle={{
            backgroundColor: theme.colors.border,
          }}
          onChange={(index) => {
            if (index === -1) {
              setIsPromptVisible(false);
            }
          }}
        >
          <BottomSheetView style={styles.sheetContainer}>
            {/* Animated Bell Icon */}
            <Animated.View
              entering={FadeIn.duration(300).delay(100)}
              style={styles.iconContainer}
            >
              <LinearGradient
                colors={[
                  theme.colors.primary,
                  theme.colors.primaryDark,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Animated.View style={bellAnimatedStyle}>
                  <Ionicons
                    name="notifications"
                    size={40}
                    color="#FFFFFF"
                  />
                </Animated.View>
              </LinearGradient>
            </Animated.View>

            {/* Title */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(200)}
            >
              <Typography variant="h2" style={styles.title}>
                Stay in the Loop
              </Typography>
            </Animated.View>

            {/* Description */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(300)}
            >
              <Typography
                variant="body"
                style={styles.description}
              >
                Enable notifications to stay connected with
                your community and never miss a message.
              </Typography>
            </Animated.View>

            {/* Benefits List */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(400)}
              style={styles.benefitsList}
            >
              {benefits.map((benefit, index) => (
                <View
                  key={index}
                  style={styles.benefitItem}
                >
                  <View style={styles.benefitIconContainer}>
                    <Ionicons
                      name={benefit.icon}
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Typography
                    variant="caption"
                    style={styles.benefitText}
                  >
                    {benefit.text}
                  </Typography>
                </View>
              ))}
            </Animated.View>

            {/* Buttons */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(500)}
              style={styles.buttonsContainer}
            >
              <Pressable
                style={styles.acceptButton}
                onPress={handleAccept}
              >
                <LinearGradient
                  colors={[
                    theme.colors.primary,
                    theme.colors.primaryDark,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.acceptButtonGradient}
                >
                  <Typography
                    variant="body"
                    style={styles.acceptButtonText}
                  >
                    Enable Notifications
                  </Typography>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.declineButton}
                onPress={handleDecline}
              >
                <Typography
                  variant="caption"
                  style={styles.declineButtonText}
                >
                  Maybe Later
                </Typography>
              </Pressable>
            </Animated.View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </PushNotificationContext.Provider>
  );
}
