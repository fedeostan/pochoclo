/**
 * shadows.ts - Shadow and Elevation Design Tokens
 *
 * This file defines all shadow/elevation styles for creating depth in your UI.
 * Shadows make elements appear to "float" above the background, showing hierarchy.
 *
 * WHAT ARE SHADOWS & ELEVATION?
 * ==============================
 * Shadows create the illusion of depth - like elements are physically raised.
 * - Higher elevation = bigger shadow = appears closer to you
 * - Lower elevation = smaller shadow = appears further away
 *
 * Think of it like a stack of papers:
 * - Paper on desk (no shadow) = elevation 0
 * - Paper lifted 1 inch = small shadow
 * - Paper lifted 6 inches = large shadow
 *
 * WHY USE SHADOWS?
 * ================
 * 1. **Visual Hierarchy**: Important elements (modals, FABs) float above others
 * 2. **Focus**: Shadows draw attention to interactive elements
 * 3. **Depth**: Flat UI can feel boring; shadows add dimension
 * 4. **Affordance**: Shadows suggest "this is clickable/interactable"
 *
 * IOS VS ANDROID SHADOWS:
 * =======================
 * React Native handles shadows differently on each platform:
 *
 * iOS (shadowColor, shadowOffset, shadowOpacity, shadowRadius):
 * - Uses Core Graphics shadows
 * - Can be any color
 * - Performance cost is moderate
 * - More customizable
 *
 * Android (elevation):
 * - Uses Material Design elevation system
 * - Always black shadow (can't change color)
 * - Better performance
 * - Simpler API
 *
 * IMPORTANT: You need BOTH for cross-platform apps!
 */

import { ViewStyle } from 'react-native';

/**
 * SHADOW/ELEVATION SCALE
 * =======================
 * From no elevation (flat) to maximum elevation (floating high above).
 * Based on Material Design elevation levels.
 */

/**
 * NONE - No Shadow
 * Flat against the background
 * Use for: Background elements, content that shouldn't stand out
 */
export const none: ViewStyle = {
  // iOS
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  // Android
  elevation: 0,
};

/**
 * XS (Extra Small) - Elevation 1
 * Barely visible shadow (subtle depth)
 * Use for: Slight separation, subtle cards
 * Example: List items, subtle dividers
 */
export const xs: ViewStyle = {
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.18,
  shadowRadius: 1.0,
  // Android
  elevation: 1,
};

/**
 * SM (Small) - Elevation 2
 * Small shadow (gentle lift)
 * Use for: Cards, chips, small buttons
 * Example: Standard cards, filter chips, secondary buttons
 * This is great for most cards!
 */
export const sm: ViewStyle = {
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.20,
  shadowRadius: 1.41,
  // Android
  elevation: 2,
};

/**
 * MD (Medium) - Elevation 4
 * Medium shadow (clear depth)
 * Use for: Raised buttons, app bar, search bar
 * Example: Primary buttons, toolbars, modals at rest
 * Most commonly used for important interactive elements!
 */
export const md: ViewStyle = {
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.23,
  shadowRadius: 2.62,
  // Android
  elevation: 4,
};

/**
 * LG (Large) - Elevation 6
 * Large shadow (significantly raised)
 * Use for: Floating action button (FAB), active elements
 * Example: FABs, snackbars, elevated modals
 */
export const lg: ViewStyle = {
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.27,
  shadowRadius: 4.65,
  // Android
  elevation: 6,
};

/**
 * XL (Extra Large) - Elevation 8
 * Very large shadow (highly elevated)
 * Use for: Dialogs, pickers, dropdown menus
 * Example: Modal dialogs, bottom sheets, menus
 */
export const xl: ViewStyle = {
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.30,
  shadowRadius: 4.65,
  // Android
  elevation: 8,
};

/**
 * XXL (Extra Extra Large) - Elevation 12
 * Huge shadow (floating high)
 * Use for: Top-level dialogs, important overlays
 * Example: Critical alerts, high-priority modals
 */
export const xxl: ViewStyle = {
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.37,
  shadowRadius: 7.49,
  // Android
  elevation: 12,
};

/**
 * MAX - Elevation 24
 * Maximum shadow (highest possible elevation)
 * Use for: Navigation drawer, fullscreen dialogs
 * Example: Side navigation drawer, fullscreen overlays
 * Use sparingly - very dramatic effect!
 */
export const max: ViewStyle = {
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.58,
  shadowRadius: 16.00,
  // Android
  elevation: 24,
};

/**
 * COMPONENT-SPECIFIC SHADOWS
 * ===========================
 * Pre-defined shadows for common components.
 * Makes code more semantic and readable.
 */
export const componentShadows = {
  /**
   * CARDS
   * Different card importance levels
   */
  card: {
    default: sm,    // Most cards use small shadow
    elevated: md,   // Important/interactive cards
    featured: lg,   // Featured/hero cards
  },

  /**
   * BUTTONS
   * Buttons benefit from shadows to show they're interactive
   */
  button: {
    default: sm,    // Regular buttons
    primary: md,    // Primary action buttons
    fab: lg,        // Floating action buttons (always large)
  },

  /**
   * MODALS & OVERLAYS
   * Modals need strong shadows to separate from content below
   */
  modal: {
    default: xl,    // Standard modals
    fullscreen: xxl, // Fullscreen modals
    sheet: lg,      // Bottom sheets
  },

  /**
   * NAVIGATION
   * Navigation elements float above content
   */
  navigation: {
    header: sm,     // Top navigation bar
    tab: sm,        // Tab bar
    drawer: max,    // Side drawer (maximum elevation)
  },

  /**
   * DROPDOWNS & MENUS
   * These need to clearly float above other content
   */
  dropdown: {
    menu: lg,       // Dropdown menus
    picker: xl,     // Pickers and selectors
  },

  /**
   * ALERTS & TOASTS
   * Notifications need to be clearly visible
   */
  alert: {
    toast: md,      // Toast notifications
    snackbar: lg,   // Snackbars
    banner: sm,     // Banner alerts
  },

} as const;

