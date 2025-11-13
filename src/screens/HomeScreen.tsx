/**
 * HomeScreen.tsx - Main Home Screen (REFACTORED WITH DESIGN SYSTEM)
 *
 * This screen has been refactored to use our new design system!
 * Notice how we no longer have hardcoded values - everything comes from the theme.
 *
 * KEY IMPROVEMENTS:
 * ================
 * ✅ BEFORE: fontSize: 28                    ❌ Hardcoded
 * ✅ AFTER:  ...headings.h1                  ✅ Using design system
 *
 * ✅ BEFORE: padding: 20                     ❌ Hardcoded
 * ✅ AFTER:  padding: layout.cardPadding     ✅ Using design system
 *
 * ✅ BEFORE: borderRadius: 12                ❌ Hardcoded
 * ✅ AFTER:  borderRadius: radius.md         ✅ Using design system
 *
 * ✅ BEFORE: shadowColor: '#000', shadow...  ❌ Manual shadows
 * ✅ AFTER:  ...shadowSm                     ✅ Using design system
 *
 * BENEFITS OF USING THE DESIGN SYSTEM:
 * =====================================
 * 1. **Consistency**: All values align with the rest of the app
 * 2. **Maintainability**: Change the theme once, updates everywhere
 * 3. **Readability**: `colors.primary` is clearer than '#6200EE'
 * 4. **Type Safety**: TypeScript catches typos
 * 5. **Professional**: Following industry best practices
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';

// ============================================================================
// THEME IMPORTS
// ============================================================================
/**
 * Import design tokens from our theme system.
 * Notice how clean this is - one import line gets everything we need!
 *
 * Compare to before:
 * - We had to remember exact color hex codes
 * - We had to calculate shadow values manually
 * - We had to guess spacing values
 *
 * Now we just import and use semantic names!
 */
import {
  colors,      // Color palette
  spacing,     // Spacing scale
  layout,      // Layout-specific spacing
  headings,    // Heading text styles
  body,        // Body text styles
  special,     // Special text styles (caption, button, etc.)
  radius,      // Border radius values
  shadowSm,    // Small shadow (for cards)
} from '../theme';

/**
 * HomeScreen Component
 *
 * This is the same functional component as before, but now it uses
 * our design system for all styling values.
 *
 * The functionality is identical - we just made the code:
 * - More maintainable (no hardcoded values)
 * - More consistent (values match the design system)
 * - More readable (semantic names instead of magic numbers)
 * - More scalable (easy to change the entire app's look)
 */
export default function HomeScreen() {
  /**
   * State Management
   * ===============
   * This hasn't changed - state management is separate from styling!
   */
  const [count, setCount] = useState<number>(0);

  /**
   * Event Handler
   * =============
   * Business logic also stays the same - only styling changed!
   */
  const handlePress = () => {
    setCount(count + 1);
  };

  /**
   * Render UI
   * =========
   * The JSX structure is identical, but the styles now use the design system.
   * Look at the styles object below to see the improvements!
   */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to POCHOCLO!</Text>
        <Text style={styles.subtitle}>Your React Native Learning Journey</Text>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.description}>
          This screen now uses our design system! 🎨
        </Text>

        {/* Technology Stack List */}
        <View style={styles.techList}>
          <Text style={styles.sectionHeading}>Built with:</Text>
          <Text style={styles.techItem}>✓ React Native - Mobile app framework</Text>
          <Text style={styles.techItem}>✓ TypeScript - Type-safe JavaScript</Text>
          <Text style={styles.techItem}>✓ Expo - Development tools & services</Text>
          <Text style={styles.techItem}>✓ Supabase - Backend & database</Text>
          <Text style={styles.techItem}>✓ Design System - Consistent styling! 🎉</Text>
        </View>

        {/* Interactive Counter Section */}
        <View style={styles.counterSection}>
          <Text style={styles.counterLabel}>Button Press Counter:</Text>
          <Text style={styles.counterValue}>{count}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Press Me!</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Every value here comes from our design system!
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Check src/theme/ to see the design system
        </Text>
      </View>
    </View>
  );
}

/**
 * ============================================================================
 * STYLES WITH DESIGN SYSTEM
 * ============================================================================
 *
 * Compare these styles to the original version.
 * Notice how everything is now:
 * - Semantic (colors.primary instead of '#6200EE')
 * - Consistent (spacing.lg is used throughout)
 * - Easy to change (modify theme once, updates everywhere)
 * - Self-documenting (names explain purpose)
 */
