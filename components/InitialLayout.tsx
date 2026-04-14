import { api } from "@/convex/_generated/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import * as SplashScreen from "expo-splash-screen";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, View, ActivityIndicator } from "react-native";

export default function InitialLayout() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();

  const segments = useSegments();
  const router = useRouter();

  const createUser = useMutation(api.users.createUser);
  const updateStreak = useMutation(
    api.streaks.updateStreak,
  );
  const updateLastActive = useMutation(
    api.analytics.updateLastActive,
  );
  const existingUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip",
  );
  const onboardingStatus = useQuery(
    api.userPreferences.checkOnboardingStatus,
    isSignedIn && existingUser ? {} : "skip",
  );

  const hasCreatedRef = useRef(false);
  const hasUpdatedStreakRef = useRef(false);
  const hasCheckedOnboardingRef = useRef(false);

  // Update lastActive on app foreground
  useEffect(() => {
    const handleAppStateChange = (
      nextState: AppStateStatus,
    ) => {
      if (
        nextState === "active" &&
        isSignedIn &&
        existingUser
      ) {
        updateLastActive({}).catch(() => {
          // Silent fail - non-critical
        });
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // Also update on initial mount when signed in
    if (isSignedIn && existingUser) {
      updateLastActive({}).catch(() => {});
    }

    return () => {
      subscription.remove();
    };
  }, [isSignedIn, existingUser, updateLastActive]);

  // Update streak when user is authenticated
  useEffect(() => {
    if (
      !isSignedIn ||
      !existingUser ||
      hasUpdatedStreakRef.current
    )
      return;

    hasUpdatedStreakRef.current = true;
    updateStreak({}).catch(() => {
      // Silent fail - streak update is non-critical
      hasUpdatedStreakRef.current = false;
    });
  }, [isSignedIn, existingUser, updateStreak]);

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded) return;

    const inAuthScreen = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    async function ensureUserAndRoute() {
      if (!isSignedIn) {
        hasCreatedRef.current = false;
        hasUpdatedStreakRef.current = false;
        hasCheckedOnboardingRef.current = false;
        if (!inAuthScreen) router.replace("/(auth)/login");
        setTimeout(() => SplashScreen.hideAsync(), 100);
        return;
      }

      // Check if user is fully new and needs creation
      if (user && existingUser === null && !hasCreatedRef.current) {
        hasCreatedRef.current = true;
        try {
          const email =
            user.primaryEmailAddress?.emailAddress ||
            user.emailAddresses[0]?.emailAddress ||
            "";
          const username =
            email.split("@")[0] ||
            `user_${user.id.slice(-6)}`;
          const fullname =
            user.fullName ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim();

          await createUser({
            username,
            fullname: fullname || username,
            email,
            profileImage: user.imageUrl,
            clerkId: user.id,
          });
        } catch (err) {
          // If creation failed, reset so it retries
          hasCreatedRef.current = false;
          setTimeout(() => SplashScreen.hideAsync(), 100);
        }
        // Still wait for `existingUser` to reflect the newly created user in subsequent renders
        return; 
      }

      const isNewUserCheckFinished = existingUser !== undefined;
      const isOnboardingStatusFinished = onboardingStatus !== undefined;

      if (!isNewUserCheckFinished || !isOnboardingStatusFinished) return;

      if (onboardingStatus === false) {
        if (!inOnboarding) {
          router.replace("/onboarding");
        }
      } else if (onboardingStatus === true) {
        if (inAuthScreen || inOnboarding) {
          router.replace("/(tabs)");
        }
      }

      setTimeout(() => SplashScreen.hideAsync(), 100);
    }

    void ensureUserAndRoute();
  }, [
    isAuthLoaded,
    isUserLoaded,
    isSignedIn,
    user,
    existingUser,
    onboardingStatus,
    segments,
  ]);

  if (!isAuthLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F1115", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#0F1115' } }} />;
}
