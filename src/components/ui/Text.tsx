/**
 * Text Component
 *
 * A foundational typography component that wraps React Native's Text
 * with consistent styling and semantic variants.
 *
 * WHY WE NEED THIS:
 * - React Native's Text has no default styling
 * - We want consistent typography throughout the app
 * - Different text types (headings, body, captions) need different styles
 * - Tailwind classes should work seamlessly
 *
 * DESIGN PRINCIPLES:
 * - Clean, readable typography
 * - Consistent font weights and sizes
 * - Semantic variants (h1, h2, body, small, etc.)
 * - Easy to customize via className prop
 */

import React from "react";
import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { cn } from "@/lib/utils";

/**
 * Text Variants
 *
 * Each variant defines a specific text style for different purposes:
 * - h1, h2, h3: Headings (larger, bolder)
 * - body: Standard paragraph text
 * - lead: Emphasized body text (intros, callouts)
 * - large: Slightly larger body text
 * - small: Smaller supporting text
 * - muted: De-emphasized text (secondary info)
 */
type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "lead"
  | "large"
  | "small"
  | "muted";

/**
 * Props for the Text component
 *
 * @extends RNTextProps - All standard React Native Text props
 * @property variant - The visual style variant to apply
 * @property className - Additional Tailwind classes (will merge with variant styles)
 */
interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
  children: React.ReactNode;
}

/**
 * Variant Styles Map
 *
 * Maps each variant to its Tailwind classes.
 * These follow a typographic scale for visual hierarchy.
 *
 * Font sizes (in React Native units, roughly):
 * - h1: 36px (text-4xl)
 * - h2: 30px (text-3xl)
 * - h3: 24px (text-2xl)
 * - h4: 20px (text-xl)
 * - body: 16px (text-base)
 * - lead: 20px (text-xl) with lighter weight
 * - large: 18px (text-lg)
 * - small: 14px (text-sm)
 * - muted: 14px (text-sm) with muted color
 */
const variantStyles: Record<TextVariant, string> = {
  // Headings - bold and larger
  h1: "text-4xl font-bold tracking-tight text-foreground",
  h2: "text-3xl font-semibold tracking-tight text-foreground",
  h3: "text-2xl font-semibold text-foreground",
  h4: "text-xl font-semibold text-foreground",

  // Body text variants
  body: "text-base text-foreground leading-relaxed",
  lead: "text-xl text-muted-foreground leading-relaxed",
  large: "text-lg font-medium text-foreground",
  small: "text-sm text-foreground",
  muted: "text-sm text-muted-foreground",
};

/**
 * Text Component
 *
 * @example
 * // Heading
 * <Text variant="h1">Welcome Back</Text>
 *
 * @example
 * // Body text
 * <Text variant="body">This is a paragraph of text.</Text>
 *
 * @example
 * // Muted caption
 * <Text variant="muted">Last updated 5 minutes ago</Text>
 *
 * @example
 * // Custom styling on top of variant
 * <Text variant="h2" className="text-primary">Colored Heading</Text>
 */
export function Text({
  variant = "body",
  className,
  children,
  ...props
}: TextProps) {
  return (
    <RNText
      // cn() merges the variant styles with any custom className
      // Custom classes will override variant styles where they conflict
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </RNText>
  );
}

/**
 * Export variant types for external use
 *
 * This allows other components to reference valid variant names
 * with full TypeScript support.
 */
export type { TextVariant, TextProps };
