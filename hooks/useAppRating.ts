// hooks/useAppRating.ts
import { useEffect, useCallback, useRef } from "react";
import { Alert, Platform, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const RATING_STORAGE_KEY = "@app_rating_status";
const MILESTONES = {
  QUIZ_COUNT: 5, // Prompt after 5 quizzes
  DAYS_ACTIVE: 7, // Prompt after 7 days active
  GROUPS_JOINED: 3, // Prompt after joining 3 groups
};

// Store URLs for rating
// TODO: Replace with actual App Store IDs before production release
const STORE_URLS = {
  ios: "https://apps.apple.com/app/skillsapp/id123456789",
  android: "https://play.google.com/store/apps/details?id=com.skillmedia.skillsapp",
};

interface RatingStatus {
  hasRated: boolean;
  lastPromptDate: number | null;
  dismissCount: number;
  quizCount: number;
  groupsJoined: number;
  firstOpenDate: number;
}

// Default status factory - returns fresh defaults with current timestamp
const getDefaultStatus = (): RatingStatus => ({
  hasRated: false,
  lastPromptDate: null,
  dismissCount: 0,
  quizCount: 0,
  groupsJoined: 0,
  firstOpenDate: Date.now(),
});

export function useAppRating() {
  const currentUser = useQuery(api.users.getCurrentUser);

  // Get rating status from storage
  const getRatingStatus = useCallback(async (): Promise<RatingStatus> => {
    try {
      const stored = await AsyncStorage.getItem(RATING_STORAGE_KEY);
      if (stored) {
        return { ...getDefaultStatus(), ...JSON.parse(stored) };
      }
      // Initialize on first open
      const freshDefault = getDefaultStatus();
      await AsyncStorage.setItem(
        RATING_STORAGE_KEY,
        JSON.stringify(freshDefault)
      );
      return freshDefault;
    } catch {
      return getDefaultStatus();
    }
  }, []);

  // Update rating status
  const updateRatingStatus = useCallback(
    async (updates: Partial<RatingStatus>) => {
      try {
        const current = await getRatingStatus();
        const newStatus = { ...current, ...updates };
        await AsyncStorage.setItem(
          RATING_STORAGE_KEY,
          JSON.stringify(newStatus)
        );
        return newStatus;
      } catch {
        return null;
      }
    },
    [getRatingStatus]
  );

  // Track quiz completion
  const trackQuizCompletion = useCallback(async () => {
    const status = await getRatingStatus();
    const newQuizCount = status.quizCount + 1;
    await updateRatingStatus({ quizCount: newQuizCount });

    // Check milestone
    if (
      newQuizCount >= MILESTONES.QUIZ_COUNT &&
      !status.hasRated &&
      shouldShowPrompt(status)
    ) {
      await showRatingPrompt("quiz");
    }
  }, [getRatingStatus, updateRatingStatus]);

  // Track group join
  const trackGroupJoin = useCallback(async () => {
    const status = await getRatingStatus();
    const newGroupCount = status.groupsJoined + 1;
    await updateRatingStatus({ groupsJoined: newGroupCount });

    // Check milestone
    if (
      newGroupCount >= MILESTONES.GROUPS_JOINED &&
      !status.hasRated &&
      shouldShowPrompt(status)
    ) {
      await showRatingPrompt("groups");
    }
  }, [getRatingStatus, updateRatingStatus]);

  // Check if enough time has passed since last prompt
  const shouldShowPrompt = (status: RatingStatus): boolean => {
    if (status.hasRated) return false;
    if (status.dismissCount >= 3) return false; // Stop after 3 dismissals

    // Wait at least 7 days between prompts
    if (status.lastPromptDate) {
      const daysSinceLastPrompt =
        (Date.now() - status.lastPromptDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < 7) return false;
    }

    return true;
  };

  // Check if user has been active for the required days
  const checkDaysActiveMilestone = useCallback(async () => {
    const status = await getRatingStatus();
    if (status.hasRated) return;

    const daysActive =
      (Date.now() - status.firstOpenDate) / (1000 * 60 * 60 * 24);

    if (daysActive >= MILESTONES.DAYS_ACTIVE && shouldShowPrompt(status)) {
      await showRatingPrompt("days");
    }
  }, [getRatingStatus]);

  // Show rating prompt
  const showRatingPrompt = useCallback(
    async (milestone: "quiz" | "groups" | "days") => {
      const messages = {
        quiz: "You've completed 5 quizzes! How are you enjoying SkillsApp?",
        groups: "You've joined 3 career communities! Loving SkillsApp?",
        days: "You've been exploring careers for a week! Rate your experience?",
      };

      Alert.alert(
        "Enjoying SkillsApp?",
        messages[milestone],
        [
          {
            text: "Not Now",
            style: "cancel",
            onPress: async () => {
              const status = await getRatingStatus();
              await updateRatingStatus({
                lastPromptDate: Date.now(),
                dismissCount: status.dismissCount + 1,
              });
            },
          },
          {
            text: "Rate App",
            onPress: async () => {
              await updateRatingStatus({
                hasRated: true,
                lastPromptDate: Date.now(),
              });

              // Open store URL based on platform
              const storeUrl =
                Platform.OS === "ios" ? STORE_URLS.ios : STORE_URLS.android;
              const canOpen = await Linking.canOpenURL(storeUrl);

              if (canOpen) {
                await Linking.openURL(storeUrl);
              } else {
                Alert.alert(
                  "Thank You!",
                  "Thanks for your support! Your rating helps other students discover career opportunities."
                );
              }
            },
          },
          {
            text: "Never Ask",
            style: "destructive",
            onPress: async () => {
              await updateRatingStatus({
                hasRated: true, // Mark as rated to stop prompts
                dismissCount: 999,
              });
            },
          },
        ],
        { cancelable: true }
      );
    },
    [getRatingStatus, updateRatingStatus]
  );

  // Check milestones on mount
  useEffect(() => {
    if (currentUser) {
      checkDaysActiveMilestone();
    }
  }, [currentUser, checkDaysActiveMilestone]);

  return {
    trackQuizCompletion,
    trackGroupJoin,
    showRatingPrompt,
  };
}
