/**
 * colors.ts - Color Design Tokens
 *
 * This file defines all colors used throughout the app in one centralized location.
 * This is a fundamental principle of design systems called "Single Source of Truth".
 *
 * WHY USE A COLOR SYSTEM?
 * ========================
 * Instead of writing '#6200EE' everywhere in your code, you write colors.primary.
 * Benefits:
 * 1. Consistency: All buttons use the same purple
 * 2. Maintainability: Change one value, updates everywhere
 * 3. Readability: colors.primary is clearer than '#6200EE'
 * 4. Flexibility: Easy to add dark mode or theme switching later
 *
 * COLOR NAMING CONVENTIONS:
 * =========================
 * We use semantic names (what they represent) not descriptive names (what they look like)
 * ✅ Good: colors.primary, colors.textPrimary
 * ❌ Bad: colors.purple, colors.darkGray
 *
 * Why? If you decide purple should be blue, "colors.purple" doesn't make sense anymore.
 * But "colors.primary" always represents your primary brand color, regardless of hue.
 */

/**
 * Brand Colors - Your App's Identity
 * ===================================
 * These are the main colors that define your brand/app personality.
 * Typically chosen based on your brand guidelines or design preferences.
 */
export const colors = {
  /**
   * PRIMARY COLOR - Main Brand Color
   * Used for: Primary buttons, links, active states, main CTAs
   * This is the color users will most associate with your app
   */
  primary: '#6200EE',        // Vibrant purple
  primaryLight: '#7F39FB',   // Lighter shade for hover/pressed states
  primaryDark: '#3700B3',    // Darker shade for emphasis

  /**
   * SECONDARY COLOR - Complementary Accent
   * Used for: Secondary buttons, highlights, floating action buttons
   * Should complement (not clash with) your primary color
   */
  secondary: '#03DAC6',      // Teal/cyan
  secondaryLight: '#66FFF9', // Lighter teal
  secondaryDark: '#00A896',  // Darker teal

  /**
   * BACKGROUND COLORS - Surface Colors
   * ==================================
   * These create the foundation layers of your UI.
   * Following a hierarchy from base to elevated surfaces.
   */

  /** Main app background - the canvas everything sits on */
  background: '#F5F5F5',     // Very light gray (easier on eyes than pure white)

  /** Surface color - for cards, modals, sheets */
  surface: '#FFFFFF',        // Pure white for elevated content

  /** Alternative surface for variety or disabled states */
  surfaceAlt: '#FAFAFA',     // Slightly off-white

  /**
   * TEXT COLORS - Typography Hierarchy
   * ===================================
   * Different text colors create visual hierarchy.
   * Not all text should be the same color!
   */

  /** Primary text - Main content, headings */
  textPrimary: '#1C1C1E',    // Almost black (pure black can be harsh)

  /** Secondary text - Supporting content, captions */
  textSecondary: '#8E8E93',  // Medium gray

  /** Tertiary text - Hints, placeholders, disabled text */
  textTertiary: '#C7C7CC',   // Light gray

  /** Text on colored backgrounds (like buttons) */
  textOnPrimary: '#FFFFFF',  // White text on purple buttons
  textOnSecondary: '#000000', // Black text on teal buttons

  /**
   * BORDER & DIVIDER COLORS
   * ========================
   * Subtle lines to separate content without being distracting
   */
  border: '#E5E5EA',         // Light gray border
  borderLight: '#F2F2F7',    // Very subtle border
  divider: '#D1D1D6',        // Slightly more prominent divider

  /**
   * STATE COLORS - Feedback & Communication
   * ========================================
   * These colors communicate status to users
   * Following universal color psychology:
   * - Green = Success, Safe, Go
   * - Red = Error, Danger, Stop
   * - Yellow/Orange = Warning, Caution
   * - Blue = Info, Neutral
   */

  /** Success - Positive feedback (form submitted, action completed) */
  success: '#34C759',        // Bright green
  successLight: '#E8F8EC',   // Light green background
  successDark: '#248A3D',    // Dark green for text

  /** Error - Negative feedback (validation errors, failed actions) */
  error: '#FF3B30',          // Bright red
  errorLight: '#FFE5E5',     // Light red background
  errorDark: '#C92A2A',      // Dark red for text

  /** Warning - Caution messages (unsaved changes, approaching limits) */
  warning: '#FF9500',        // Bright orange
  warningLight: '#FFF4E5',   // Light orange background
  warningDark: '#C97A00',    // Dark orange for text

  /** Info - Neutral information (tips, informational messages) */
  info: '#007AFF',           // Bright blue
  infoLight: '#E5F1FF',      // Light blue background
  infoDark: '#0051D5',       // Dark blue for text

  /**
   * INTERACTIVE ELEMENT COLORS
   * ===========================
   * Colors for interactive states (buttons, links, etc.)
   */

  /** Overlay colors - for modals, bottom sheets */
  overlay: 'rgba(0, 0, 0, 0.5)',      // Semi-transparent black
  overlayLight: 'rgba(0, 0, 0, 0.3)', // Lighter overlay

  /** Disabled state - non-interactive elements */
  disabled: '#C7C7CC',       // Gray color
  disabledBackground: '#F2F2F7', // Light gray background

  /** Ripple effect color (for Android-style touch feedback) */
  ripple: 'rgba(0, 0, 0, 0.12)',

  /**
   * TRANSPARENT VARIANTS
   * ====================
   * Semi-transparent versions for overlays, hover states, etc.
   * The format is rgba(red, green, blue, alpha)
   * Alpha is 0-1, where 0 is fully transparent and 1 is fully opaque
   */
  primaryTransparent: 'rgba(98, 0, 238, 0.1)',   // 10% opacity primary
  secondaryTransparent: 'rgba(3, 218, 198, 0.1)', // 10% opacity secondary

} as const; // 'as const' makes this readonly - prevents accidental modifications

