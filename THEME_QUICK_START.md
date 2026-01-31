# Quick Start: Theme System

## ✅ What's Been Set Up

Your app now has a complete, production-ready theming system with:

1. **Modern Color Palettes** (`constants/Colors.ts`)
   - Light theme: EdTech-inspired (clean, professional)
   - Dark theme: AI/Futuristic (glowing, modern)

2. **Typography System** (`constants/theme.ts`)
   - Poppins font family (with fallbacks)
   - Complete spacing, typography, shadows, and border radius

3. **Theme Provider** (`providers/ThemeProvider.tsx`)
   - ✨ Auto-loads fonts
   - 🔄 Persists theme preference to AsyncStorage
   - 🎨 Provides theme context to entire app
   - 🎯 Includes `toggleTheme()` function

4. **Theme Toggle Components** (`components/ui/ThemeToggle.tsx`)
   - `<ThemeToggle />` - Full featured toggle component
   - `<QuickThemeToggle />` - Minimal button for headers
   - `<ThemeModeSelector />` - Choose between Light/Dark/System

5. **Root Layout** (`app/_layout.tsx`)
   - Already wrapped with ThemeProvider
   - Automatically applies theme to status bar and nav bar

## 🚀 Quick Usage Examples

### Example 1: Use Theme in a Component

```typescript
import { useTheme } from '@/providers/ThemeProvider';
import { View, Text, StyleSheet } from 'react-native';

export function MyScreen() {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        Welcome to {isDark ? 'Dark' : 'Light'} Theme!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '600' },
});
```

### Example 2: Add Theme Toggle to Your App

Add this to any screen (e.g., Profile or Settings):

```typescript
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function SettingsScreen() {
  return (
    <View>
      <ThemeToggle
        showLabel={true}
        showModeText={true}
        mode="full"  // Shows Light/Dark/System options
        size="medium"
      />
    </View>
  );
}
```

### Example 3: Quick Toggle in Header

```typescript
import { QuickThemeToggle } from '@/components/ui/ThemeToggle';

export function Header() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>My App</Text>
      <QuickThemeToggle />  {/* Click to toggle theme */}
    </View>
  );
}
```

### Example 4: Using Theme in Styled Components

```typescript
import { useThemedStyles } from '@/providers/ThemeProvider';

export function Card() {
  const styles = useThemedStyles((theme) =>
    StyleSheet.create({
      card: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.md,
      },
      title: {
        fontSize: theme.typography.size.lg,
        fontFamily: theme.typography.fontFamily.semibold,
        color: theme.colors.textPrimary,
      },
    })
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Card Title</Text>
    </View>
  );
}
```

## 🎨 Color Reference

### Light Theme

```
Primary: #6C5DD3 (Soft Purple)
Secondary: #FFCFA2 (Peach/Orange)
Background: #F8F9FE
Surface: #FFFFFF
Text: #1F2937
```

### Dark Theme

```
Primary: #A0A6FF (Glowing Lavender)
Secondary: #8676FF (Lighter Purple)
Background: #0F1115 (Deep Gunmetal)
Surface: #181A20
Text: #FFFFFF
```

## 📝 Accessing Theme Values

```typescript
const { theme } = useTheme();

// Colors
theme.colors.primary;
theme.colors.background;
theme.colors.surface;
theme.colors.textPrimary;

// Spacing
theme.spacing.sm; // 8
theme.spacing.md; // 12
theme.spacing.lg; // 16

// Typography
theme.typography.size.base; // 16
theme.typography.fontFamily.bold; // 'Poppins-Bold'

// Border Radius
theme.borderRadius.md; // 8
theme.borderRadius.lg; // 12

// Shadows
theme.shadows.md; // { shadowOffset, shadowOpacity, ... }

// Screen Info
theme.screen.width;
theme.screen.height;
theme.screen.isSmall;
```

## 🔧 Customization

### Change Default Theme

In `providers/ThemeProvider.tsx`, change:

```typescript
const [themeMode, setThemeModeState] =
  useState<ThemeMode>("system");
```

To:

```typescript
const [themeMode, setThemeModeState] =
  useState<ThemeMode>("dark"); // Always start with dark
```

### Modify Colors

Edit `constants/Colors.ts` to adjust any color:

```typescript
export const Colors = {
  light: {
    primary: "#YOUR_COLOR", // Change hex value
    // ... other colors
  },
  dark: {
    primary: "#YOUR_COLOR",
    // ... other colors
  },
};
```

### Add Custom Colors

Add new color values to `Colors.ts`:

```typescript
export const Colors = {
  light: {
    // ... existing colors
    customColor: "#F0F0F0",
  },
  dark: {
    // ... existing colors
    customColor: "#2A2A2A",
  },
};
```

Then update `theme.ts` to include them in the theme object.

## 🎁 Bonus: Use Poppins Font

The system is ready for Poppins! Just:

1. Download from [Google Fonts](https://fonts.google.com/specimen/Poppins)
2. Add `.ttf` files to `assets/fonts/`
3. Uncomment in `utils/fontLoader.ts`
4. Update `providers/ThemeProvider.tsx`

See [THEMING_GUIDE.md](./THEMING_GUIDE.md) for detailed instructions.

## 🚫 Important Notes

- ❌ Don't use hardcoded colors - always use `theme.colors.*`
- ❌ Don't forget `useTheme()` hook in components
- ✅ Always wrap components in `ThemeProvider` (already done in `_layout.tsx`)
- ✅ Test both light and dark themes

## 📚 Full Documentation

See [THEMING_GUIDE.md](./THEMING_GUIDE.md) for:

- Complete API reference
- Advanced usage patterns
- Architecture explanation
- Troubleshooting guide

## 🎯 Next Steps

1. **Add a settings screen** with theme selection
2. **Update existing components** to use the new theme
3. **Test theme toggle** across all screens
4. **Add Poppins fonts** for the complete design
5. **Customize colors** if needed

---

**Ready to use!** Start implementing the theme in your components. 🎨
