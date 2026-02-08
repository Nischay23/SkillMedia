"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "dropdown" | "switch";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (variant === "switch") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-sm text-muted-foreground">Theme</span>
        <div className="flex items-center rounded-lg bg-muted p-1">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "rounded-md p-1.5 transition-all",
              theme === "light"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Light mode"
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "rounded-md p-1.5 transition-all",
              theme === "dark"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Dark mode"
          >
            <Moon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTheme("system")}
            className={cn(
              "rounded-md p-1.5 transition-all",
              theme === "system"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="System preference"
          >
            <Monitor className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Default icon variant - cycles through themes
  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-5 w-5" />;
    }
    return resolvedTheme === "dark" ? (
      <Moon className="h-5 w-5" />
    ) : (
      <Sun className="h-5 w-5" />
    );
  };

  const getLabel = () => {
    if (theme === "system") return "System";
    return theme === "dark" ? "Dark" : "Light";
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "flex items-center gap-2 rounded-lg p-2 text-muted-foreground transition-all",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
      title={`Theme: ${getLabel()}`}
    >
      {getIcon()}
    </button>
  );
}
