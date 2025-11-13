/**
 * typography.ts - Typography Design Tokens
 *
 * This file defines all text styles used throughout the app.
 * Typography is crucial for readability, hierarchy, and user experience.
 *
 * WHAT IS TYPOGRAPHY?
 * ===================
 * Typography is the art and technique of arranging text. In apps, it includes:
 * - Font families (which fonts to use)
 * - Font sizes (how big the text is)
 * - Font weights (how bold the text is)
 * - Line heights (space between lines)
 * - Letter spacing (space between characters)
 *
 * WHY A TYPOGRAPHY SYSTEM?
 * =========================
 * 1. **Visual Hierarchy**: Shows importance (h1 > h2 > body > caption)
 * 2. **Consistency**: All headings look the same across the app
 * 3. **Readability**: Optimized sizes and spacing for comfortable reading
 * 4. **Maintainability**: Update all headings by changing one value
 * 5. **Accessibility**: Proper sizing helps users with vision impairments
 */

import { TextStyle } from 'react-native';

/**
 * FONT FAMILIES
 * =============
 * React Native uses different font names on iOS and Android.
 * These are the system fonts (available by default on all devices).
 *
 * iOS System Fonts:
 * - Regular: "System"
 * - San Francisco is the iOS system font (auto-applied)
 *
 * Android System Fonts:
 * - Regular: "Roboto"
 *
 * React Native automatically uses the right font for each platform!
 * For custom fonts, you'd use Expo's font loading system.
 */
export const fontFamily = {
  /**
   * Regular (normal weight) font
   * Use for: Body text, most content
   */
  regular: 'System',

  /**
   * Medium weight font
   * Use for: Subheadings, emphasized text
   */
  medium: 'System',

  /**
   * Bold weight font
   * Use for: Headings, important text, buttons
   */
  bold: 'System',

  /**
   * Monospace font (fixed-width characters)
   * Use for: Code snippets, numbers that should align
   */
  mono: 'Courier',

} as const;

/**
 * FONT WEIGHTS
 * ============
 * How thick/bold the font appears.
 * Values range from 100 (thin) to 900 (black/extra bold).
 *
 * Common values:
 * - 400: Normal/Regular (default text)
 * - 500: Medium (slightly emphasized)
 * - 600: Semi-bold (subheadings)
 * - 700: Bold (headings, buttons)
 */
export const fontWeight = {
  normal: '400' as TextStyle['fontWeight'],    // Regular text
  medium: '500' as TextStyle['fontWeight'],    // Slightly emphasized
  semibold: '600' as TextStyle['fontWeight'],  // Subheadings
  bold: '700' as TextStyle['fontWeight'],      // Headings, important text
} as const;

/**
 * FONT SIZES
 * ==========
 * Defined in pixels. We use a type scale - a mathematical ratio between sizes.
 * This creates harmonious visual hierarchy.
 *
 * Our scale uses approximately 1.25 ratio (each size is ~25% larger than previous)
 * This is called a "Major Third" scale in typography.
 */
export const fontSize = {
  /**
   * XXS (Extra Extra Small) - 10px
   * Use for: Tiny labels, timestamps, legal text
   * Minimum readable size on mobile!
   */
  xxs: 10,

  /**
   * XS (Extra Small) - 12px
   * Use for: Captions, footnotes, helper text
   */
  xs: 12,

  /**
   * SM (Small) - 14px
   * Use for: Secondary text, labels, small buttons
   */
  sm: 14,

  /**
   * MD (Medium) - 16px
   * Use for: Body text (main content)
   * This is the default reading size - comfortable for long text
   */
  md: 16,

  /**
   * LG (Large) - 18px
   * Use for: Large body text, list titles, emphasized content
   */
  lg: 18,

  /**
   * XL (Extra Large) - 20px
   * Use for: H3 headings, card titles
   */
  xl: 20,

  /**
   * XXL (Extra Extra Large) - 24px
   * Use for: H2 headings, section titles
   */
  xxl: 24,

  /**
   * XXXL (Extra Extra Extra Large) - 28px
   * Use for: H1 headings, page titles
   */
  xxxl: 28,

  /**
   * HUGE - 32px
   * Use for: Display text, hero headings, splash screens
   */
  huge: 32,

  /**
   * DISPLAY - 40px
   * Use for: Large display text, numbers, statistics
   */
  display: 40,

} as const;

