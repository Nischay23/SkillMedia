import { api } from "@/convex/_generated/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

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
        if (!inAuthScreen) router.replace("/(auth)/login");
        return;
      }

      if (
        !hasCreatedRef.current &&
        user &&
        existingUser === undefined
      ) {
        try {
          hasCreatedRef.current = true;
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
          // no-op: if creation fails, allow subsequent retries on next render
          hasCreatedRef.current = false;
        }
      }

      // Check onboarding status after user exists
      if (
        existingUser &&
        onboardingStatus !== undefined &&
        !hasCheckedOnboardingRef.current
      ) {
        hasCheckedOnboardingRef.current = true;

        if (!onboardingStatus && !inOnboarding) {
          // User hasn't completed onboarding, redirect
          router.replace("/onboarding");
          return;
        }
      }

      if (inAuthScreen) {
        // Check onboarding before going to tabs
        if (onboardingStatus === false && !inOnboarding) {
          router.replace("/onboarding");
        } else {
          router.replace("/(tabs)");
        }
      }
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

  if (!isAuthLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
