/**
 * CardStyles — Centralised card style system
 * ─────────────────────────────────────────────
 * Provides consistent border-radius, padding, shadow and elevation
 * for every card surface in the app.
 *
 * Usage (static StyleSheet):
 *   import { baseCard } from "@/constants/CardStyles";
 *   const styles = StyleSheet.create({ card: { ...baseCard, backgroundColor: '#fff' } });
 *
 * Usage (themed / useThemedStyles):
 *   import { getThemedCardStyle } from "@/constants/CardStyles";
 *   const cardStyle = getThemedCardStyle('base', t.colors.shadow);
 *
 * Usage (helper):
 *   import { getCardStyle } from "@/constants/CardStyles";
 *   const card = getCardStyle('elevated');
 */

import { Platform, ViewStyle } from "react-native";
import { CardSpacing, BorderRadius } from "./Spacing";

// ── Constants ────────────────────────────────────────────

/** Standard card border radius used across the app */
export const CARD_BORDER_RADIUS = BorderRadius.lg; // 16

/** Standard card padding from the spacing system */
export const CARD_PADDING = CardSpacing.padding; // 16

/** Default shadow colour (overridden in themed helpers) */
const DEFAULT_SHADOW_COLOR = "#000";

// ── Shadow presets ───────────────────────────────────────

/** iOS shadow for the base card variant */
const baseShadowIOS: ViewStyle = {
  shadowColor: DEFAULT_SHADOW_COLOR,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
};

/** iOS shadow for the elevated card variant */
const elevatedShadowIOS: ViewStyle = {
  shadowColor: DEFAULT_SHADOW_COLOR,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 16,
};

// ── Reusable style objects ───────────────────────────────

/**
 * Base card – standard border radius, padding and shadow / elevation.
 * Spread into your own style and add `backgroundColor`.
 */
export const baseCard: ViewStyle = {
  borderRadius: CARD_BORDER_RADIUS,
  padding: CARD_PADDING,
  overflow: "hidden",
  ...Platform.select({
    ios: baseShadowIOS,
    android: { elevation: 4 },
  }),
};

/**
 * Elevated card – deeper shadow for prominent surfaces (hero cards, modals).
 */
export const elevatedCard: ViewStyle = {
  borderRadius: CARD_BORDER_RADIUS,
  padding: CARD_PADDING,
  overflow: "hidden",
  ...Platform.select({
    ios: elevatedShadowIOS,
    android: { elevation: 8 },
  }),
};

/**
 * Flat card – no shadow, uses a subtle border instead.
 */
export const flatCard: ViewStyle = {
  borderRadius: CARD_BORDER_RADIUS,
  padding: CARD_PADDING,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
};

// ── Helper function (static) ─────────────────────────────

export type CardVariant = "base" | "elevated" | "flat";

/**
 * Return one of the three static card style presets.
 *
 * @example
 * const card = getCardStyle('elevated');
 * <View style={[card, { backgroundColor: '#fff' }]} />
 */
export const getCardStyle = (
  variant: CardVariant = "base",
): ViewStyle => {
  switch (variant) {
    case "elevated":
      return elevatedCard;
    case "flat":
      return flatCard;
    case "base":
    default:
      return baseCard;
  }
};

// ── Themed helper (for useThemedStyles) ──────────────────

/**
 * Build a card style that respects the current theme's shadow colour.
 * Use inside `useThemedStyles((t) => ({ card: getThemedCardStyle('base', t.colors.shadow) }))`.
 *
 * @param variant  – 'base' | 'elevated' | 'flat'
 * @param shadowColor – theme shadow colour (e.g. `t.colors.shadow`)
 * @param overrides – any extra ViewStyle properties to merge
 */
export const getThemedCardStyle = (
  variant: CardVariant = "base",
  shadowColor: string = DEFAULT_SHADOW_COLOR,
  overrides: ViewStyle = {},
): ViewStyle => {
  const base: ViewStyle = {
    borderRadius: CARD_BORDER_RADIUS,
    padding: CARD_PADDING,
    overflow: "hidden",
  };

  switch (variant) {
    case "elevated":
      return {
        ...base,
        ...Platform.select({
          ios: {
            shadowColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
          },
          android: { elevation: 8 },
        }),
        ...overrides,
      };

    case "flat":
      return {
        ...base,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
        ...overrides,
      };

    case "base":
    default:
      return {
        ...base,
        ...Platform.select({
          ios: {
            shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          },
          android: { elevation: 4 },
        }),
        ...overrides,
      };
  }
};

// ── Type exports ─────────────────────────────────────────
export type CardStylesType = {
  baseCard: ViewStyle;
  elevatedCard: ViewStyle;
  flatCard: ViewStyle;
};