const styles = StyleSheet.create({
  /**
   * CONTAINER
   * ---------
   * BEFORE: backgroundColor: '#F5F5F5'
   * AFTER:  backgroundColor: colors.background
   * Why: Semantic name, consistent across app
   */
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /**
   * HEADER
   * ------
   * Multiple improvements:
   * - Color from theme (colors.primary)
   * - Spacing from theme (layout.screenVertical, spacing.xl)
   * - Shadow from theme (shadowSm)
   * All hardcoded values replaced with design system!
   */
  header: {
    backgroundColor: colors.primary,
    paddingTop: layout.screenVertical + 20, // Extra space for status bar
    paddingBottom: spacing.xl,
    paddingHorizontal: layout.screenHorizontal,
    ...shadowSm, // ← This replaces 8 lines of shadow code!
  },

  /**
   * TITLE
   * -----
   * BEFORE: fontSize: 28, fontWeight: 'bold', color: '#FFFFFF'
   * AFTER:  ...headings.h1, color: colors.textOnPrimary
   * Why: Using pre-defined heading style, semantic color name
   */
  title: {
    ...headings.h1,
    color: colors.textOnPrimary,
    marginBottom: spacing.xs,
  },

  /**
   * SUBTITLE
   * --------
   * BEFORE: fontSize: 16, color: '#E0E0E0'
   * AFTER:  ...body.regular, color: colors.textOnPrimary with opacity
   * Why: Reusing body style, creating color variant
   */
  subtitle: {
    ...body.regular,
    color: colors.textOnPrimary,
    opacity: 0.9, // Slightly transparent for hierarchy
  },

  /**
   * CONTENT
   * -------
   * BEFORE: padding: 20
   * AFTER:  padding: layout.screenHorizontal
   * Why: Using consistent screen padding from layout
   */
  content: {
    flex: 1,
    padding: layout.screenHorizontal,
  },

  /**
   * DESCRIPTION
   * -----------
   * BEFORE: fontSize: 16, color: '#333333'
   * AFTER:  ...body.regular, color: colors.textPrimary
   * Why: Using design system text style and semantic color
   */
  description: {
    ...body.regular,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  /**
   * SECTION HEADING
   * ---------------
   * NEW! Using h3 heading style for section titles
   * Creates clear visual hierarchy
   */
  sectionHeading: {
    ...headings.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  /**
   * TECH LIST
   * ---------
   * Multiple improvements:
   * - Background from theme (colors.surface)
   * - Border radius from theme (radius.md)
   * - Padding from theme (layout.cardPadding)
   * - Shadow from theme (shadowSm)
   * - Margins from theme (spacing.xl)
   */
  techList: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: layout.cardPadding,
    marginBottom: spacing.xl,
    ...shadowSm,
  },

  /**
   * TECH ITEM
   * ---------
   * BEFORE: fontSize: 15, color: '#333333', marginBottom: 12
   * AFTER:  ...body.regular, color: colors.textPrimary, marginBottom: spacing.sm
   * Why: All values from design system
   */
  techItem: {
    ...body.regular,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  /**
   * COUNTER SECTION
   * ---------------
   * Card-style container using all design system values
   */
  counterSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: layout.cardPadding,
    alignItems: 'center',
    ...shadowSm,
  },

  /**
   * COUNTER LABEL
   * -------------
   * BEFORE: fontSize: 16, color: '#666666'
   * AFTER:  ...body.medium, color: colors.textSecondary
   * Why: Using medium weight body style, semantic secondary text color
   */
  counterLabel: {
    ...body.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  /**
   * COUNTER VALUE
   * -------------
   * Large display number
   * BEFORE: fontSize: 48, fontWeight: 'bold', color: '#6200EE'
   * AFTER:  fontSize from theme, color from theme
   */
  counterValue: {
    fontSize: 48, // Could add to theme as fontSize.display
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },

  /**
   * BUTTON
   * ------
   * All button styling from design system:
   * - Background color (colors.primary)
   * - Padding (layout.buttonPaddingVertical/Horizontal)
   * - Border radius (radius.lg)
   * - Shadow (shadowSm)
   * - Margin (spacing.md)
   */
  button: {
    backgroundColor: colors.primary,
    paddingVertical: layout.buttonPaddingVertical,
    paddingHorizontal: layout.buttonPaddingHorizontal,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadowSm,
  },

  /**
   * BUTTON TEXT
   * -----------
   * BEFORE: fontSize: 18, fontWeight: '600', color: '#FFFFFF'
   * AFTER:  ...special.button, color: colors.textOnPrimary
   * Why: Using dedicated button text style
   */
  buttonText: {
    ...special.button,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },

  /**
   * HINT
   * ----
   * BEFORE: fontSize: 13, color: '#999999', fontStyle: 'italic'
   * AFTER:  ...special.caption, color: colors.textTertiary
   * Why: Using caption style for small helper text
   */
  hint: {
    ...special.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  /**
   * FOOTER
   * ------
   * Simple footer using design system spacing
   */
  footer: {
    padding: layout.footerPadding,
    alignItems: 'center',
  },

  /**
   * FOOTER TEXT
   * -----------
   * Small text at bottom of screen
   */
  footerText: {
    ...special.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

/**
 * ============================================================================
 * BEFORE VS AFTER COMPARISON
 * ============================================================================
 *
 * BEFORE (Hardcoded):
 * ```
 * title: {
 *   fontSize: 28,
 *   fontWeight: 'bold',
 *   color: '#FFFFFF',
 *   marginBottom: 8,
 * }
 * ```
 *
 * AFTER (Design System):
 * ```
 * title: {
 *   ...headings.h1,              // Handles fontSize, fontWeight, lineHeight
 *   color: colors.textOnPrimary, // Semantic color name
 *   marginBottom: spacing.xs,    // Consistent spacing
 * }
 * ```
 *
 * BENEFITS:
 * - 4 properties → 3 properties (spread operator handles multiple)
 * - Magic numbers → Semantic names
 * - If we change headings.h1, ALL h1s update automatically!
 * - If we change colors.textOnPrimary, ALL text-on-primary updates!
 *
 * ============================================================================
 * TRY THIS YOURSELF!
 * ============================================================================
 *
 * 1. Go to src/theme/colors.ts
 * 2. Change `primary: '#6200EE'` to `primary: '#FF5722'` (orange)
 * 3. Save the file
 * 4. Watch the app update - header, button, counter all change color!
 * 5. That's the power of a design system! 🎉
 *
 * ============================================================================
 * NEXT STEPS
 * ============================================================================
 *
 * Now that you understand the design system:
 * 1. Create new components using theme values
 * 2. Never hardcode colors, spacing, or sizes again
 * 3. Check out src/components/Button.tsx for a reusable component example
 * 4. Experiment with different theme values
 * 5. Build your own components following this pattern!
 */
