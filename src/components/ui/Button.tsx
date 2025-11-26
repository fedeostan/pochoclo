/**
 * Button Component
 *
 * A versatile, accessible button component with multiple variants and sizes.
 * Built with NativeWind (Tailwind) for consistent styling.
 *
 * WHY WE NEED THIS:
 * - Consistent button styling across the app
 * - Multiple visual variants for different contexts
 * - Accessibility built-in (disabled states, press feedback)
 * - Type-safe props with full TypeScript support
 *
 * DESIGN PRINCIPLES:
 * - Minimal: Clean, simple button designs
 * - Soft: Gentle colors, no harsh contrasts
 * - Modern: Rounded corners, subtle shadows
 * - Accessible: Clear focus states, disabled styles
 */

import React from "react";
import {
  Pressable,
  PressableProps,
  ActivityIndicator,
  View,
} from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./Text";

/**
 * Button Variants
 *
 * Each variant serves a different purpose in the UI:
 * - default: Primary action (filled with primary color)
 * - secondary: Secondary action (subtle background)
 * - outline: Less emphasis (border only)
 * - ghost: Minimal emphasis (transparent, text only)
 * - destructive: Dangerous actions (delete, cancel)
 * - link: Text-only, looks like a hyperlink
 */
type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";

/**
 * Button Sizes
 *
 * Different sizes for different contexts:
 * - sm: Compact, for tight spaces
 * - default: Standard size for most buttons
 * - lg: Larger, for prominent CTAs
 * - icon: Square button for icon-only buttons
 */
type ButtonSize = "default" | "sm" | "lg" | "icon";

/**
 * Button Props
 *
 * @extends PressableProps - All standard React Native Pressable props
 * @property variant - Visual style variant
 * @property size - Size variant
 * @property isLoading - Shows loading spinner, disables button
 * @property leftIcon - Icon element to show before text
 * @property rightIcon - Icon element to show after text
 * @property className - Additional Tailwind classes
 */
interface ButtonProps extends Omit<PressableProps, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Base button styles
 *
 * These styles apply to ALL button variants:
 * - Flexbox centering for content
 * - Rounded corners (lg = 12px from our theme)
 * - Disabled opacity
 */
const baseStyles =
  "flex-row items-center justify-center rounded-lg active:opacity-80";

/**
 * Variant Styles
 *
 * Each variant defines background, text color, and border styles.
 * The design uses our soft color palette for a minimal, modern look.
 */
const variantStyles: Record<ButtonVariant, string> = {
  // Primary action - soft sage green
  default: "bg-primary",

  // Secondary action - subtle gray background
  secondary: "bg-secondary",

  // Outline - border only, transparent background
  outline: "border-2 border-border bg-transparent",

  // Ghost - completely transparent, minimal emphasis
  ghost: "bg-transparent",

  // Destructive - for dangerous actions (soft red)
  destructive: "bg-destructive",

  // Link - text only, no background
  link: "bg-transparent",
};

/**
 * Text Styles by Variant
 *
 * Each variant needs appropriate text color for contrast and readability.
 */
const textVariantStyles: Record<ButtonVariant, string> = {
  default: "text-primary-foreground font-semibold",
  secondary: "text-secondary-foreground font-semibold",
  outline: "text-foreground font-semibold",
  ghost: "text-foreground font-semibold",
  destructive: "text-destructive-foreground font-semibold",
  link: "text-primary font-semibold underline",
};

/**
 * Size Styles
 *
 * Defines padding and minimum dimensions for each size.
 * Uses our spacing scale for consistency.
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-2",
  default: "px-6 py-3",
  lg: "px-8 py-4",
  icon: "p-3",
};

/**
 * Text Size Styles
 *
 * Different text sizes to match button sizes.
 */
const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm",
  default: "text-base",
  lg: "text-lg",
  icon: "text-base",
};

/**
 * Button Component
 *
 * @example
 * // Primary button (default)
 * <Button onPress={handleSubmit}>Submit</Button>
 *
 * @example
 * // Secondary button
 * <Button variant="secondary" onPress={handleCancel}>Cancel</Button>
 *
 * @example
 * // Outline button with icon
 * <Button variant="outline" leftIcon={<Icon name="plus" />}>
 *   Add Item
 * </Button>
 *
 * @example
 * // Loading state
 * <Button isLoading onPress={handleSubmit}>Saving...</Button>
 *
 * @example
 * // Destructive action
 * <Button variant="destructive" onPress={handleDelete}>Delete Account</Button>
 */
export function Button({
  variant = "default",
  size = "default",
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  // Button is disabled when explicitly disabled OR when loading
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      // Merge all styles: base + variant + size + disabled + custom
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && "opacity-50",
        className
      )}
      disabled={isDisabled}
      // accessibilityRole tells screen readers this is a button
      accessibilityRole="button"
      // accessibilityState communicates disabled state to screen readers
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {/* Loading spinner (replaces left icon when loading) */}
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "default" ? "#FFFFFF" : "#6B8E7B"}
          className="mr-2"
        />
      ) : (
        // Left icon with spacing
        leftIcon && <View className="mr-2">{leftIcon}</View>
      )}

      {/* Button text */}
      <Text
        className={cn(textVariantStyles[variant], textSizeStyles[size])}
      >
        {children}
      </Text>

      {/* Right icon with spacing */}
      {rightIcon && !isLoading && <View className="ml-2">{rightIcon}</View>}
    </Pressable>
  );
}

/**
 * Export types for external use
 */
export type { ButtonVariant, ButtonSize, ButtonProps };
