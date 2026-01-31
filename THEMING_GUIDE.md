# Robust Theming System Implementation Guide

## Overview

Your React Native Career Advisor app now has a robust, modern theming system with:
- **Light Theme**: EdTech-inspired with clean, approachable colors
- **Dark Theme**: AI/Futuristic-inspired with glowing accents
- **Custom Typography**: Poppins font family (setup with fallbacks)
- **Theme Persistence**: Automatic theme preference saving via AsyncStorage
- **Theme Toggle**: Easy switching between light/dark themes

## Architecture

### Files Structure

```
constants/
  ├── Colors.ts          # Modern color palettes (Light & Dark)
  └── theme.ts           # Complete theme object with typography & spacing

providers/
  └── ThemeProvider.tsx  # Theme context & hooks

utils/
  └── fontLoader.ts      # Font loading utilities

app/
  └── _layout.tsx        # Root layout with theme integration
```

## Color Palettes

### Light Theme (EdTech-Inspired)
```
Background: #F8F9FE (Very light purple-white)
Surface/Card: #FFFFFF
Primary: #6C5DD3 (Soft Purple)
Secondary: #FFCFA2 (Peach/Orange)
Text Primary: #1F2937 (Dark gray)
Text Secondary: #9CA3AF (Medium gray)
Border: #E5E7EB (Light gray)
```

### Dark Theme (AI/Futuristic-Inspired)
```
Background: #0F1115 (Deep Gunmetal)
Surface/Card: #181A20 (Slightly lighter gray)
Surface Highlight: #262A34
Primary: #A0A6FF (Glowing Lavender)
Accent Start: #6C5DD3 (Base purple)
Accent End: #8676FF (Lighter purple)
Text Primary: #FFFFFF
Text Secondary: #9E9E9E
Border: #2D3139 (Dark gray)
```

## Usage

### Using Themes in Components

```typescript
import { useTheme } from '@/providers/ThemeProvider';
import { StyleSheet } from 'react-native';

export function MyComponent() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.text, { color: theme.colors.textPrimary }]}>
        Current Theme: {isDark ? 'Dark' : 'Light'}
      </Text>
      <Pressable onPress={toggleTheme}>
        <Text>Toggle Theme</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
});
```

### Using Theme Context

The `useTheme()` hook provides:

```typescript
interface ThemeContextType {
  theme: {
    colors: ColorPalette;
    typography: Typography;
    spacing: Spacing;
    borderRadius: BorderRadius;
    shadows: Shadows;
    animation: Animation;
    screen: Screen;
  };
  themeMode: 'dark' | 'light' | 'system';
  setThemeMode: (mode) => Promise<void>;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  fontsLoaded: boolean;
}
```

### Creating Themed Styles

```typescript
import { useThemedStyles } from '@/providers/ThemeProvider';

export function StyledComponent() {
  const styles = useThemedStyles((theme) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.size.xl,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
    </View>
  );
}
```

## Theme Mode Options

### 1. **System** (Default)
Follows device's system theme preference. Changes automatically when user switches device theme.

```typescript
const { setThemeMode } = useTheme();
await setThemeMode('system');
```

### 2. **Light**
Always use light theme, regardless of system preference.

```typescript
await setThemeMode('light');
```

### 3. **Dark**
Always use dark theme, regardless of system preference.

```typescript
await setThemeMode('dark');
```

## Font Configuration

### Current Setup
- Using fallback fonts: SpaceMono-Regular, JetBrainsMono-Medium
- Font family keys: `'Poppins-Regular'`, `'Poppins-SemiBold'`, `'Poppins-Bold'`

### Adding Poppins Fonts

To use actual Poppins fonts instead of fallbacks:

1. **Download Poppins fonts** from https://fonts.google.com/specimen/Poppins
   - Download: Poppins-Regular.ttf, Poppins-SemiBold.ttf, Poppins-Bold.ttf

2. **Add to your project**
   ```
   assets/fonts/
   ├── Poppins-Regular.ttf
   ├── Poppins-SemiBold.ttf
   └── Poppins-Bold.ttf
   ```

