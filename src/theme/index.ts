/**
 * index.ts - Theme System Central Export
 *
 * This is the main entry point for the theme system.
 * It exports all design tokens from one convenient location.
 *
 * WHAT IS AN INDEX FILE?
 * ======================
 * An index.ts file acts as a "barrel" that re-exports items from multiple files.
 * Instead of importing from many files, you import from one place!
 *
 * Without index.ts (the hard way):
 * ```typescript
 * import { colors } from '../theme/colors';
 * import { spacing } from '../theme/spacing';
 * import { headings } from '../theme/typography';
 * import { radius } from '../theme/radius';
 * // ... many more imports
 * ```
 *
 * With index.ts (the easy way):
 * ```typescript
 * import { colors, spacing, headings, radius } from '../theme';
 * // One line! Much cleaner!
 * ```
 *
 * WHY USE A BARREL EXPORT?
 * ========================
 * 1. **Convenience**: Import everything from one place
 * 2. **Cleaner Code**: Fewer import statements
 * 3. **Flexibility**: Easy to reorganize files without breaking imports
 * 4. **Discoverability**: IDE autocomplete shows all available exports
 */

/**
 * ============================================================================
 * COLOR EXPORTS
 * ============================================================================
 * Import and re-export the color palette
 */
export { colors } from './colors';

/**
 * ============================================================================
 * SPACING EXPORTS
 * ============================================================================
 * Import and re-export spacing values and utilities
 */
export {
  spacing,           // The spacing scale (xxs, xs, sm, md, lg, etc.)
  layout,            // Layout-specific spacing (screenHorizontal, cardPadding, etc.)
  horizontal,        // Helper: paddingHorizontal
  vertical,          // Helper: paddingVertical
  all,               // Helper: padding on all sides
  custom,            // Helper: custom padding per side
} from './spacing';

/**
 * ============================================================================
 * TYPOGRAPHY EXPORTS
 * ============================================================================
 * Import and re-export all typography-related values
 */
export {
  fontFamily,        // Font families (regular, medium, bold, mono)
  fontWeight,        // Font weights (normal, medium, semibold, bold)
  fontSize,          // Font size scale (xxs, xs, sm, md, lg, etc.)
  lineHeight,        // Line height multipliers (tight, normal, loose)
  letterSpacing,     // Letter spacing values (tight, normal, wide, wider)
  headings,          // Heading styles (h1, h2, h3, h4)
  body,              // Body text styles (large, regular, small, medium, bold)
  special,           // Special text styles (caption, overline, button, link, etc.)
} from './typography';

/**
 * ============================================================================
 * RADIUS EXPORTS
 * ============================================================================
 * Import and re-export border radius values and utilities
 */
export {
  radius,            // Radius scale (none, xs, sm, md, lg, xl, xxl, round, full)
  componentRadius,   // Component-specific radius (button, card, input, etc.)
  topOnly,           // Helper: round only top corners
  bottomOnly,        // Helper: round only bottom corners
  leftOnly,          // Helper: round only left corners
  rightOnly,         // Helper: round only right corners
} from './radius';

// Re-export custom helper with alias to avoid conflict with spacing's custom
export { custom as customRadius } from './radius';

/**
 * ============================================================================
 * SHADOW EXPORTS
 * ============================================================================
 * Import and re-export shadow/elevation styles
 */
export {
  // Individual shadow sizes
  none as shadowNone,
  xs as shadowXs,
  sm as shadowSm,
  md as shadowMd,
  lg as shadowLg,
  xl as shadowXl,
  xxl as shadowXxl,
  max as shadowMax,
  // Complete shadows object
  shadows,
  // Component shadows
  componentShadows,
  // Colored shadow helper
  coloredShadow,
} from './shadows';

/**
 * ============================================================================
 * ANIMATION EXPORTS
 * ============================================================================
 * Import and re-export animation timing and easing
 */
export {
  duration,          // Duration scale (instant, fastest, fast, normal, etc.)
  easing,            // Easing curves (linear, ease, easeIn, easeOut, easeInOut)
  spring,            // Spring configurations (gentle, default, bouncy, snappy)
  bezier,            // Bezier curves for custom easing
  componentAnimations, // Component-specific animations
  animations,        // Complete animations object
} from './animations';

/**
 * ============================================================================
 * ICON EXPORTS
 * ============================================================================
 * Import and re-export icon sizes and utilities
 */
export {
  iconSize,          // Icon size scale (xxs, xs, sm, md, lg, etc.)
  touchTarget,       // Touch target sizes (minimum, comfortable, large)
  componentIconSizes, // Component-specific icon sizes
  getTouchTargetPadding, // Helper: calculate padding for touch target
  getIconForTextSize,    // Helper: get icon size for text size
  icons,             // Complete icons object
} from './icons';

/**
 * ============================================================================
 * TYPE EXPORTS
 * ============================================================================
 * Import and re-export TypeScript types
 */
