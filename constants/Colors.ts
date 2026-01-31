/**
 * Modern Theming System with Dribbble-Inspired Palettes
 * Light Theme: EdTech-inspired with clean, approachable colors
 * Dark Theme: AI/Futuristic-inspired with glowing accents
 */

export const Colors = {
  light: {
    // Primary backgrounds and surfaces
    background: '#F8F9FE', // Very light purple-white
    surface: '#FFFFFF', // Card background
    surfaceLight: '#F3F4F8',
    surfaceHighlight: '#F0F1F7',

    // Primary accent colors
    primary: '#6C5DD3', // Soft Purple
    primaryLight: '#8B7DD9',
    primaryDark: '#5A4DB5',

    // Secondary accent
    secondary: '#FFCFA2', // Peach/Orange
    secondaryLight: '#FFD9B3',
    secondaryDark: '#FFB880',

    // Text colors
    textPrimary: '#1F2937', // Dark gray-black
    textSecondary: '#9CA3AF', // Medium gray
    textMuted: '#D1D5DB', // Light gray

    // Functional colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',

    // Overlay and shadows
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(108, 93, 211, 0.1)',
  },

  dark: {
    // Primary backgrounds and surfaces
    background: '#0F1115', // Deep Gunmetal
    surface: '#181A20', // Slightly lighter gray
    surfaceLight: '#202329',
    surfaceHighlight: '#262A34', // Highlight surface

    // Primary accent colors (glowing)
    primary: '#A0A6FF', // Glowing Lavender
    primaryLight: '#B8BCFF',
    primaryDark: '#888EFF',

    // Gradient accents
    accentGradientStart: '#6C5DD3', // Base purple
    accentGradientEnd: '#8676FF', // Lighter purple

    // Text colors
    textPrimary: '#FFFFFF',
    textSecondary: '#9E9E9E',
    textMuted: '#6B7280',

    // Functional colors
    border: '#2D3139',
    borderLight: '#3F4551',
    error: '#FF6B6B',
    warning: '#FFB84D',
    success: '#4ECDC4',
    info: '#6C9EFF',

    // Overlay and shadows
    overlay: 'rgba(0, 0, 0, 0.8)',
    shadow: 'rgba(160, 166, 255, 0.15)',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ColorPalette = (typeof Colors)[ColorScheme];
