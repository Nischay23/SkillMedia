/**
 * Typography System
 * Comprehensive typography definitions using Poppins font family
 */

export const FontFamily = {
  primary: "Poppins",
} as const;

export const FontSize = {
  display: 24,
  h1: 20,
  h2: 18,
  h3: 16,
  body: 15,
  bodySmall: 13,
  caption: 11,
} as const;

export const FontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

/**
 * Letter spacing values (in pixels) for each font size
 * Calculated to maintain visual hierarchy and readability
 */
export const LetterSpacing = {
  display: -0.5, // Negative for large text
  h1: -0.3,
  h2: 0,
  h3: 0.15,
  body: 0.25,
  bodySmall: 0.3,
  caption: 0.4,
} as const;

/**
 * Typography variants combining size, weight, line height, and letter spacing
 */
export const Typography = {
  display: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    lineHeight: LineHeight.tight,
    letterSpacing: LetterSpacing.display,
  },
  displayMedium: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.display,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.tight,
    letterSpacing: LetterSpacing.display,
  },
  h1: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    lineHeight: LineHeight.tight,
    letterSpacing: LetterSpacing.h1,
  },
  h1Medium: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.tight,
    letterSpacing: LetterSpacing.h1,
  },
  h2: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.tight,
    letterSpacing: LetterSpacing.h2,
  },
  h2Regular: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.tight,
    letterSpacing: LetterSpacing.h2,
  },
  h3: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.normal,
    letterSpacing: LetterSpacing.h3,
  },
  h3Medium: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.normal,
    letterSpacing: LetterSpacing.h3,
  },
  body: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.normal,
    letterSpacing: LetterSpacing.body,
  },
  bodyMedium: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.normal,
    letterSpacing: LetterSpacing.body,
  },
  bodySemibold: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.normal,
    letterSpacing: LetterSpacing.body,
  },
  bodySmall: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.normal,
    letterSpacing: LetterSpacing.bodySmall,
  },
  bodySmallMedium: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.normal,
    letterSpacing: LetterSpacing.bodySmall,
  },
  bodySmallSemibold: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.normal,
    letterSpacing: LetterSpacing.bodySmall,
  },
  caption: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: LineHeight.relaxed,
    letterSpacing: LetterSpacing.caption,
  },
  captionMedium: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    lineHeight: LineHeight.relaxed,
    letterSpacing: LetterSpacing.caption,
  },
  captionSemibold: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    lineHeight: LineHeight.relaxed,
    letterSpacing: LetterSpacing.caption,
  },
} as const;

/**
 * Type definitions for typography usage
 */
export type FontFamilyType = typeof FontFamily;
export type FontSizeType = typeof FontSize;
export type FontWeightType = typeof FontWeight;
export type LineHeightType = typeof LineHeight;
export type LetterSpacingType = typeof LetterSpacing;
export type TypographyVariant = keyof typeof Typography;
export type TypographyConfig =
  (typeof Typography)[TypographyVariant];

/**
 * Helper function to get typography styles for a specific variant
 * @param variant - The typography variant name
 * @returns Typography configuration object
 */
export const getTypography = (
  variant: TypographyVariant,
): TypographyConfig => {
  return Typography[variant];
};

/**
 * Helper function to merge typography with additional styles
 * @param variant - The typography variant name
 * @param additionalStyles - Additional style overrides
 * @returns Merged typography configuration
 */
export const mergeTypography = (
  variant: TypographyVariant,
  additionalStyles?: Record<string, any>,
): TypographyConfig & Record<string, any> => {
  return {
    ...Typography[variant],
    ...additionalStyles,
  };
};

export default Typography;
