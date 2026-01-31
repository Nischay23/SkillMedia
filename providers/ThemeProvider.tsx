// providers/ThemeProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { createTheme } from '@/constants/theme';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: ReturnType<typeof createTheme>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
  fontsLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load custom Poppins fonts (with fallbacks)
  // To use actual Poppins fonts, download them from https://fonts.google.com/specimen/Poppins
  // and add to assets/fonts/, then uncomment the lines in utils/fontLoader.ts
  const [loadedFonts] = useFonts({
    'Poppins-Regular': require('@/assets/fonts/SpaceMono-Regular.ttf'),
    'Poppins-SemiBold': require('@/assets/fonts/JetBrainsMono-Medium.ttf'),
    'Poppins-Bold': require('@/assets/fonts/JetBrainsMono-Medium.ttf'),
  });

  useEffect(() => {
    if (loadedFonts) {
      setFontsLoaded(true);
      SplashScreen.hideAsync();
    }
  }, [loadedFonts]);
  
  // Determine actual theme based on mode
  const getActualTheme = (mode: ThemeMode) => {
    if (mode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return mode;
  };

  const actualTheme = getActualTheme(themeMode);
  const theme = createTheme(actualTheme);
  const isDark = actualTheme === 'dark';

  // Load saved theme on app start
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      if (savedTheme && ['dark', 'light', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  /**
   * Toggle between light and dark themes
   * Persists the preference to AsyncStorage
   */
  const toggleTheme = async () => {
    const newMode: ThemeMode = isDark ? 'light' : 'dark';
    await setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    isDark,
    toggleTheme,
    fontsLoaded,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility hook for themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  createStyles: (theme: ReturnType<typeof createTheme>) => T
) => {
  const { theme } = useTheme();
  return createStyles(theme);
};
