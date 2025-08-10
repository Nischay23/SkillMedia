import { useAuth, useUser } from "@clerk/clerk-expo";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function InitialLayout() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();

  const segments = useSegments();
  const router = useRouter();

  const createUser = useMutation(api.users.createUser);
  const existingUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const hasCreatedRef = useRef(false);

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded) return;

    const inAuthScreen = segments[0] === "(auth)";

    async function ensureUserAndRoute() {
      if (!isSignedIn) {
        if (!inAuthScreen) router.replace("/(auth)/login");
        return;
      }

      if (!hasCreatedRef.current && user && existingUser === undefined) {
        try {
          hasCreatedRef.current = true;
          const email =
            user.primaryEmailAddress?.emailAddress ||
            user.emailAddresses[0]?.emailAddress ||
            "";
          const username = email.split("@")[0] || `user_${user.id.slice(-6)}`;
          const fullname =
            user.fullName ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim();

          await createUser({
            username,
            fullname: fullname || username,
            email,
            image: user.imageUrl,
            clerkId: user.id,
          });
        } catch (err) {
          // no-op: if creation fails, allow subsequent retries on next render
          hasCreatedRef.current = false;
        }
      }

      if (inAuthScreen) router.replace("/(tabs)");
    }

    void ensureUserAndRoute();
  }, [isAuthLoaded, isUserLoaded, isSignedIn, user, existingUser, segments]);

  if (!isAuthLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