/**
 * TypeScript Note: 'as const'
 * ============================
 * The 'as const' assertion tells TypeScript:
 * 1. Make all properties readonly (can't be changed)
 * 2. Use literal types (exactly '#6200EE', not just 'string')
 *
 * Benefits:
 * - Prevents accidental color modifications
 * - Better autocomplete in your IDE
 * - Type safety when passing colors as props
 */

/**
 * HOW TO USE THESE COLORS IN YOUR COMPONENTS:
 * ============================================
 *
 * Import the colors object:
 * ```typescript
 * import { colors } from '../theme/colors';
 * ```
 *
 * Use in StyleSheet:
 * ```typescript
 * const styles = StyleSheet.create({
 *   button: {
 *     backgroundColor: colors.primary,  // ✅ Good!
 *     // backgroundColor: '#6200EE',    // ❌ Bad - hardcoded
 *   },
 *   text: {
 *     color: colors.textPrimary,
 *   }
 * });
 * ```
 *
 * Use inline:
 * ```typescript
 * <View style={{ backgroundColor: colors.surface }}>
 *   <Text style={{ color: colors.textPrimary }}>Hello</Text>
 * </View>
 * ```
 */

/**
 * DESIGN SYSTEM PRINCIPLES:
 * ==========================
 *
 * 1. **Consistency**: Using the same colors throughout creates visual unity
 * 2. **Contrast**: Text must have sufficient contrast with backgrounds (accessibility!)
 * 3. **Hierarchy**: Different text colors create importance levels
 * 4. **Feedback**: State colors communicate status clearly
 * 5. **Accessibility**: Colors alone shouldn't convey information (add icons/text too)
 *
 * WCAG CONTRAST RATIOS (for accessibility):
 * - Normal text: 4.5:1 minimum
 * - Large text: 3:1 minimum
 * Our textPrimary on surface meets these requirements!
 */

/**
 * EXTENDING THIS SYSTEM:
 * =======================
 *
 * To add dark mode later:
 * ```typescript
 * export const darkColors = {
 *   ...colors,
 *   background: '#000000',
 *   surface: '#1C1C1E',
 *   textPrimary: '#FFFFFF',
 *   // etc...
 * };
 * ```
 *
 * Then use a theme context to switch between them!
 */

/**
 * COLOR PALETTE RESOURCES:
 * =========================
 * Need help choosing colors?
 * - Material Design Color Tool: https://material.io/resources/color/
 * - Coolors (palette generator): https://coolors.co/
 * - Adobe Color: https://color.adobe.com/
 * - Check contrast: https://webaim.org/resources/contrastchecker/
 */
