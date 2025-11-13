/**
 * Button.tsx - Reusable Button Component
 *
 * This is an example of a well-designed, reusable component that uses
 * our design system. It demonstrates professional React Native development patterns.
 *
 * KEY LEARNING CONCEPTS:
 * ======================
 * 1. **Component Props**: How to accept and use props
 * 2. **TypeScript Types**: Typing props for safety
 * 3. **Variants**: Different button styles (primary, secondary, etc.)
 * 4. **Design System Integration**: Using theme values throughout
 * 5. **Composition**: Building complex components from simple ones
 * 6. **Accessibility**: Making components usable for everyone
 *
 * WHY CREATE REUSABLE COMPONENTS?
 * ================================
 * Instead of copying button code everywhere:
 * ❌ BAD: Copy-paste <TouchableOpacity> + styles 20 times
 * ✅ GOOD: Create <Button> once, use everywhere
 *
 * Benefits:
 * - Consistency: All buttons look/behave the same
 * - Maintainability: Fix once, works everywhere
 * - Productivity: Write less code
 * - Flexibility: Easy to add features (loading state, icons, etc.)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';

// Import our design system values
import {
  colors,
  spacing,
  layout,
  special,
  radius,
  componentRadius,
  shadowSm,
  shadowMd,
} from '../theme';

/**
 * ============================================================================
 * TYPESCRIPT TYPES & INTERFACES
 * ============================================================================
 *
 * Defining types first makes our component self-documenting and type-safe.
 */

/**
 * Button Variant Type
 * ===================
 * Defines the visual style of the button.
 * Using a union type ensures only valid variants can be passed.
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Button Size Type
 * ================
 * Defines how large the button should be.
 */
type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Button Props Interface
 * ======================
 * Defines what props our Button component accepts.
 *
 * We extend TouchableOpacityProps to inherit all standard props
 * (onPress, disabled, activeOpacity, etc.)
 */
interface ButtonProps extends TouchableOpacityProps {
  /**
   * The text to display inside the button
   * Required - every button needs a label!
   */
  title: string;

  /**
   * Visual style variant
   * Optional - defaults to 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Button size
   * Optional - defaults to 'medium'
   */
  size?: ButtonSize;

  /**
   * Show loading spinner
   * Optional - defaults to false
   * When true, button is disabled and shows spinner
   */
  loading?: boolean;

  /**
   * Make button full width
   * Optional - defaults to false
   * Useful for forms and mobile layouts
   */
  fullWidth?: boolean;

  /**
   * Custom style for the button container
   * Optional - for one-off customizations
   */
  style?: ViewStyle;

  /**
   * Custom style for the button text
   * Optional - for one-off text customizations
   */
  textStyle?: TextStyle;
}

/**
 * ============================================================================
 * BUTTON COMPONENT
 * ============================================================================
 */

/**
 * Button Component
 * ================
 * A flexible, reusable button component that follows design system principles.
 *
 * @param props - ButtonProps (see interface above)
 * @returns JSX.Element - The rendered button
 *
 * Example usage:
 * ```typescript
 * <Button
 *   title="Sign In"
 *   variant="primary"
 *   onPress={() => handleSignIn()}
 * />
 * ```
 */
