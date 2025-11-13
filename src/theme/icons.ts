/**
 * icons.ts - Icon Size Design Tokens
 *
 * This file defines standard icon sizes used throughout the app.
 * Consistent icon sizing creates visual harmony and improves usability.
 *
 * WHAT ARE ICONS?
 * ===============
 * Icons are small graphical symbols that represent actions, objects, or concepts.
 * They help users:
 * - Recognize actions quickly (trash icon = delete)
 * - Navigate faster (visual symbols are processed faster than text)
 * - Save space (icon takes less space than "Download")
 *
 * WHY STANDARDIZE ICON SIZES?
 * ============================
 * 1. **Visual Balance**: Icons match their context (small text = small icon)
 * 2. **Touch Targets**: Ensure icons are big enough to tap (44x44px minimum on mobile)
 * 3. **Consistency**: All navigation icons are the same size
 * 4. **Scalability**: Easy to adjust app-wide sizing
 * 5. **Accessibility**: Proper sizing helps users with vision impairments
 *
 * ICON SIZE PSYCHOLOGY:
 * =====================
 * - Too small (< 16px): Hard to see, unclear what it represents
 * - Small (16-20px): Inline with text, subtle indicators
 * - Medium (24px): Standard icons, most common size
 * - Large (32-48px): Prominent features, touch targets
 * - Huge (> 48px): Decorative, illustrations, empty states
 */

/**
 * ICON SIZE SCALE
 * ===============
 * Sizes in pixels. These work well at standard device resolutions.
 */
export const iconSize = {
  /**
   * XXS (Extra Extra Small) - 12px
   * Tiny icons (rarely used)
   * Use for: Status indicators, tiny badges
   * Example: Online status dot, notification badge
   * Warning: May be hard to recognize on some devices!
   */
  xxs: 12,

  /**
   * XS (Extra Small) - 16px
   * Small inline icons
   * Use for: Inline with text, subtle indicators
   * Example: Icon next to form label, small list indicators
   */
  xs: 16,

  /**
   * SM (Small) - 20px
   * Small but clearly visible
   * Use for: Compact UIs, toolbar icons, list item icons
   * Example: List item trailing icons, compact buttons
   */
  sm: 20,

  /**
   * MD (Medium) - 24px
   * Standard icon size (MOST COMMON)
   * Use for: Default icons, navigation, buttons
   * Example: Tab bar icons, toolbar actions, standard buttons
   * This is your default icon size!
   */
  md: 24,

  /**
   * LG (Large) - 32px
   * Large, prominent icons
   * Use for: Primary actions, feature highlights
   * Example: FAB (Floating Action Button), large buttons, card icons
   */
  lg: 32,

  /**
   * XL (Extra Large) - 40px
   * Very large icons
   * Use for: Headers, avatars, feature cards
   * Example: Profile avatars, feature section headers
   */
  xl: 40,

  /**
   * XXL (Extra Extra Large) - 48px
   * Huge icons
   * Use for: Empty states, onboarding, splash screens
   * Example: "No items" illustrations, onboarding graphics
   */
  xxl: 48,

  /**
   * XXXL (Extra Extra Extra Large) - 64px
   * Massive icons (decorative)
   * Use for: Hero sections, large empty states
   * Example: Welcome screen graphics, large illustrations
   */
  xxxl: 64,

  /**
   * HUGE - 96px
   * Extremely large (rare)
   * Use for: Special moments, splash screens
   * Example: App logo on splash screen, celebration graphics
   */
  huge: 96,

} as const;

/**
 * TOUCH TARGET SIZES
 * ==================
 * Minimum touchable area for interactive icons.
 * Even if the icon is small, the touchable area should be large enough.
 *
 * Apple iOS Guidelines: 44x44pt minimum
 * Android Material Design: 48x48dp minimum
 * We use 44px as it works well for both platforms.
 */
export const touchTarget = {
  /**
   * MINIMUM - 44px
   * Minimum recommended touch target
   * Use for: All tappable icons
   * Note: Icon can be smaller, but padding should make total area 44px
   */
  minimum: 44,

  /**
   * COMFORTABLE - 48px
   * Comfortable touch target (Android guideline)
   * Use for: Primary actions, important buttons
   */
  comfortable: 48,

  /**
   * LARGE - 56px
   * Large touch target for accessibility
   * Use for: Users with motor impairments, FABs
   */
  large: 56,

} as const;

/**
 * COMPONENT-SPECIFIC ICON SIZES
 * ==============================
 * Pre-defined sizes for common use cases
 */
