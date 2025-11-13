/**
 * radius.ts - Border Radius Design Tokens
 *
 * This file defines all border radius values (rounded corners) used throughout the app.
 * Consistent rounding creates a cohesive, polished look.
 *
 * WHAT IS BORDER RADIUS?
 * ======================
 * Border radius controls how rounded the corners of elements are.
 * - 0: Sharp 90-degree corners (square)
 * - Small value (4-8px): Slightly rounded (subtle)
 * - Large value (12-16px): Very rounded (friendly)
 * - 50% or huge value: Perfectly circular (buttons, avatars)
 *
 * WHY STANDARDIZE BORDER RADIUS?
 * ===============================
 * 1. **Visual Consistency**: All cards have the same corner style
 * 2. **Brand Identity**: Round corners feel friendly, sharp corners feel professional
 * 3. **Efficiency**: No guessing "should this be 6px or 8px?"
 * 4. **Easy Updates**: Want rounder buttons? Change one value!
 *
 * DESIGN PSYCHOLOGY:
 * ==================
 * - Sharp corners (0-2px): Professional, technical, serious
 * - Small rounds (4-8px): Balanced, modern, clean
 * - Medium rounds (12-16px): Friendly, approachable, soft
 * - Large rounds (20-999px): Playful, fun, casual
 * - Circular (50%): Avatars, icons, pills
 */

/**
 * BORDER RADIUS SCALE
 * ===================
 * A progression from sharp to fully rounded.
 */
export const radius = {
  /**
   * NONE - 0px
   * Sharp 90-degree corners (no rounding)
   * Use for: Elements that should feel crisp and technical
   * Example: Code blocks, tables, technical diagrams
   */
  none: 0,

  /**
   * XS (Extra Small) - 4px
   * Subtle rounding (barely noticeable)
   * Use for: Input fields, small chips, tags
   * Example: Search bars, filter chips, badges
   */
  xs: 4,

  /**
   * SM (Small) - 8px
   * Gently rounded (modern and clean)
   * Use for: Small buttons, small cards, alerts
   * Example: Alert boxes, small action buttons, tooltips
   */
  sm: 8,

  /**
   * MD (Medium) - 12px
   * Moderately rounded (friendly and inviting)
   * Use for: Cards, modals, standard buttons
   * Example: Most cards, modal dialogs, regular buttons
   * This is your most commonly used radius!
   */
  md: 12,

  /**
   * LG (Large) - 16px
   * Very rounded (soft and approachable)
   * Use for: Large cards, prominent buttons, bottom sheets
   * Example: Hero cards, primary CTA buttons, large containers
   */
  lg: 16,

  /**
   * XL (Extra Large) - 24px
   * Heavily rounded (playful and modern)
   * Use for: Large feature cards, special elements
   * Example: Onboarding cards, featured content, splash elements
   */
  xl: 24,

  /**
   * XXL (Extra Extra Large) - 32px
   * Very heavily rounded (approaching circular)
   * Use for: Special decorative elements, large buttons
   * Example: Floating action buttons (FAB), large pills
   */
  xxl: 32,

  /**
   * ROUND/PILL - 999px
   * Perfectly rounded ends (pill shape)
   * Use for: Pill buttons, tags, avatars
   * Example: "Follow" buttons, status pills, round buttons
   * Note: 999px ensures full rounding regardless of height
   */
  round: 999,

  /**
   * FULL/CIRCLE - '50%'
   * Perfect circle (must be used as string in React Native)
   * Use for: Avatars, icon buttons, circular images
   * Example: Profile pictures, round icon buttons, status indicators
   * Note: Element must have equal width and height!
   */
  full: '50%' as const,

} as const;

/**
 * COMPONENT-SPECIFIC RADIUS
 * ==========================
 * Common radius patterns for specific components.
 * These provide semantic meaning and make code more readable.
 */
export const componentRadius = {
  /**
   * BUTTONS
   * Different button styles need different rounding
   */
  button: {
    small: radius.sm,      // 8px - compact buttons
    default: radius.md,    // 12px - standard buttons
    large: radius.lg,      // 16px - prominent buttons
    pill: radius.round,    // 999px - pill-shaped buttons
  },

  /**
   * CARDS
   * Cards usually have consistent rounding
   */
  card: {
    default: radius.md,    // 12px - standard card
    large: radius.lg,      // 16px - featured/hero cards
  },

  /**
   * INPUTS & FORM FIELDS
   * Input fields benefit from subtle rounding
   */
  input: {
    default: radius.sm,    // 8px - text inputs, textareas
    rounded: radius.md,    // 12px - search bars, rounded inputs
  },

  /**
   * MODALS & SHEETS
   * Dialogs and bottom sheets
   */
  modal: {
    default: radius.lg,    // 16px - modal dialogs
    sheet: radius.xl,      // 24px - bottom sheets (only top corners)
  },

  /**
   * IMAGES & MEDIA
   * Photos, thumbnails, avatars
   */
  image: {
    default: radius.sm,    // 8px - regular images
    thumbnail: radius.xs,  // 4px - small thumbnails
    avatar: radius.full,   // 50% - profile pictures (circular)
  },

  /**
   * BADGES & CHIPS
   * Small informational elements
   */
  badge: {
    default: radius.xs,    // 4px - small badges
    pill: radius.round,    // 999px - pill-shaped badges
  },

  /**
   * ALERTS & NOTIFICATIONS
   * Message boxes and toasts
   */
  alert: {
    default: radius.sm,    // 8px - alert boxes
    toast: radius.md,      // 12px - toast notifications
  },

} as const;

