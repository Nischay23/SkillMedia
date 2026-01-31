import * as Font from "expo-font";

/**
 * Load custom fonts for the application
 * Uses Poppins family from Google Fonts as primary, with fallbacks
 * @returns Promise that resolves when fonts are loaded
 */
export const loadCustomFonts = async (): Promise<void> => {
  try {
    // Primary fonts: Poppins (uncomment once files are added)
    // const fontsToLoad = {
    //   'Poppins-Regular': require('@/assets/fonts/Poppins-Regular.ttf'),
    //   'Poppins-SemiBold': require('@/assets/fonts/Poppins-SemiBold.ttf'),
    //   'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
    // };

    // Fallback fonts (currently available)
    const fallbackFonts = {
      "Poppins-Regular": require("@/assets/fonts/SpaceMono-Regular.ttf"),
      "Poppins-SemiBold": require("@/assets/fonts/JetBrainsMono-Medium.ttf"),
      "Poppins-Bold": require("@/assets/fonts/JetBrainsMono-Medium.ttf"),
    };

    await Font.loadAsync(fallbackFonts);
  } catch (error) {
    console.error("Error loading fonts:", error);
    throw error;
  }
};

/**
 * Font family mappings for consistent usage throughout the app
 * Using Poppins as primary font family
 */
export const FontFamily = {
  regular: "Poppins-Regular",
  semibold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
} as const;

export type FontFamilyKey = keyof typeof FontFamily;