export default function Button({
  title,
  variant = 'primary',  // Default variant
  size = 'medium',      // Default size
  loading = false,      // Default not loading
  fullWidth = false,    // Default not full width
  disabled = false,     // Default not disabled
  style,                // Custom styles
  textStyle,            // Custom text styles
  ...rest               // All other TouchableOpacity props
}: ButtonProps) {
  /**
   * VARIANT STYLES
   * ==============
   * Different visual styles based on variant prop.
   * Each variant has different background, text color, and optional border.
   */
  const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    /**
     * PRIMARY - Main action button
     * Use for: Primary actions (Sign In, Submit, Save, etc.)
     * Appearance: Filled with primary color
     */
    primary: {
      container: {
        backgroundColor: colors.primary,
        ...shadowSm,
      },
      text: {
        color: colors.textOnPrimary,
      },
    },

    /**
     * SECONDARY - Secondary action button
     * Use for: Secondary actions (Cancel with action, Alternative choice)
     * Appearance: Filled with secondary color
     */
    secondary: {
      container: {
        backgroundColor: colors.secondary,
        ...shadowSm,
      },
      text: {
        color: colors.textOnSecondary,
      },
    },

    /**
     * OUTLINE - Outlined button
     * Use for: Tertiary actions (Cancel, Back, Skip)
     * Appearance: Transparent with colored border
     */
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
      text: {
        color: colors.primary,
      },
    },

    /**
     * GHOST - Minimal button
     * Use for: Low-priority actions (Cancel, Dismiss)
     * Appearance: Text only, no background or border
     */
    ghost: {
      container: {
        backgroundColor: 'transparent',
      },
      text: {
        color: colors.primary,
      },
    },

    /**
     * DANGER - Destructive action button
     * Use for: Dangerous actions (Delete, Remove, Sign Out)
     * Appearance: Filled with error/danger color
     */
    danger: {
      container: {
        backgroundColor: colors.error,
        ...shadowSm,
      },
      text: {
        color: colors.textOnPrimary, // White text
      },
    },
  };

  /**
   * SIZE STYLES
   * ===========
   * Different sizes for different contexts.
   */
  const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
    /**
     * SMALL - Compact button
     * Use for: Tight spaces, inline actions, chips
     */
    small: {
      container: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: componentRadius.button.small,
      },
      text: {
        ...special.button,
        fontSize: 14, // Slightly smaller text
      },
    },

    /**
     * MEDIUM - Standard button (default)
     * Use for: Most buttons, forms, cards
     */
    medium: {
      container: {
        paddingVertical: layout.buttonPaddingVertical,
        paddingHorizontal: layout.buttonPaddingHorizontal,
        borderRadius: componentRadius.button.default,
      },
      text: {
        ...special.button,
      },
    },

    /**
     * LARGE - Prominent button
     * Use for: Primary CTAs, important actions, landing pages
     */
    large: {
      container: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxl,
        borderRadius: componentRadius.button.large,
        ...shadowMd, // Larger shadow for prominence
      },
      text: {
        ...special.button,
        fontSize: 18, // Larger text
      },
    },
  };

  /**
   * RENDER COMPONENT
   * ================
   * Combine all styles and render the button.
   */
  return (
    <TouchableOpacity
      // Combine all container styles
      style={[
        styles.base,                          // Base styles (always applied)
        variantStyles[variant].container,     // Variant-specific styles
        sizeStyles[size].container,           // Size-specific styles
        fullWidth && styles.fullWidth,        // Full width if requested
        (disabled || loading) && styles.disabled, // Disabled state
        style,                                // Custom styles (overrides)
      ]}
      // Disable if disabled prop or loading
      disabled={disabled || loading}
      // Pass through all other props (onPress, activeOpacity, etc.)
      {...rest}
    >
      {/* Show spinner when loading, otherwise show text */}
      {loading ? (
        <ActivityIndicator
          color={variantStyles[variant].text.color}
          size="small"
        />
      ) : (
        <Text
          style={[
            variantStyles[variant].text,      // Variant text color
            sizeStyles[size].text,            // Size text style
            textStyle,                        // Custom text styles
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

/**
 * ============================================================================
 * STYLES
 * ============================================================================
 * Base styles that apply to all buttons.
 */
const styles = StyleSheet.create({
  /**
   * BASE
   * ====
   * Foundation styles for all buttons.
   * Specific variants and sizes build on top of these.
   */
  base: {
    // Layout
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',

    // Spacing
    minHeight: 44, // iOS minimum touch target

    // Make tappable
    overflow: 'hidden',
  },

  /**
   * FULL WIDTH
   * ==========
   * Makes button stretch to fill available width.
   * Common in forms and mobile layouts.
   */
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },

  /**
   * DISABLED
   * ========
   * Visual state for disabled buttons.
   * Reduces opacity to show it's not interactive.
   */
  disabled: {
    opacity: 0.5, // Semi-transparent
    backgroundColor: colors.disabled,
  },
});

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * PRIMARY BUTTON:
 * ```typescript
 * <Button
 *   title="Sign In"
 *   variant="primary"
 *   onPress={() => handleSignIn()}
 * />
 * ```
 *
 * SECONDARY BUTTON:
 * ```typescript
 * <Button
 *   title="Learn More"
 *   variant="secondary"
 *   size="large"
 *   onPress={() => navigation.navigate('About')}
 * />
 * ```
 *
 * OUTLINE BUTTON:
 * ```typescript
 * <Button
 *   title="Cancel"
 *   variant="outline"
 *   onPress={() => navigation.goBack()}
 * />
 * ```
 *
 * GHOST BUTTON:
 * ```typescript
 * <Button
 *   title="Skip"
 *   variant="ghost"
 *   onPress={() => handleSkip()}
 * />
 * ```
 *
 * DANGER BUTTON:
 * ```typescript
 * <Button
 *   title="Delete Account"
 *   variant="danger"
 *   onPress={() => handleDelete()}
 * />
 * ```
 *
 * LOADING BUTTON:
 * ```typescript
 * <Button
 *   title="Submit"
 *   variant="primary"
 *   loading={isSubmitting}
 *   onPress={() => handleSubmit()}
 * />
 * ```
 *
 * FULL WIDTH BUTTON (common in forms):
 * ```typescript
 * <Button
 *   title="Create Account"
 *   variant="primary"
 *   fullWidth
 *   onPress={() => handleCreateAccount()}
 * />
 * ```
 *
 * SMALL BUTTON:
 * ```typescript
 * <Button
 *   title="Edit"
 *   variant="outline"
 *   size="small"
 *   onPress={() => handleEdit()}
 * />
 * ```
 *
 * DISABLED BUTTON:
 * ```typescript
 * <Button
 *   title="Submit"
 *   variant="primary"
 *   disabled={!isFormValid}
 *   onPress={() => handleSubmit()}
 * />
 * ```
 */

/**
 * ============================================================================
 * EXTENDING THIS COMPONENT
 * ============================================================================
 *
 * Want to add more features? Here are some ideas:
 *
 * 1. **Icon Support**:
 * ```typescript
 * interface ButtonProps {
 *   icon?: React.ReactNode;
 *   iconPosition?: 'left' | 'right';
 * }
 * ```
 *
 * 2. **Press Animations**:
 * Use Animated API to scale button on press
 *
 * 3. **Haptic Feedback**:
 * Add vibration on press using Haptics API
 *
 * 4. **Sound Effects**:
 * Play sound on press for gamified apps
 *
 * 5. **More Variants**:
 * Add 'success', 'warning', 'info' variants
 *
 * 6. **Gradient Backgrounds**:
 * Use LinearGradient for fancy buttons
 *
 * 7. **Badge/Counter**:
 * Show notification count on button
 */

/**
 * ============================================================================
 * DESIGN SYSTEM PRINCIPLES DEMONSTRATED
 * ============================================================================
 *
 * This component demonstrates:
 *
 * ✅ **Single Responsibility**: Does one thing well (renders a button)
 * ✅ **DRY (Don't Repeat Yourself)**: Reusable across the app
 * ✅ **Type Safety**: TypeScript types prevent errors
 * ✅ **Flexibility**: Props allow customization
 * ✅ **Consistency**: Uses design system values
 * ✅ **Accessibility**: Minimum touch targets, clear states
 * ✅ **Documentation**: Extensive comments explain everything
 * ✅ **Composition**: Can be composed into larger components
 * ✅ **Maintainability**: Easy to update and extend
 * ✅ **Professional**: Industry-standard patterns
 *
 * This is how professional React Native developers build components!
 */
