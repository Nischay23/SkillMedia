// app/constants/theme.ts

export const COLORS = {
  // Your provided primary, secondary, accent for a vibrant green/teal theme
  primary: "#4ADE80", // Vibrant Green (used for active states, main buttons)
  secondary: "#2DD4BF", // Teal (another accent/secondary color)
  accent: "#2DD4BF", // Using secondary as accent for consistency

  // Backgrounds and surfaces for a dark mode
  background: "#000000", // Pure black for the main app background
  surface: "#1A1A1A", // Dark grey for cards/containers (slightly lighter than background)
  surfaceLight: "#2A2A2A", // Lighter dark grey for subtle differentiation (e.g., headers)
  cardBackground: "#1A1A1A", // Using surface for card backgrounds
  headerBackground: "#2A2A2A", // Using surfaceLight for headers

  // Text and UI element colors
  white: "#FFFFFF", // Pure white for primary text on dark backgrounds
  grey: "#9CA3AF", // A softer grey for secondary text (readable on dark)
  gray: "#9CA3AF", // Using the same as grey for consistency
  lightGray: "#4B5563", // Lighter grey, good for subtle borders/dividers on dark backgrounds
  darkGray: "#374151", // Even darker grey, for very subtle elements or backgrounds that need to recede
  black: "#000000", // Pure black for text or elements that need to stand out against lighter backgrounds

  // Action/status colors
  danger: "#EF4444", // Red for destructive actions (e.g., delete)
  link: "#60A5FA", // Blue for clickable links
} as const;