export type {
  // Color types
  BrandColors,
  BackgroundColors,
  TextColors,
  ColorPalette,
  // Spacing types
  SpacingScale,
  LayoutSpacing,
  // Typography types
  FontFamily,
  FontWeight,
  FontSizeScale,
  TextStyleObject,
  HeadingStyles,
  BodyStyles,
  SpecialTextStyles,
  // Radius types
  RadiusScale,
  ComponentRadius,
  // Shadow types
  ShadowStyle,
  ComponentShadows,
  // Animation types
  DurationScale,
  EasingCurves,
  SpringConfig,
  // Icon types
  IconSizeScale,
  TouchTargetSizes,
  // Main theme type
  Theme,
  // Utility types
  KeysOf,
  ValuesOf,
  Optional,
  Required,
} from './types';

/**
 * ============================================================================
 * COMPLETE THEME OBJECT
 * ============================================================================
 * A single object containing the entire theme.
 * Useful when you need to pass the whole theme as a prop or context.
 */
import { colors } from './colors';
import { spacing, layout } from './spacing';
import {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  headings,
  body,
  special,
} from './typography';
import { radius, componentRadius } from './radius';
import {
  none,
  xs as shadowXsValue,
  sm as shadowSmValue,
  md as shadowMdValue,
  lg as shadowLgValue,
  xl as shadowXlValue,
  xxl as shadowXxlValue,
  max as shadowMaxValue,
  componentShadows,
} from './shadows';
import { duration, easing } from './animations';
import { iconSize, touchTarget } from './icons';

/**
 * The complete theme object
 * Contains all design tokens in a single, organized structure
 */
export const theme = {
  colors,
  spacing,
  layout,
  typography: {
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight,
    letterSpacing,
    headings,
    body,
    special,
  },
  radius,
  componentRadius,
  shadows: {
    none,
    xs: shadowXsValue,
    sm: shadowSmValue,
    md: shadowMdValue,
    lg: shadowLgValue,
    xl: shadowXlValue,
    xxl: shadowXxlValue,
    max: shadowMaxValue,
    component: componentShadows,
  },
  animations: {
    duration,
    easing,
  },
  icons: {
    size: iconSize,
    touchTarget,
  },
} as const;

/**
 * HOW TO USE THE THEME:
 * =====================
 *
 * OPTION 1: Import individual values (recommended for most cases)
 * ```typescript
 * import { colors, spacing, headings, radius } from '../theme';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: colors.surface,
 *     padding: spacing.lg,
 *     borderRadius: radius.md,
 *   },
 *   title: {
 *     ...headings.h1,
 *     color: colors.textPrimary,
 *   }
 * });
 * ```
 *
 * OPTION 2: Import the complete theme object
 * ```typescript
 * import { theme } from '../theme';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: theme.colors.surface,
 *     padding: theme.spacing.lg,
 *     borderRadius: theme.radius.md,
 *   },
 *   title: {
 *     ...theme.typography.headings.h1,
 *     color: theme.colors.textPrimary,
 *   }
 * });
 * ```
 *
 * OPTION 3: Import specific items you need
 * ```typescript
 * import {
 *   colors,
 *   spacing,
 *   headings,
 *   body,
 *   radius,
 *   shadowSm,
 * } from '../theme';
 * ```
 *
 * Choose the option that makes your code most readable!
 */

/**
 * THEME PROVIDER (for advanced usage)
 * ====================================
 * Later, you can create a ThemeProvider using React Context to:
 * - Support light/dark themes
 * - Allow theme customization
 * - Switch themes dynamically
 *
 * Example structure (for future learning):
 * ```typescript
 * import React, { createContext, useContext } from 'react';
 * import { theme } from './theme';
 *
 * const ThemeContext = createContext(theme);
 *
 * export const ThemeProvider = ({ children }) => (
 *   <ThemeContext.Provider value={theme}>
 *     {children}
 *   </ThemeContext.Provider>
 * );
 *
 * export const useTheme = () => useContext(ThemeContext);
 * ```
 *
 * Then in components:
 * ```typescript
 * const { colors, spacing } = useTheme();
 * ```
 *
 * For now, direct imports are simpler and perfect for learning!
 */

/**
 * QUICK REFERENCE GUIDE:
 * ======================
 *
 * Colors:          colors.primary, colors.textPrimary
 * Spacing:         spacing.md, layout.screenHorizontal
 * Typography:      headings.h1, body.regular, fontSize.md
 * Radius:          radius.md, componentRadius.button.default
 * Shadows:         shadowSm, shadowMd, shadows.component.card.default
 * Animations:      duration.normal, easing.easeOut
 * Icons:           iconSize.md, touchTarget.minimum
 *
 * Helpers:
 * - horizontal(spacing.lg) → paddingHorizontal
 * - vertical(spacing.md) → paddingVertical
 * - topOnly(radius.xl) → round only top corners
 * - getTouchTargetPadding(24) → calculate padding for 44px touch target
 */

/**
 * BENEFITS OF THIS DESIGN SYSTEM:
 * ================================
 *
 * 1. ✅ Consistency - All screens use the same values
 * 2. ✅ Maintainability - Change once, updates everywhere
 * 3. ✅ Scalability - Easy to add new components
 * 4. ✅ Discoverability - Autocomplete shows all options
 * 5. ✅ Type Safety - TypeScript catches errors
 * 6. ✅ Documentation - Comments explain everything
 * 7. ✅ Learning - Each file teaches design principles
 * 8. ✅ Professional - Industry-standard approach
 *
 * You now have a complete, professional design system! 🎉
 */