3. **Enable in code** - In `utils/fontLoader.ts`:
   ```typescript
   const fontsToLoad = {
     'Poppins-Regular': require('@/assets/fonts/Poppins-Regular.ttf'),
     'Poppins-SemiBold': require('@/assets/fonts/Poppins-SemiBold.ttf'),
     'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
   };
   ```

4. **Update ThemeProvider** - In `providers/ThemeProvider.tsx`:
   ```typescript
   const [loadedFonts] = useFonts({
     'Poppins-Regular': require('@/assets/fonts/Poppins-Regular.ttf'),
     'Poppins-SemiBold': require('@/assets/fonts/Poppins-SemiBold.ttf'),
     'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
   });
   ```

## Using Typography System

```typescript
const { theme } = useTheme();

// Font sizes
theme.typography.size.xs    // 12
theme.typography.size.sm    // 14
theme.typography.size.base  // 16
theme.typography.size.lg    // 18
theme.typography.size.xl    // 20
theme.typography.size['2xl'] // 24
theme.typography.size['3xl'] // 30
theme.typography.size['4xl'] // 36

// Font families
theme.typography.fontFamily.regular    // 'Poppins-Regular'
theme.typography.fontFamily.semibold   // 'Poppins-SemiBold'
theme.typography.fontFamily.bold       // 'Poppins-Bold'

// Font weights
theme.typography.weight.light    // '300'
theme.typography.weight.normal   // '400'
theme.typography.weight.medium   // '500'
theme.typography.weight.semibold // '600'
theme.typography.weight.bold     // '700'
```

## Using Spacing System

```typescript
const { theme } = useTheme();

theme.spacing.xs   // 4
theme.spacing.sm   // 8
theme.spacing.md   // 12
theme.spacing.lg   // 16
theme.spacing.xl   // 20
theme.spacing['2xl'] // 24
theme.spacing['3xl'] // 32
theme.spacing['4xl'] // 40
theme.spacing['5xl'] // 48
theme.spacing['6xl'] // 64
```

## Persistence

Theme preferences are automatically saved to AsyncStorage:
- **Key**: `'theme_mode'`
- **Values**: `'light'`, `'dark'`, or `'system'`
- **Loaded on app start**: Theme setting is restored when app launches

## Migration Guide

If migrating existing components:

**Before:**
```typescript
import { defaultTheme } from '@/constants/theme';

<View style={{ backgroundColor: defaultTheme.colors.background }}>
```

**After:**
```typescript
import { useTheme } from '@/providers/ThemeProvider';

const { theme } = useTheme();
<View style={{ backgroundColor: theme.colors.background }}>
```

## Best Practices

1. **Always use `useTheme()` hook** instead of importing `defaultTheme` directly
2. **Use `useThemedStyles()`** for complex style objects that depend on theme
3. **Leverage spacing and typography** constants for consistency
4. **Test both themes** - manually toggle to ensure proper appearance
5. **Don't hardcode colors** - always use theme values
6. **Use theme.colors.shadow** for consistent shadow styling

## Troubleshooting

### Fonts not loading?
- Check that font files exist in `assets/fonts/`
- Verify file names match exactly (case-sensitive)
- Check console for error messages

### Theme not persisting?
- Ensure AsyncStorage permission is granted
- Check device storage space
- Try clearing app cache and reinstalling

### Colors not updating?
- Ensure component is wrapped in `ThemeProvider`
- Use `useTheme()` hook in functional components
- Rebuild and clear Metro cache: `npx expo start --clear`

## Files Modified/Created

✅ **Created:**
- `constants/Colors.ts` - Color palettes
- `utils/fontLoader.ts` - Font loading utilities

✅ **Updated:**
- `constants/theme.ts` - Integrated Colors, updated typography to Poppins
- `providers/ThemeProvider.tsx` - Added font loading, toggleTheme function
- `app/_layout.tsx` - Simplified font handling, added fontsLoaded check

## Next Steps

1. Add Poppins font files to enhance visual design
2. Update existing components to use the new theme system
3. Test theme toggle functionality across all screens
4. Create theme-aware components for consistent styling
5. Consider adding a Settings screen for theme preferences

---

**Happy Theming! 🎨**
