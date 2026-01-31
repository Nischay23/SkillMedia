/**
 * UI Components Demo & Documentation
 * Shows how to use the three new theme-aware components
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/**
 * Example usage of all three components
 * This demonstrates how they adapt to light/dark themes
 */
export function UIComponentsDemo() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Header */}
      <View style={{ padding: theme.spacing.lg }}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.size['2xl'],
            },
          ]}
        >
          Theme-Aware Components
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.size.sm,
            },
          ]}
        >
          {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </Text>
      </View>

      {/* Component Showcase */}
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        {/* ============ 1. GlassCard Examples ============ */}
        <View>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.primary,
                fontFamily: theme.typography.fontFamily.semibold,
              },
            ]}
          >
            1. GlassCard Component
          </Text>

          {/* Glass Card - Default */}
          <GlassCard style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.typography.size.base,
                fontFamily: theme.typography.fontFamily.regular,
                marginBottom: theme.spacing.sm,
              }}
            >
              Glass Card (Default)
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.sm,
                fontFamily: theme.typography.fontFamily.regular,
              }}
            >
              {isDark
                ? '✨ Dark: Subtle glass border with smooth shadow'
                : '✨ Light: Pure white with soft purple shadow'}
            </Text>
          </GlassCard>

          {/* Glass Card - Bordered */}
          <GlassCard bordered padding="md">
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: theme.typography.size.base,
                fontFamily: theme.typography.fontFamily.semibold,
              }}
            >
              Glass Card (Bordered)
            </Text>
          </GlassCard>
        </View>

        {/* ============ 2. NeumorphicInput Examples ============ */}
        <View>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.primary,
                fontFamily: theme.typography.fontFamily.semibold,
              },
            ]}
          >
            2. NeumorphicInput Component
          </Text>

          {/* Search Input */}
          <NeumorphicInput
            placeholder="Search for courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon="search"
            isSearch
            style={{ marginBottom: theme.spacing.md }}
          />

          {/* Email Input */}
          <NeumorphicInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon="mail-outline"
            rightIcon="check-circle"
            size="lg"
          />

          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.xs,
              fontFamily: theme.typography.fontFamily.regular,
              marginTop: theme.spacing.sm,
            }}
          >
            ✨ Focus to see the glow effect and icon color change
          </Text>
        </View>

        {/* ============ 3. GradientButton Examples ============ */}
        <View>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.primary,
                fontFamily: theme.typography.fontFamily.semibold,
              },
            ]}
          >
            3. GradientButton Component
          </Text>

          {/* Primary Button - Large */}
          <GradientButton
            label="Get Started"
            onPress={() => alert('Button Pressed!')}
            size="lg"
            style={{ marginBottom: theme.spacing.md }}
          />

          {/* Primary Button - Medium */}
          <GradientButton
            label="Explore Courses"
            onPress={() => alert('Button Pressed!')}
            size="md"
            leftIcon={<MaterialIcons name="school" size={20} color="#FFF" />}
            style={{ marginBottom: theme.spacing.md }}
          />

          {/* Primary Button - Small */}
          <GradientButton
            label="Learn More"
            onPress={() => alert('Button Pressed!')}
            size="sm"
            rightIcon={
              <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
            }
          />
        </View>

        {/* ============ Combination Example ============ */}
        <View>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.primary,
                fontFamily: theme.typography.fontFamily.semibold,
              },
            ]}
          >
            Combination Example
          </Text>

          <GlassCard padding="lg">
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.typography.size.lg,
                fontFamily: theme.typography.fontFamily.bold,
                marginBottom: theme.spacing.md,
              }}
            >
              🚀 Start Learning Today
            </Text>

            <NeumorphicInput
              placeholder="Search courses..."
              leftIcon="search"
              style={{ marginBottom: theme.spacing.lg }}
            />

            <GradientButton
              label="Explore Now"
              onPress={() => alert('Navigating...')}
              size="md"
            />
          </GlassCard>
        </View>

        {/* ============ Theme Info ============ */}
        <GlassCard padding="md">
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.typography.size.sm,
              fontFamily: theme.typography.fontFamily.semibold,
              marginBottom: theme.spacing.sm,
            }}
          >
            Current Theme Colors:
          </Text>

          <View style={{ gap: theme.spacing.xs }}>
            <ColorBox
              label="Primary"
              color={theme.colors.primary}
              textColor={theme.colors.textPrimary}
            />
            <ColorBox
              label="Background"
              color={theme.colors.background}
              textColor={theme.colors.textPrimary}
            />
            <ColorBox
              label="Surface"
              color={theme.colors.surface}
              textColor={theme.colors.textPrimary}
            />
          </View>

          <GradientButton
            label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            onPress={toggleTheme}
            size="sm"
            style={{ marginTop: theme.spacing.lg }}
          />
        </GlassCard>

        {/* Spacing */}
        <View style={{ height: theme.spacing.xl }} />
      </View>
    </ScrollView>
  );
}

/**
 * Helper component to display color swatches
 */
function ColorBox({
  label,
  color,
  textColor,
}: {
  label: string;
  color: string;
  textColor: string;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.borderRadius.md,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      />
      <View>
        <Text
          style={{
            color: textColor,
            fontFamily: theme.typography.fontFamily.semibold,
            fontSize: theme.typography.size.sm,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.size.xs,
          }}
        >
          {color}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    marginTop: 8,
  },
});
