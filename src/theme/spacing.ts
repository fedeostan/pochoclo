/**
 * spacing.ts - Spacing Design Tokens
 *
 * This file defines all spacing values (margins, padding, gaps) used throughout the app.
 * We follow the "8-Point Grid System" - a professional design standard.
 *
 * WHAT IS THE 8-POINT GRID SYSTEM?
 * ==================================
 * All spacing is a multiple of 8 pixels: 8, 16, 24, 32, 40, 48, etc.
 *
 * WHY USE IT?
 * ===========
 * 1. **Consistency**: Creates visual rhythm and harmony
 * 2. **Scalability**: Works across all screen sizes
 * 3. **Decision-making**: No more guessing "should this be 13px or 15px?"
 * 4. **Industry standard**: Used by Google (Material Design), Apple (iOS HIG), and most design systems
 * 5. **Math-friendly**: Easy to divide/multiply (8/2=4, 8*2=16)
 *
 * THE RULE:
 * =========
 * Most spacing should be multiples of 8px.
 * For very small spacing, you can use 4px (8/2).
 * Avoid arbitrary values like 13px, 23px, or 37px.
 */

/**
 * BASE UNIT
 * =========
 * Our fundamental spacing unit is 8 pixels.
 * All other spacing derives from this base.
 */
const BASE_UNIT = 8;

/**
 * SPACING SCALE
 * =============
 * A systematic scale of spacing values from tiny to huge.
 * Named semantically (by size) not by pixel value.
 */
export const spacing = {
  /**
   * XXS (Extra Extra Small) - 4px
   * Use for: Very tight spacing, icon padding, small gaps between related items
   * Example: Padding inside a small badge, space between icon and text
   */
  xxs: BASE_UNIT * 0.5,  // 4px

  /**
   * XS (Extra Small) - 8px
   * Use for: Tight spacing, compact layouts, inner padding
   * Example: Padding in compact buttons, small card padding
   */
  xs: BASE_UNIT,  // 8px

  /**
   * SM (Small) - 12px
   * Use for: Small gaps, close related elements
   * Example: Space between label and input, small margins
   */
  sm: BASE_UNIT * 1.5,  // 12px

  /**
   * MD (Medium) - 16px
   * Use for: Default spacing, moderate gaps between elements
   * Example: Padding in standard buttons, default margins, gaps between form fields
   * This is often your most-used spacing value!
   */
  md: BASE_UNIT * 2,  // 16px

  /**
   * LG (Large) - 24px
   * Use for: Generous spacing, section padding, comfortable gaps
   * Example: Padding inside cards, space between sections
   */
  lg: BASE_UNIT * 3,  // 24px

  /**
   * XL (Extra Large) - 32px
   * Use for: Large gaps, major section breaks, screen padding
   * Example: Top/bottom padding for screens, space between major sections
   */
  xl: BASE_UNIT * 4,  // 32px

  /**
   * XXL (Extra Extra Large) - 48px
   * Use for: Very large gaps, major layout spacing
   * Example: Space between screen sections, large empty states
   */
  xxl: BASE_UNIT * 6,  // 48px

  /**
   * XXXL (Extra Extra Extra Large) - 64px
   * Use for: Huge gaps, dramatic spacing, splash screens
   * Example: Large hero sections, welcome screens
   */
  xxxl: BASE_UNIT * 8,  // 64px

} as const;

/**
 * SPECIALIZED SPACING VALUES
 * ===========================
 * Common patterns extracted into named values for convenience
 */
export const layout = {
  /**
   * SCREEN PADDING
   * ==============
   * Consistent padding around screen edges
   * Prevents content from touching screen edges (uncomfortable to read)
   */
  screenHorizontal: spacing.lg,  // 24px - left/right screen edges
  screenVertical: spacing.xl,    // 32px - top/bottom screen edges

  /**
   * SECTION SPACING
   * ===============
   * Space between major sections of content
   */
  sectionGap: spacing.xl,        // 32px - between major content sections
  sectionPadding: spacing.lg,    // 24px - inside section containers

  /**
   * CARD SPACING
   * ============
   * Padding and margins for card components
   */
  cardPadding: spacing.lg,       // 24px - inside cards
  cardMargin: spacing.md,        // 16px - between cards
  cardGap: spacing.md,           // 16px - between elements inside card

  /**
   * LIST SPACING
   * ============
   * Spacing for list items and separators
   */
  listItemPadding: spacing.md,  // 16px - padding inside list items
  listItemGap: spacing.sm,       // 12px - space between list items

  /**
   * BUTTON SPACING
   * ==============
   * Padding inside buttons (affects button size)
   */
  buttonPaddingHorizontal: spacing.xl,  // 32px - left/right button padding
  buttonPaddingVertical: spacing.md,    // 16px - top/bottom button padding
  buttonGap: spacing.sm,                // 12px - space between adjacent buttons

  /**
   * FORM SPACING
   * ============
   * Spacing for form elements
   */
  inputPadding: spacing.md,      // 16px - padding inside input fields
  formFieldGap: spacing.lg,      // 24px - space between form fields
  labelGap: spacing.xs,          // 8px - space between label and input

  /**
   * HEADER/FOOTER SPACING
   * ======================
   * Spacing for navigation and header areas
   */
  headerPadding: spacing.md,     // 16px - header inner padding
  footerPadding: spacing.lg,     // 24px - footer inner padding

} as const;