/**
 * HELPER FUNCTION: SELECTIVE CORNER ROUNDING
 * ===========================================
 * Sometimes you only want to round specific corners.
 * React Native uses separate properties for each corner.
 */

/**
 * Round only the top corners
 * Use for: Bottom sheets, modals that slide up
 * @param value - radius value (e.g., radius.lg)
 */
export const topOnly = (value: number) => ({
  borderTopLeftRadius: value,
  borderTopRightRadius: value,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
});

/**
 * Round only the bottom corners
 * Use for: Top-attached dropdowns, headers
 * @param value - radius value (e.g., radius.md)
 */
export const bottomOnly = (value: number) => ({
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  borderBottomLeftRadius: value,
  borderBottomRightRadius: value,
});

/**
 * Round only the left corners
 * Use for: Right-side attachments, tabs
 * @param value - radius value (e.g., radius.sm)
 */
export const leftOnly = (value: number) => ({
  borderTopLeftRadius: value,
  borderTopRightRadius: 0,
  borderBottomLeftRadius: value,
  borderBottomRightRadius: 0,
});

/**
 * Round only the right corners
 * Use for: Left-side attachments, tabs
 * @param value - radius value (e.g., radius.sm)
 */
export const rightOnly = (value: number) => ({
  borderTopLeftRadius: 0,
  borderTopRightRadius: value,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: value,
});

/**
 * Custom radius for each corner
 * Use for: Asymmetric designs, special cases
 * @param topLeft - top-left corner radius
 * @param topRight - top-right corner radius
 * @param bottomRight - bottom-right corner radius
 * @param bottomLeft - bottom-left corner radius
 */
export const custom = (
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number
) => ({
  borderTopLeftRadius: topLeft,
  borderTopRightRadius: topRight,
  borderBottomRightRadius: bottomRight,
  borderBottomLeftRadius: bottomLeft,
});

/**
 * HOW TO USE RADIUS IN YOUR COMPONENTS:
 * ======================================
 *
 * Import radius:
 * ```typescript
 * import { radius, componentRadius, topOnly } from '../theme/radius';
 * ```
 *
 * Use in StyleSheet:
 * ```typescript
 * const styles = StyleSheet.create({
 *   card: {
 *     borderRadius: radius.md,          // ✅ Good - 12px
 *     // borderRadius: 12,              // ❌ Bad - hardcoded
 *   },
 *   button: {
 *     borderRadius: componentRadius.button.pill, // Pill button
 *   },
 *   avatar: {
 *     width: 50,
 *     height: 50,
 *     borderRadius: radius.full,        // Circular (50%)
 *   },
 *   bottomSheet: {
 *     ...topOnly(radius.xl),            // Only round top corners
 *   }
 * });
 * ```
 *
 * Common patterns:
 * ```typescript
 * // Standard card
 * borderRadius: radius.md
 *
 * // Pill button
 * borderRadius: radius.round
 *
 * // Circular avatar (50%)
 * borderRadius: radius.full
 *
 * // Bottom sheet (top corners only)
 * ...topOnly(radius.xl)
 * ```
 */

/**
 * REAL-WORLD EXAMPLES:
 * ====================
 *
 * Login Screen:
 * - Input fields: radius.sm (8px)
 * - Login button: radius.md (12px)
 * - Social buttons: radius.round (pill-shaped)
 * - Profile avatar: radius.full (circular)
 *
 * Card Component:
 * - Standard cards: radius.md (12px)
 * - Featured hero card: radius.lg (16px)
 * - Small info cards: radius.sm (8px)
 *
 * Button Variety:
 * - Primary CTA: radius.md (12px)
 * - Pill button: radius.round (999px)
 * - Icon button: radius.full (circular)
 * - Compact button: radius.sm (8px)
 */

/**
 * DESIGN TIPS:
 * ============
 *
 * 1. **Be Consistent**: Don't mix sharp and round styles randomly
 * 2. **Match Context**: Modern apps → rounder, Professional apps → sharper
 * 3. **Size Relationship**: Larger elements can handle larger radius values
 * 4. **Platform Consideration**: iOS tends toward rounder, Android more varied
 * 5. **Don't Overdo It**: Not everything needs maximum rounding!
 *
 * Visual Examples:
 * - radius.none (0px):   ▭ Sharp and technical
 * - radius.sm (8px):     ▭ Subtle and modern
 * - radius.md (12px):    ▭ Friendly and balanced
 * - radius.lg (16px):    ▭ Soft and inviting
 * - radius.round (999px): ● Pill-shaped
 * - radius.full (50%):   ● Perfect circle
 */

/**
 * ACCESSIBILITY NOTE:
 * ===================
 * Border radius is purely visual and doesn't affect accessibility.
 * However, ensure rounded buttons still have clear tap targets (44x44px minimum)!
 */

/**
 * LEARN MORE:
 * ===========
 * - Material Design Shape: https://material.io/design/shape/
 * - iOS Design Tokens: https://developer.apple.com/design/human-interface-guidelines/foundations/layout
 * - Border Radius in UI Design: https://www.smashingmagazine.com/2017/10/designing-perfect-ui-shadows/
 */
