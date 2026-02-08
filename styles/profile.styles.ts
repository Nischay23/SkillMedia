// styles/profile.styles.ts
import {
  COLORS,
  FontSize,
  FontWeight,
  SpacingValues,
  ScreenPadding,
} from "@/constants/theme";
import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SpacingValues.base,
    paddingVertical: SpacingValues.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: "row",
    gap: SpacingValues.base,
  },
  headerIcon: {
    padding: SpacingValues.xs,
  },
  profileInfo: {
    padding: SpacingValues.base,
  },
  avatarAndStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SpacingValues.base,
  },
  avatarContainer: {
    marginRight: SpacingValues.xl,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: COLORS.text,
    marginBottom: SpacingValues.xs,
  },
  statLabel: {
    fontSize: FontSize.caption,
    color: COLORS.textMuted,
  },

  name: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: COLORS.text,
    marginBottom: SpacingValues.xs,
  },
  bio: {
    fontSize: FontSize.bodySmall,
    color: COLORS.text,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: SpacingValues.sm,
    marginTop: SpacingValues.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SpacingValues.sm,
    borderRadius: SpacingValues.sm,
    alignItems: "center",
  },
  editButtonText: {
    color: COLORS.text,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.bodySmall,
  },
  shareButton: {
    backgroundColor: COLORS.surface,
    padding: SpacingValues.sm,
    borderRadius: SpacingValues.sm,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: ScreenPadding.vertical,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ScreenPadding.vertical,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semibold,
  },
  inputContainer: {
    marginBottom: ScreenPadding.vertical,
  },
  inputLabel: {
    color: COLORS.textMuted,
    marginBottom: SpacingValues.sm,
    fontSize: FontSize.bodySmall,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SpacingValues.sm,
    padding: SpacingValues.md,
    color: COLORS.text,
    fontSize: FontSize.body,
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SpacingValues.base,
    borderRadius: SpacingValues.sm,
    alignItems: "center",
    marginTop: ScreenPadding.vertical,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
  },
  postDetailContainer: {
    backgroundColor: COLORS.background,
    maxHeight: height * 0.9,
  },
  postDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: SpacingValues.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surface,
  },
  postDetailImage: {
    width: width,
    height: width,
  },
  followButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SpacingValues.lg,
    paddingVertical: SpacingValues.sm,
    borderRadius: SpacingValues.sm,
    marginTop: SpacingValues.base,
  },
  followingButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  followButtonText: {
    color: COLORS.text,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.semibold,
    textAlign: "center",
  },
  followingButtonText: {
    color: COLORS.text,
    textAlign: "center",
  },
  noPostsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SpacingValues.xxl,
    gap: SpacingValues.md,
    flex: 1,
  },
  noPostsText: {
    color: COLORS.textMuted,
    fontSize: FontSize.body,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semibold,
    color: COLORS.text,
  },
});
