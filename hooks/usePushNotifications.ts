import { api } from "@/convex/_generated/api";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useMutation } from "convex/react";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Check if running in Expo Go (push notifications not supported in Expo Go for SDK 53+)
const isExpoGo = Constants.appOwnership === "expo";

// Configure notification handling (only if not in Expo Go)
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Silently fail in Expo Go
  }
}

export interface PushNotificationState {
  expoPushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  isLoading: boolean;
  error: string | null;
  isExpoGo: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    expoPushToken: null,
    permissionStatus: null,
    isLoading: false,
    error: null,
    isExpoGo,
  });

  const savePushToken = useMutation(api.users.savePushToken);
  const notificationListener =
    useRef<Notifications.EventSubscription | null>(null);
  const responseListener =
    useRef<Notifications.EventSubscription | null>(null);

  // Get push token
  const registerForPushNotifications = useCallback(async () => {
    // Skip if running in Expo Go
    if (isExpoGo) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Push notifications not available in Expo Go. Use a development build.",
      }));
      return null;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Must be a physical device for push notifications
      if (!Device.isDevice) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Push notifications require a physical device",
        }));
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== "granted") {
        const { status } =
          await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setState((prev) => ({
        ...prev,
        permissionStatus: finalStatus,
      }));

      if (finalStatus !== "granted") {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Push notification permission not granted",
        }));
        return null;
      }

      // Get project ID from expo config
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "EAS project ID not configured",
        }));
        return null;
      }

      // Get the push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;

      // Save token to Convex
      await savePushToken({ token });

      setState((prev) => ({
        ...prev,
        expoPushToken: token,
        isLoading: false,
      }));

      // Android specific channel configuration
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#6366F1",
        });

        await Notifications.setNotificationChannelAsync("messages", {
          name: "Messages",
          description: "Notifications for new messages in groups",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#6366F1",
          sound: "default",
        });
      }

      return token;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [savePushToken]);

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    // Skip if running in Expo Go
    if (isExpoGo) {
      return "undetermined" as Notifications.PermissionStatus;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      setState((prev) => ({
        ...prev,
        permissionStatus: status,
      }));
      return status;
    } catch {
      return "undetermined" as Notifications.PermissionStatus;
    }
  }, []);

  // Setup notification listeners (only if not in Expo Go)
  useEffect(() => {
    if (isExpoGo) return;

    try {
      // Handle notifications received while app is foregrounded
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification);
        });

      // Handle notification taps
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("Notification response:", response);
          const data = response.notification.request.content.data;

          // Navigate to group if groupId is provided
          if (data?.groupId) {
            // Navigation will be handled by the component using this hook
          }
        });
    } catch {
      // Silently fail
    }

    // Cleanup listeners
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    ...state,
    registerForPushNotifications,
    checkPermissionStatus,
  };
}