/**
 * COLORED SHADOWS
 * ===============
 * Sometimes you want shadows that match your brand color.
 * Creates a unique, playful effect!
 */

/**
 * Creates a colored shadow (iOS only - Android is always black)
 * @param color - The shadow color (hex string)
 * @param size - The shadow size ('sm', 'md', 'lg', etc.)
 * @returns Shadow style object with custom color
 *
 * Example:
 * ```typescript
 * coloredShadow('#6200EE', 'md') // Purple shadow
 * ```
 */
export const coloredShadow = (
  color: string,
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'max'
): ViewStyle => {
  // Get the base shadow size
  const baseShadow = {
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    max,
  }[size];

  // Return shadow with custom color (iOS) and standard elevation (Android)
  return {
    ...baseShadow,
    shadowColor: color, // Only affects iOS
  };
};

/**
 * INSET SHADOWS
 * =============
 * React Native doesn't support inset shadows directly.
 * For inset effects, use borders or nested views with negative margins.
 *
 * Workaround for inset shadow effect:
 * ```typescript
 * <View style={{ backgroundColor: '#FFF', padding: 20 }}>
 *   <View style={{
 *     backgroundColor: '#F5F5F5',
 *     padding: 20,
 *     borderWidth: 1,
 *     borderColor: 'rgba(0,0,0,0.1)',
 *   }}>
 *     // Content that appears "pressed in"
 *   </View>
 * </View>
 * ```
 */

/**
 * HOW TO USE SHADOWS IN YOUR COMPONENTS:
 * =======================================
 *
 * Import shadows:
 * ```typescript
 * import { sm, md, lg, componentShadows } from '../theme/shadows';
 * ```
 *
 * Use in StyleSheet:
 * ```typescript
 * const styles = StyleSheet.create({
 *   card: {
 *     backgroundColor: '#FFF',
 *     borderRadius: 12,
 *     padding: 20,
 *     ...sm,  // ✅ Spread shadow properties
 *     // ...  // ❌ Don't manually write shadow properties
 *   },
 *   button: {
 *     ...componentShadows.button.primary, // Semantic shadow
 *   },
 * });
 * ```
 *
 * Use inline:
 * ```typescript
 * <View style={[styles.card, md]}>
 *   // Card with medium shadow
 * </View>
 * ```
 *
 * Colored shadow:
 * ```typescript
 * <View style={[styles.card, coloredShadow('#6200EE', 'lg')]}>
 *   // Purple shadow on iOS
 * </View>
 * ```
 */

/**
 * PERFORMANCE CONSIDERATIONS:
 * ===========================
 *
 * 1. **iOS Shadows Are Expensive**: Each shadow view adds rendering cost
 *    - Minimize shadows on list items (use sparingly)
 *    - Consider removing shadows during scrolling for better performance
 *
 * 2. **Android Elevation Is Cheap**: Elevation is hardware-accelerated
 *    - Feel free to use elevation more liberally on Android
 *
 * 3. **Alternatives to Shadows**:
 *    - Borders: `borderWidth: 1, borderColor: '#E5E5E5'`
 *    - Background contrast: Use slightly different background colors
 *    - Spacing: Sometimes extra margin is enough for visual separation
 *
 * 4. **Shadow Optimization Tips**:
 *    - Use `shouldRasterizeIOS` prop for complex shadows
 *    - Avoid shadows on animated elements (use elevation on Android)
 *    - Cache shadow calculations when possible
 */

/**
 * ACCESSIBILITY NOTE:
 * ===================
 * Shadows are purely decorative and don't convey information alone.
 * - Don't rely on shadows to show interactivity (add text/icons too)
 * - Shadows don't affect screen readers
 * - Ensure sufficient color contrast regardless of shadows
 */

/**
 * REAL-WORLD EXAMPLES:
 * ====================
 *
 * Home Screen:
 * - Info cards: sm (subtle depth)
 * - Counter card: sm (same as info cards)
 * - Header: none (flat against screen)
 *
 * Settings Screen:
 * - List items: none (flat)
 * - Grouped sections: sm (slight elevation)
 * - Primary buttons: md (clearly interactive)
 *
 * Profile Screen:
 * - Avatar: md (stands out)
 * - Action buttons: sm (interactive but not primary)
 * - Profile card: sm (contained information)
 *
 * Modal Dialog:
 * - Modal container: xl (floats above everything)
 * - Modal buttons: sm (interactive within modal)
 */

/**
 * DESIGN TIPS:
 * ============
 *
 * 1. **Consistency**: Use the same elevation for similar components
 * 2. **Hierarchy**: Higher importance = higher elevation
 * 3. **Restraint**: Don't shadow everything - it loses impact
 * 4. **Context**: Shadows work best on light backgrounds
 * 5. **Animation**: Increase elevation on press/hover for feedback
 *
 * Elevation Hierarchy Example:
 * Background (0) < Cards (2) < Buttons (4) < FAB (6) < Modal (8) < Drawer (24)
 */

/**
 * LEARN MORE:
 * ===========
 * - Material Design Elevation: https://material.io/design/environment/elevation.html
 * - iOS Shadows: https://developer.apple.com/design/human-interface-guidelines/foundations/materials
 * - Shadow Generator: https://ethercreative.github.io/react-native-shadow-generator/
 */

// Export all shadows for easy importing
export const shadows = {
  none,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  max,
  component: componentShadows,
  colored: coloredShadow,
} as const;
