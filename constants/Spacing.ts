/**
 * Spacing System
 * Consistent spacing definitions based on 4px base unit
 */

/**
 * Base unit for all spacing calculations
 */
export const BASE_UNIT = 4;

/**
 * Base spacing values (4px increments)
 */
export const SpacingValues = {
  xs: 4, // 1x base
  sm: 8, // 2x base
  md: 12, // 3x base
  base: 16, // 4x base
  lg: 24, // 6x base
  xl: 32, // 8x base
  xxl: 48, // 12x base
  xxxl: 64, // 16x base
} as const;

/**
 * Screen padding constants
 */
export const ScreenPadding = {
  horizontal: 16,
  vertical: 20,
} as const;

/**
 * Card layout constants
 */
export const CardSpacing = {
  padding: 16,
  gap: 12,
} as const;

/**
 * Component-specific spacing
 */
export const ComponentSpacing = {
  // Buttons
  buttonPaddingHorizontal: 16,
  buttonPaddingVertical: 12,
  buttonGap: 8,

  // Inputs
  inputPaddingHorizontal: 16,
  inputPaddingVertical: 12,

  // Lists
  listItemGap: 12,
  listItemPadding: 16,

  // Sections
  sectionGap: 24,
  sectionPadding: 16,

  // Icons
  iconMargin: 8,
  iconSize: 24,
} as const;

/**
 * Border radius values
 */
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Combined Spacing object for easy import
 */
export const Spacing = {
  ...SpacingValues,
  screen: ScreenPadding,
  card: CardSpacing,
  component: ComponentSpacing,
  radius: BorderRadius,
} as const;

/**
 * Type definitions
 */
export type SpacingValue = keyof typeof SpacingValues;
export type ScreenPaddingType = typeof ScreenPadding;
export type CardSpacingType = typeof CardSpacing;
export type ComponentSpacingType = typeof ComponentSpacing;
export type BorderRadiusType = typeof BorderRadius;
export type SpacingType = typeof Spacing;

/**
 * Helper function to calculate spacing based on multiplier
 * @param multiplier - Number to multiply by base unit (4px)
 * @returns Calculated spacing value
 * @example spacing(2) // returns 8
 * @example spacing(4) // returns 16
 */
export const spacing = (multiplier: number): number => {
  return multiplier * BASE_UNIT;
};

/**
 * Helper function to get horizontal and vertical padding
 * @param horizontal - Horizontal padding multiplier
 * @param vertical - Vertical padding multiplier (optional, defaults to horizontal)
 * @returns Object with paddingHorizontal and paddingVertical
 */
export const paddingXY = (
  horizontal: number,
  vertical?: number,
): {
  paddingHorizontal: number;
  paddingVertical: number;
} => {
  return {
    paddingHorizontal: spacing(horizontal),
    paddingVertical: spacing(vertical ?? horizontal),
  };
};

/**
 * Helper function to get margin values
 * @param top - Top margin multiplier
 * @param right - Right margin multiplier (optional)
 * @param bottom - Bottom margin multiplier (optional)
 * @param left - Left margin multiplier (optional)
 * @returns Margin object
 */
export const margin = (
  top: number,
  right?: number,
  bottom?: number,
  left?: number,
): {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
} => {
  return {
    marginTop: spacing(top),
    marginRight: spacing(right ?? top),
    marginBottom: spacing(bottom ?? top),
    marginLeft: spacing(left ?? right ?? top),
  };
};

/**
 * Helper function for gap spacing (flexbox)
 * @param value - Gap multiplier
 * @returns Gap value
 */
export const gap = (value: number): number => {
  return spacing(value);
};

export default Spacing;