/**
 * LINE HEIGHT
 * ===========
 * Space between lines of text.
 * Too tight = cramped and hard to read
 * Too loose = text feels disconnected
 *
 * General rule: Line height = font size * 1.4 to 1.6
 * Larger text can use smaller multipliers (1.2-1.3)
 * Smaller text needs larger multipliers (1.5-1.7)
 */
export const lineHeight = {
  tight: 1.2,   // For headings (they don't need much space)
  normal: 1.5,  // For body text (comfortable reading)
  loose: 1.7,   // For long-form content (extra comfortable)
} as const;

/**
 * LETTER SPACING (Tracking)
 * ==========================
 * Space between individual characters.
 * Measured in pixels.
 *
 * Positive values: More space (better for ALL CAPS)
 * Negative values: Less space (tighter, more compact)
 * Zero: Default spacing
 */
export const letterSpacing = {
  tight: -0.5,  // Slightly tighter
  normal: 0,    // Default
  wide: 0.5,    // Slightly wider
  wider: 1,     // Much wider (good for ALL CAPS)
} as const;

/**
 * PRE-DEFINED TEXT STYLES
 * ========================
 * Ready-to-use style objects for common text types.
 * These combine font size, weight, line height, etc.
 */

/**
 * HEADING STYLES
 * ==============
 * For titles and section headings (most important to least)
 */
