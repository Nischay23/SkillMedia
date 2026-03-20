import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Typography } from "@/components/ui/Typography";
import {
  useTheme,
  useThemedStyles,
} from "@/providers/ThemeProvider";

export default function Notification({ notification }: any) {
  const { theme } = useTheme();

  const styles = useThemedStyles((t) => ({
    notificationItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      padding: t.spacing.md,
      backgroundColor: t.colors.surface,
      borderRadius: t.borderRadius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    notificationContent: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    avatarContainer: {
      position: "relative" as const,
      marginRight: t.spacing.md,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: t.colors.primary + "33",
    },
    iconBadge: {
      position: "absolute" as const,
      bottom: -2,
      right: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: t.colors.surface,
      borderWidth: 2,
      borderColor: t.colors.background,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    notificationInfo: {
      flex: 1,
    },
    postImage: {
      width: 48,
      height: 48,
      borderRadius: t.borderRadius.sm,
      marginLeft: t.spacing.md,
    },
  }));

  return (
    <View style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Link href={`/user/${notification.sender._id}`} asChild>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image
              source={notification.sender.image}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.iconBadge}>
              {notification.type === "like" ? (
                <Ionicons name="heart" size={12} color={theme.colors.primary} />
              ) : notification.type === "follow" ? (
                <Ionicons name="person-add" size={12} color="#8B5CF6" />
              ) : (
                <Ionicons name="chatbubble" size={12} color="#3B82F6" />
              )}
            </View>
          </TouchableOpacity>
        </Link>

        <View style={styles.notificationInfo}>
          <Link href={`/user/${notification.sender._id}`} asChild>
            <TouchableOpacity>
              <Typography variant="body" weight="semibold" numberOfLines={1}>
                {notification.sender.username}
              </Typography>
            </TouchableOpacity>
          </Link>

          <Typography variant="caption" color="textSecondary" numberOfLines={2}>
            {notification.type === "follow"
              ? "started following you"
              : notification.type === "like"
                ? "liked your post"
                : `commented: "${notification.comment}"`}
          </Typography>
          <Typography variant="caption" color="textMuted" style={{ marginTop: 2 }}>
            {formatDistanceToNow(notification._creationTime, { addSuffix: true })}
          </Typography>
        </View>
      </View>

      {notification.post && (
        <Image
          source={notification.post.imageUrl}
          style={styles.postImage}
          contentFit="cover"
          transition={200}
        />
      )}
    </View>
  );
}
