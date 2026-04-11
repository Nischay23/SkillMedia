// hooks/useDeepLinking.ts
import { useEffect } from "react";
import { Linking, Share } from "react-native";
import { useRouter } from "expo-router";
import * as ExpoLinking from "expo-linking";
import { Id } from "@/convex/_generated/dataModel";

// Base URLs for deep links
const APP_SCHEME = "skillsapp://";
const WEB_URL = "https://skillsapp.in";

// Types for shareable content
export type ShareableContent =
  | { type: "career"; id: Id<"FilterOption">; name: string }
  | { type: "group"; id: Id<"groups">; name: string }
  | { type: "post"; id: Id<"communityPosts">; title: string }
  | { type: "quiz"; id: Id<"quizzes">; name: string };

/**
 * Generate a shareable deep link URL
 */
export function generateShareLink(content: ShareableContent): {
  appLink: string;
  webLink: string;
} {
  const idStr = content.id.toString();

  switch (content.type) {
    case "career":
      return {
        appLink: `${APP_SCHEME}career/${idStr}`,
        webLink: `${WEB_URL}/career/${idStr}`,
      };
    case "group":
      return {
        appLink: `${APP_SCHEME}group/${idStr}`,
        webLink: `${WEB_URL}/group/${idStr}`,
      };
    case "post":
      return {
        appLink: `${APP_SCHEME}post/${idStr}`,
        webLink: `${WEB_URL}/post/${idStr}`,
      };
    case "quiz":
      return {
        appLink: `${APP_SCHEME}quiz/${idStr}`,
        webLink: `${WEB_URL}/quiz/${idStr}`,
      };
  }
}

/**
 * Share content with a deep link
 */
export async function shareContent(content: ShareableContent): Promise<boolean> {
  const links = generateShareLink(content);

  let title = "";
  let message = "";

  switch (content.type) {
    case "career":
      title = `Check out ${content.name} on SkillsApp`;
      message = `Explore the ${content.name} career path on SkillsApp! Discover requirements, salary, and more.\n\n${links.webLink}`;
      break;
    case "group":
      title = `Join ${content.name} on SkillsApp`;
      message = `Join the ${content.name} community on SkillsApp to connect with others in this career path!\n\n${links.webLink}`;
      break;
    case "post":
      title = `${content.title} - SkillsApp`;
      message = `Check out this career insight on SkillsApp:\n\n"${content.title}"\n\n${links.webLink}`;
      break;
    case "quiz":
      title = `Take the ${content.name} quiz on SkillsApp`;
      message = `Test your knowledge with the ${content.name} quiz on SkillsApp!\n\n${links.webLink}`;
      break;
  }

  try {
    const result = await Share.share({
      title,
      message,
      url: links.webLink,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error sharing content:", error);
    return false;
  }
}

/**
 * Parse a deep link URL and return route info
 */
export function parseDeepLink(url: string): {
  route: string;
  params: Record<string, string>;
} | null {
  try {
    const parsed = ExpoLinking.parse(url);

    if (!parsed.path) return null;

    const pathParts = parsed.path.split("/").filter(Boolean);

    if (pathParts.length === 0) return null;

    const type = pathParts[0];
    const id = pathParts[1];

    // Validate that ID exists for routes that require it
    if (!id) {
      console.warn(`Deep link missing ID for type: ${type}`);
      return null;
    }

    switch (type) {
      case "career":
        return {
          route: "/(tabs)/",
          params: { filterId: id, ...parsed.queryParams },
        };
      case "group":
        return {
          route: `/group/${id}`,
          params: { id, ...parsed.queryParams },
        };
      case "post":
        return {
          route: `/post/${id}`,
          params: { id, ...parsed.queryParams },
        };
      case "quiz":
        return {
          route: `/quiz/${id}`,
          params: { id, ...parsed.queryParams },
        };
      default:
        return null;
    }
  } catch (error) {
    console.error("Error parsing deep link:", error);
    return null;
  }
}

/**
 * Hook to handle deep link navigation
 */
export function useDeepLinking() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleDeepLink(initialUrl);
        }
      } catch (error) {
        console.error("Error getting initial URL:", error);
      }
    };

    // Handle URL changes while app is running
    const handleURLChange = (event: { url: string }) => {
      handleDeepLink(event.url);
    };

    // Process the deep link
    const handleDeepLink = (url: string) => {
      try {
        const parsed = parseDeepLink(url);
        if (parsed) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            router.push({
              pathname: parsed.route as any,
              params: parsed.params,
            });
          }, 100);
        }
      } catch (error) {
        console.error("Error handling deep link:", error);
      }
    };

    // Set up listeners
    handleInitialURL();
    const subscription = Linking.addEventListener("url", handleURLChange);

    return () => {
      subscription.remove();
    };
  }, [router]);
}

/**
 * Hook for sharing specific content types (convenience hooks)
 */
export function useShareCareer() {
  return (id: Id<"FilterOption">, name: string) =>
    shareContent({ type: "career", id, name });
}

export function useShareGroup() {
  return (id: Id<"groups">, name: string) =>
    shareContent({ type: "group", id, name });
}

export function useSharePost() {
  return (id: Id<"communityPosts">, title: string) =>
    shareContent({ type: "post", id, title });
}

export function useShareQuiz() {
  return (id: Id<"quizzes">, name: string) =>
    shareContent({ type: "quiz", id, name });
}