export const componentIconSizes = {
  /**
   * NAVIGATION
   * Icons in navigation elements
   */
  navigation: {
    tabBar: iconSize.md,      // 24px - tab bar icons
    header: iconSize.md,      // 24px - header/toolbar icons
    drawer: iconSize.md,      // 24px - drawer menu icons
    back: iconSize.md,        // 24px - back button icon
  },

  /**
   * BUTTONS
   * Icons inside buttons
   */
  button: {
    small: iconSize.sm,       // 20px - small button icon
    default: iconSize.md,     // 24px - standard button icon
    large: iconSize.lg,       // 32px - large button icon
    fab: iconSize.lg,         // 32px - floating action button
  },

  /**
   * LISTS
   * Icons in list items
   */
  list: {
    leading: iconSize.md,     // 24px - icon before list item text
    trailing: iconSize.sm,    // 20px - icon after list item text (chevron, etc.)
    avatar: iconSize.xl,      // 40px - list item avatar/image
  },

  /**
   * INPUTS & FORMS
   * Icons in form fields
   */
  input: {
    default: iconSize.sm,     // 20px - icon inside input field
    trailing: iconSize.sm,    // 20px - trailing icon (clear button, etc.)
    label: iconSize.xs,       // 16px - icon next to label
  },

  /**
   * CARDS
   * Icons in card components
   */
  card: {
    header: iconSize.lg,      // 32px - card header icon
    action: iconSize.md,      // 24px - card action icon
    small: iconSize.sm,       // 20px - small card details
  },

  /**
   * BADGES & CHIPS
   * Icons in small elements
   */
  badge: {
    default: iconSize.xs,     // 16px - badge icon
    chip: iconSize.sm,        // 20px - chip icon
  },

  /**
   * ALERTS & MESSAGES
   * Icons in notifications
   */
  alert: {
    default: iconSize.md,     // 24px - alert icon
    toast: iconSize.sm,       // 20px - toast notification icon
  },

  /**
   * EMPTY STATES
   * Large decorative icons
   */
  emptyState: {
    default: iconSize.xxl,    // 48px - standard empty state
    large: iconSize.xxxl,     // 64px - prominent empty state
  },

} as const;

/**
 * ICON HELPER FUNCTIONS
 * ======================
 * Utilities for working with icons
 */

/**
 * Calculate padding to reach minimum touch target
 * @param iconSize - The actual icon size
 * @param targetSize - Desired touch target size (default: 44px)
 * @returns Padding value to reach target size
 *
 * Example:
 * ```typescript
 * // Icon is 24px, want 44px touch target
 * const padding = getTouchTargetPadding(24, 44);
 * // Returns 10 (44 - 24 = 20, divided by 2 sides = 10 per side)
 * ```
 */
export const getTouchTargetPadding = (
  iconSizeValue: number,
  targetSize: number = touchTarget.minimum
): number => {
  const paddingNeeded = targetSize - iconSizeValue;
  return Math.max(0, paddingNeeded / 2); // Divide by 2 for padding on each side
};

/**
 * Get icon size that matches text size
 * Helps keep icons aligned with adjacent text
 * @param textSize - Font size of nearby text
 * @returns Recommended icon size
 *
 * Example:
 * ```typescript
 * // Body text is 16px
 * const size = getIconForTextSize(16); // Returns 20px
 * ```
 */
export const getIconForTextSize = (textSize: number): number => {
  // Icon should be slightly larger than text for good visual weight
  // General rule: 1.25x - 1.5x the text size
  if (textSize <= 12) return iconSize.xs;   // 16px
  if (textSize <= 14) return iconSize.sm;   // 20px
  if (textSize <= 18) return iconSize.md;   // 24px
  if (textSize <= 24) return iconSize.lg;   // 32px
  return iconSize.xl;                       // 40px
};

/**
 * HOW TO USE ICON SIZES IN YOUR COMPONENTS:
 * ==========================================
 *
 * Import icon sizes:
 * ```typescript
 * import { iconSize, componentIconSizes, getTouchTargetPadding } from '../theme/icons';
 * ```
 *
 * With Expo Vector Icons:
 * ```typescript
 * import { Ionicons } from '@expo/vector-icons';
 *
 * <Ionicons
 *   name="home"
 *   size={iconSize.md}           // ✅ Good - 24px
 *   color={colors.primary}
 * />
 * ```
 *
 * Component-specific sizes:
 * ```typescript
 * // Tab bar icon
 * <Ionicons
 *   name="settings"
 *   size={componentIconSizes.navigation.tabBar}
 *   color={colors.primary}
 * />
 * ```
 *
 * Ensuring touch target:
 * ```typescript
 * const IconButton = () => {
 *   const padding = getTouchTargetPadding(iconSize.md);
 *
 *   return (
 *     <TouchableOpacity style={{ padding }}>
 *       <Ionicons name="close" size={iconSize.md} />
 *     </TouchableOpacity>
 *   );
 * };
 * ```
 *
 * In StyleSheet:
 * ```typescript
 * const styles = StyleSheet.create({
 *   icon: {
 *     width: iconSize.md,
 *     height: iconSize.md,
 *   },
 *   touchableIcon: {
 *     width: touchTarget.minimum,
 *     height: touchTarget.minimum,
 *     alignItems: 'center',
 *     justifyContent: 'center',
 *   }
 * });
 * ```
 */

