import React from 'react';
import { View, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ThemeToggleProps {
  /**
   * Show label text ('Light', 'Dark', 'System')
   * @default true
   */
  showLabel?: boolean;

  /**
   * Show theme mode indicator text
   * @default true
   */
  showModeText?: boolean;

  /**
   * Style overrides for the container
   */
  style?: ViewStyle;

  /**
   * Toggle mode: 'quick' (light/dark) or 'full' (light/dark/system)
   * @default 'quick'
   */
  mode?: 'quick' | 'full';

  /**
   * Size of the toggle: 'small' | 'medium' | 'large'
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = {
  small: {
    iconSize: 20,
    padding: 8,
    fontSize: 12,
  },
  medium: {
    iconSize: 24,
    padding: 12,
    fontSize: 14,
  },
  large: {
    iconSize: 28,
    padding: 16,
    fontSize: 16,
  },
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = true,
  showModeText = true,
  style,
  mode = 'quick',
  size = 'medium',
}) => {
  const { theme, isDark, toggleTheme, setThemeMode, themeMode } = useTheme();
  const config = sizeConfig[size];

  const handleToggle = async () => {
    if (mode === 'quick') {
      await toggleTheme();
    } else {
      // Cycle through: light -> dark -> system -> light
      if (themeMode === 'light') {
        await setThemeMode('dark');
      } else if (themeMode === 'dark') {
        await setThemeMode('system');
      } else {
        await setThemeMode('light');
      }
    }
  };

  const getThemeLabel = () => {
    if (themeMode === 'system') return 'System';
    return isDark ? 'Dark' : 'Light';
  };

  return (
    <Pressable
      onPress={handleToggle}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          padding: config.padding,
        },
        style,
      ]}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        {isDark ? (
          <MaterialIcons
            name="dark-mode"
            size={config.iconSize}
            color={theme.colors.primary}
          />
        ) : (
          <MaterialIcons
            name="light-mode"
            size={config.iconSize}
            color={theme.colors.primary}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {showLabel && (
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.textSecondary,
                fontSize: config.fontSize - 2,
              },
            ]}
          >
            Theme
          </Text>
        )}

        {showModeText && (
          <Text
            style={[
              styles.modeText,
              {
                color: theme.colors.textPrimary,
                fontSize: config.fontSize,
                fontFamily: theme.typography.fontFamily.semibold,
              },
            ]}
          >
            {getThemeLabel()}
          </Text>
        )}
      </View>

      {/* Chevron indicator */}
      <MaterialIcons
        name="chevron-right"
        size={config.iconSize}
        color={theme.colors.textSecondary}
      />
    </Pressable>
  );
};

/**
 * Quick Theme Toggle Button
 * Minimal toggle for headers or quick access
 */
export const QuickThemeToggle: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.surfaceHighlight,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <MaterialIcons
        name={isDark ? 'light-mode' : 'dark-mode'}
        size={24}
        color={theme.colors.primary}
      />
    </Pressable>
  );
};

/**
 * Theme Mode Selector
 * Shows all three theme modes: Light, Dark, System
 */
export const ThemeModeSelector: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme, setThemeMode, themeMode } = useTheme();

  const modes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];

  const getModeLabel = (m: typeof modes[0]) => {
    return m.charAt(0).toUpperCase() + m.slice(1);
  };

  const getModeIcon = (m: typeof modes[0]) => {
    switch (m) {
      case 'light':
        return 'light-mode';
      case 'dark':
        return 'dark-mode';
      case 'system':
        return 'brightness-auto';
      default:
        return 'palette';
    }
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {modes.map((m) => (
        <Pressable
          key={m}
          onPress={() => setThemeMode(m)}
          style={[
            {
              flex: 1,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
              backgroundColor:
                themeMode === m
                  ? theme.colors.primary
                  : theme.colors.surfaceLight,
              alignItems: 'center',
              gap: theme.spacing.xs,
            },
          ]}
        >
          <MaterialIcons
            name={getModeIcon(m)}
            size={20}
            color={themeMode === m ? '#FFF' : theme.colors.textPrimary}
          />
          <Text
            style={{
              fontSize: 12,
              color: themeMode === m ? '#FFF' : theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily.semibold,
            }}
          >
            {getModeLabel(m)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontWeight: '500',
  },
  modeText: {
    fontWeight: '600',
  },
});
