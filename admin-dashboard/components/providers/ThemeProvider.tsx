"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState, useMemo, useSyncExternalStore } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

// Get initial theme from localStorage (runs once on client)
function getInitialTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === "undefined") return defaultTheme;
  try {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    return stored || defaultTheme;
  } catch {
    return defaultTheme;
  }
}

// Get system preference
function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// SSR-safe mounting detection using useSyncExternalStore
const emptySubscribe = () => () => {};
const getServerSnapshot = () => false;
const getClientSnapshot = () => true;

function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "admin-theme",
}: ThemeProviderProps) {
  const mounted = useHasMounted();
  
  // Initialize with stored value
  const [theme, setThemeState] = useState<Theme>(() => 
    getInitialTheme(storageKey, defaultTheme)
  );

  // Compute resolved theme
  const resolvedTheme = useMemo((): "dark" | "light" => {
    if (!mounted) return "dark";
    return theme === "system" ? getSystemTheme() : theme;
  }, [theme, mounted]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    // Remove no-transitions class after initial load
    root.classList.add("no-transitions");

    // Apply theme class
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);

    // Re-enable transitions after a brief delay
    const timeout = setTimeout(() => {
      root.classList.remove("no-transitions");
    }, 50);

    return () => clearTimeout(timeout);
  }, [resolvedTheme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system" || !mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      // Force re-render to update resolvedTheme
      setThemeState((prev) => prev);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  // Prevent flash during SSR
  if (!mounted) {
    return (
      <ThemeProviderContext.Provider
        value={{
          theme: defaultTheme,
          setTheme: () => {},
          resolvedTheme: "dark",
        }}
      >
        {children}
      </ThemeProviderContext.Provider>
    );
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
