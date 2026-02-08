// styles/notifications.styles.ts
import { StyleSheet } from "react-native";
import {
  COLORS,
  FontSize,
  FontWeight,
  SpacingValues,
  ScreenPadding,
} from "@/constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SpacingValues.base,
    paddingVertical: SpacingValues.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: FontSize.h1,
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary,
  },
  listContainer: {
    padding: SpacingValues.base,
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ScreenPadding.vertical,
  },
  notificationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: SpacingValues.md,
  },
  avatarContainer: {
    position: "relative",
    marginRight: SpacingValues.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  iconBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  notificationInfo: {
    flex: 1,
  },
  username: {
    color: COLORS.text,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  action: {
    color: COLORS.textMuted,
    fontSize: FontSize.bodySmall,
    marginBottom: 2,
  },
  timeAgo: {
    color: COLORS.textMuted,
    fontSize: FontSize.caption,
  },
  postImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
});
