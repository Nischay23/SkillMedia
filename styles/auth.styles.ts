// styles/auth.styles.ts
import {
  COLORS,
  FontSize,
  FontWeight,
  SpacingValues,
  ScreenPadding,
} from "@/constants/theme";
import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  brandSection: {
    alignItems: "center",
    marginTop: height * 0.12,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: ScreenPadding.vertical,
  },
  appName: {
    fontSize: 42,
    fontWeight: FontWeight.bold,
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: SpacingValues.sm,
  },
  tagline: {
    fontSize: FontSize.body,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: "lowercase",
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  illustration: {
    width: width * 0.75,
    height: width * 0.75,
    maxHeight: 280,
  },
  loginSection: {
    width: "100%",
    paddingHorizontal: SpacingValues.lg,
    paddingBottom: 40,
    alignItems: "center",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: SpacingValues.base,
    paddingHorizontal: SpacingValues.lg,
    borderRadius: 14,
    marginBottom: ScreenPadding.vertical,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SpacingValues.md,
  },
  googleButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: COLORS.surface,
  },
  termsText: {
    textAlign: "center",
    fontSize: FontSize.caption,
    color: COLORS.textMuted,
    maxWidth: 280,
  },
});