/**
 * ICON LIBRARIES FOR REACT NATIVE:
 * ==================================
 *
 * Popular icon libraries:
 * 1. **@expo/vector-icons** (comes with Expo)
 *    - Includes: Ionicons, MaterialIcons, FontAwesome, etc.
 *    - Easy to use, no setup needed
 *    - Thousands of icons available
 *
 * 2. **react-native-vector-icons**
 *    - More icon sets
 *    - Requires native linking (bare React Native)
 *
 * 3. **Custom SVG icons**
 *    - Use react-native-svg
 *    - Full control over styling
 *    - Can animate individual paths
 *
 * Example with Expo Vector Icons:
 * ```typescript
 * import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
 *
 * <Ionicons name="ios-heart" size={iconSize.md} />
 * <MaterialIcons name="favorite" size={iconSize.md} />
 * <FontAwesome name="heart" size={iconSize.md} />
 * ```
 */

/**
 * ACCESSIBILITY CONSIDERATIONS:
 * ==============================
 *
 * 1. **Touch Targets**: Always ensure 44x44px minimum
 * 2. **Labels**: Icons alone don't convey meaning to screen readers
 *    ```typescript
 *    <TouchableOpacity accessibilityLabel="Close dialog">
 *      <Ionicons name="close" size={iconSize.md} />
 *    </TouchableOpacity>
 *    ```
 * 3. **Color Contrast**: Ensure icons contrast with background
 * 4. **Don't rely on color alone**: Use icons + text when possible
 * 5. **Size for visibility**: Some users need larger icons
 */

/**
 * REAL-WORLD EXAMPLES:
 * ====================
 *
 * Bottom Tab Navigator:
 * - Icon size: componentIconSizes.navigation.tabBar (24px)
 * - Touch target: touchTarget.minimum (44px)
 * - Spacing: spacing.xs (8px) between icon and label
 *
 * List Item:
 * - Leading icon: componentIconSizes.list.leading (24px)
 * - Trailing icon: componentIconSizes.list.trailing (20px)
 * - Avatar: componentIconSizes.list.avatar (40px)
 *
 * Button:
 * - Small button: componentIconSizes.button.small (20px)
 * - Default button: componentIconSizes.button.default (24px)
 * - FAB: componentIconSizes.button.fab (32px)
 *
 * Empty State:
 * - Standard: componentIconSizes.emptyState.default (48px)
 * - Large: componentIconSizes.emptyState.large (64px)
 */

/**
 * DESIGN TIPS:
 * ============
 *
 * 1. **Consistency**: Use same size for similar contexts
 * 2. **Alignment**: Align icon optically with text (may need small offset)
 * 3. **Spacing**: Give icons breathing room (padding: spacing.xs)
 * 4. **Color**: Match icon color to text color or brand color
 * 5. **Weight**: Icon visual weight should match text weight
 * 6. **Context**: Navigation icons all same size, don't mix
 *
 * Visual Balance:
 * - 12px text → 16px icon (xs)
 * - 14px text → 20px icon (sm)
 * - 16px text → 24px icon (md)
 * - 20px text → 32px icon (lg)
 * - 24px text → 40px icon (xl)
 */

/**
 * ICON SIZE REFERENCE CHART:
 * ===========================
 *
 * Size  | Pixels | Use Case
 * ------|--------|----------------------------------
 * xxs   | 12px   | Status dots, tiny badges
 * xs    | 16px   | Inline text, small indicators
 * sm    | 20px   | Compact UI, toolbar, lists
 * md    | 24px   | Default icons (MOST COMMON)
 * lg    | 32px   | Primary actions, FABs
 * xl    | 40px   | Avatars, headers
 * xxl   | 48px   | Empty states, onboarding
 * xxxl  | 64px   | Hero sections
 * huge  | 96px   | Splash screens, celebrations
 */

/**
 * LEARN MORE:
 * ===========
 * - iOS Icon Guidelines: https://developer.apple.com/design/human-interface-guidelines/icons
 * - Material Icons: https://material.io/design/iconography/
 * - Expo Vector Icons: https://icons.expo.fyi/
 * - Touch Target Sizes: https://www.lukew.com/ff/entry.asp?1085
 */

// Export all icon constants
export const icons = {
  size: iconSize,
  touchTarget,
  component: componentIconSizes,
  getTouchTargetPadding,
  getIconForTextSize,
} as const;