/**
 * SHORTHAND HELPERS
 * =================
 * Quick functions for common spacing patterns
 * These make your code more readable
 */

/**
 * Creates spacing object for horizontal (left + right) padding
 * @param value - spacing value (e.g., spacing.md)
 * @returns Object with paddingHorizontal property
 *
 * Example:
 * ```typescript
 * // Instead of:
 * style={{ paddingLeft: 16, paddingRight: 16 }}
 *
 * // Write:
 * style={{ ...horizontal(spacing.md) }}
 * // or
 * style={{ paddingHorizontal: spacing.md }} // React Native shorthand
 * ```
 */
export const horizontal = (value: number) => ({
  paddingHorizontal: value,
});

/**
 * Creates spacing object for vertical (top + bottom) padding
 * @param value - spacing value (e.g., spacing.lg)
 * @returns Object with paddingVertical property
 */
export const vertical = (value: number) => ({
  paddingVertical: value,
});

/**
 * Creates spacing object for all sides (top, right, bottom, left)
 * @param value - spacing value (e.g., spacing.md)
 * @returns Object with padding property
 */
export const all = (value: number) => ({
  padding: value,
});

/**
 * Creates spacing object for custom padding on each side
 * @param top - top padding
 * @param right - right padding (defaults to top)
 * @param bottom - bottom padding (defaults to top)
 * @param left - left padding (defaults to right)
 * @returns Object with individual padding properties
 *
 * Example:
 * ```typescript
 * ...custom(spacing.lg, spacing.md) // lg top/bottom, md left/right
 * ```
 */
export const custom = (
  top: number,
  right: number = top,
  bottom: number = top,
  left: number = right
) => ({
  paddingTop: top,
  paddingRight: right,
  paddingBottom: bottom,
  paddingLeft: left,
});

/**
 * HOW TO USE SPACING IN YOUR COMPONENTS:
 * =======================================
 *
 * Import spacing:
 * ```typescript
 * import { spacing, layout } from '../theme/spacing';
 * ```
 *
 * Use in StyleSheet:
 * ```typescript
 * const styles = StyleSheet.create({
 *   container: {
 *     padding: spacing.lg,           // ✅ Good - 24px
 *     // padding: 24,                // ❌ Bad - hardcoded
 *   },
 *   screen: {
 *     paddingHorizontal: layout.screenHorizontal,
 *     paddingVertical: layout.screenVertical,
 *   },
 *   button: {
 *     paddingHorizontal: layout.buttonPaddingHorizontal,
 *     paddingVertical: layout.buttonPaddingVertical,
 *     marginBottom: spacing.md,
 *   },
 * });
 * ```
 *
 * Use helper functions:
 * ```typescript
 * const styles = StyleSheet.create({
 *   box: {
 *     ...horizontal(spacing.xl), // paddingHorizontal: 32
 *     ...vertical(spacing.lg),   // paddingVertical: 24
 *   }
 * });
 * ```
 */

/**
 * WHEN TO BREAK THE RULES:
 * =========================
 *
 * The 8-point grid is a guideline, not a law. You can break it for:
 * 1. **Alignment**: Sometimes you need 1-2px adjustments for perfect alignment
 * 2. **Icons**: Icon sizes might be 20px or 24px (not strictly 8-based)
 * 3. **Borders**: 1px borders are fine (8px borders would be huge!)
 *
 * But 95% of the time, stick to the system!
 */

/**
 * VISUAL SPACING GUIDE:
 * ======================
 *
 * xxs (4px):   ▪ Like a grain of rice
 * xs  (8px):   ▪▪ Tight but visible
 * sm  (12px):  ▪▪▪ Small comfortable gap
 * md  (16px):  ▪▪▪▪ Default spacing (most common)
 * lg  (24px):  ▪▪▪▪▪▪ Generous space
 * xl  (32px):  ▪▪▪▪▪▪▪▪ Large section break
 * xxl (48px):  ▪▪▪▪▪▪▪▪▪▪▪▪ Very large gap
 * xxxl (64px): ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪ Dramatic spacing
 */

/**
 * REAL-WORLD EXAMPLES:
 * ====================
 *
 * Login Screen:
 * - Screen padding: layout.screenHorizontal, layout.screenVertical
 * - Space between input fields: spacing.lg
 * - Space between label and input: spacing.xs
 * - Button padding: layout.buttonPaddingHorizontal, layout.buttonPaddingVertical
 * - Space before "Forgot password" link: spacing.md
 *
 * Card Component:
 * - Inner padding: layout.cardPadding
 * - Space between cards: layout.cardMargin
 * - Space between card title and content: spacing.md
 * - Space between content elements: spacing.sm
 */

/**
 * LEARN MORE:
 * ===========
 * - Material Design Spacing: https://material.io/design/layout/spacing-methods.html
 * - 8-Point Grid System: https://spec.fm/specifics/8-pt-grid
 * - iOS Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/layout
 */