export const headings = {
  /**
   * H1 - Main page heading
   * Use for: Screen titles, main headings
   * Example: "Welcome to POCHOCLO", "Settings", "Profile"
   */
  h1: {
    fontSize: fontSize.xxxl,      // 28px
    fontWeight: fontWeight.bold,  // 700
    lineHeight: fontSize.xxxl * lineHeight.tight, // 28 * 1.2 = 33.6
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  /**
   * H2 - Section heading
   * Use for: Major sections within a screen
   * Example: "Recent Activity", "Your Orders", "Account Details"
   */
  h2: {
    fontSize: fontSize.xxl,       // 24px
    fontWeight: fontWeight.bold,  // 700
    lineHeight: fontSize.xxl * lineHeight.tight, // 28.8
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  /**
   * H3 - Sub-section heading
   * Use for: Smaller sections, card titles
   * Example: "Personal Information", "Payment Methods"
   */
  h3: {
    fontSize: fontSize.xl,          // 20px
    fontWeight: fontWeight.semibold, // 600
    lineHeight: fontSize.xl * lineHeight.tight, // 24
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  /**
   * H4 - Minor heading
   * Use for: List section headers, small card titles
   */
  h4: {
    fontSize: fontSize.lg,          // 18px
    fontWeight: fontWeight.semibold, // 600
    lineHeight: fontSize.lg * lineHeight.normal, // 27
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

} as const;

/**
 * BODY TEXT STYLES
 * ================
 * For main content and reading text
 */
export const body = {
  /**
   * Large body text
   * Use for: Important content, introductory paragraphs
   */
  large: {
    fontSize: fontSize.lg,        // 18px
    fontWeight: fontWeight.normal, // 400
    lineHeight: fontSize.lg * lineHeight.normal, // 27
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  /**
   * Regular body text (MOST COMMON)
   * Use for: Main content, descriptions, paragraphs
   * This is your default text style!
   */
  regular: {
    fontSize: fontSize.md,        // 16px
    fontWeight: fontWeight.normal, // 400
    lineHeight: fontSize.md * lineHeight.normal, // 24
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  /**
   * Small body text
   * Use for: Secondary content, metadata
   */
  small: {
    fontSize: fontSize.sm,        // 14px
    fontWeight: fontWeight.normal, // 400
    lineHeight: fontSize.sm * lineHeight.normal, // 21
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  /**
   * Medium weight body (emphasized)
   * Use for: Slightly emphasized text within paragraphs
   */
  medium: {
    fontSize: fontSize.md,        // 16px
    fontWeight: fontWeight.medium, // 500
    lineHeight: fontSize.md * lineHeight.normal, // 24
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  /**
   * Bold body text
   * Use for: Strong emphasis, important information
   */
  bold: {
    fontSize: fontSize.md,        // 16px
    fontWeight: fontWeight.bold,  // 700
    lineHeight: fontSize.md * lineHeight.normal, // 24
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

} as const;

/**
 * SPECIAL TEXT STYLES
 * ====================
 * For specific use cases
 */
export const special = {
  /**
   * Caption text
   * Use for: Image captions, timestamps, metadata
   */
  caption: {
    fontSize: fontSize.xs,        // 12px
    fontWeight: fontWeight.normal, // 400
    lineHeight: fontSize.xs * lineHeight.normal, // 18
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  /**
   * Overline text (small caps)
   * Use for: Category labels, section labels
   */
  overline: {
    fontSize: fontSize.xs,        // 12px
    fontWeight: fontWeight.semibold, // 600
    lineHeight: fontSize.xs * lineHeight.normal, // 18
    letterSpacing: letterSpacing.wider, // 1
    textTransform: 'uppercase',   // ALL CAPS
  } as TextStyle,

  /**
   * Button text
   * Use for: Text inside buttons
   */
  button: {
    fontSize: fontSize.md,        // 16px
    fontWeight: fontWeight.semibold, // 600
    lineHeight: fontSize.md * lineHeight.tight, // 19.2
    letterSpacing: letterSpacing.wide, // 0.5
  } as TextStyle,

  /**
   * Link text
   * Use for: Clickable links
   */
  link: {
    fontSize: fontSize.md,        // 16px
    fontWeight: fontWeight.medium, // 500
    lineHeight: fontSize.md * lineHeight.normal, // 24
    letterSpacing: letterSpacing.normal,
    textDecorationLine: 'underline',
  } as TextStyle,

  /**
   * Label text
   * Use for: Form labels, input labels
   */
  label: {
    fontSize: fontSize.sm,        // 14px
    fontWeight: fontWeight.medium, // 500
    lineHeight: fontSize.sm * lineHeight.normal, // 21
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  /**
   * Helper text
   * Use for: Form hints, error messages, helper text
   */
  helper: {
    fontSize: fontSize.xs,        // 12px
    fontWeight: fontWeight.normal, // 400
    lineHeight: fontSize.xs * lineHeight.normal, // 18
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  /**
   * Code/monospace text
   * Use for: Code snippets, technical values
   */
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,        // 14px
    fontWeight: fontWeight.normal, // 400
    lineHeight: fontSize.sm * lineHeight.loose, // 23.8
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

} as const;

/**
 * HOW TO USE TYPOGRAPHY IN YOUR COMPONENTS:
 * ==========================================
 *
 * Import typography styles:
 * ```typescript
 * import { headings, body, special } from '../theme/typography';
 * ```
 *
 * Use in StyleSheet:
 * ```typescript
 * const styles = StyleSheet.create({
 *   title: {
 *     ...headings.h1,        // Spreads all h1 properties
 *     color: colors.textPrimary,
 *   },
 *   description: {
 *     ...body.regular,       // Regular body text
 *     color: colors.textSecondary,
 *   },
 *   caption: {
 *     ...special.caption,
 *     color: colors.textTertiary,
 *   }
 * });
 * ```
 *
 * Use inline:
 * ```typescript
 * <Text style={[headings.h1, { color: colors.textPrimary }]}>
 *   Welcome!
 * </Text>
 * ```
 *
 * Combine multiple styles:
 * ```typescript
 * <Text style={[body.regular, { color: colors.error }]}>
 *   Error message
 * </Text>
 * ```
 */

/**
 * TYPOGRAPHY HIERARCHY EXAMPLE:
 * ==============================
 *
 * Screen Title → headings.h1
 *   Section Title → headings.h2
 *     Subsection → headings.h3
 *       Body Text → body.regular
 *       Emphasized → body.bold
 *       Caption → special.caption
 *
 * This creates a clear visual hierarchy that guides users' eyes!
 */

/**
 * ACCESSIBILITY CONSIDERATIONS:
 * ==============================
 * 1. **Minimum Size**: Never go below 12px for main content
 * 2. **Contrast**: Ensure text color contrasts with background (WCAG guidelines)
 * 3. **Line Length**: Limit line width to 50-75 characters for readability
 * 4. **Line Height**: Adequate spacing prevents text from feeling cramped
 * 5. **Font Scaling**: React Native respects user's font size settings!
 */

/**
 * LEARN MORE:
 * ===========
 * - Typography in UI Design: https://material.io/design/typography/
 * - Type Scale Calculator: https://type-scale.com/
 * - iOS Typography: https://developer.apple.com/design/human-interface-guidelines/typography
 * - Practical Typography: https://practicaltypography.com/
 */
