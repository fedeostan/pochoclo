/**
 * Card Component
 *
 * A container component for grouping related content with
 * consistent styling, padding, and visual hierarchy.
 *
 * WHY WE NEED THIS:
 * - Group related content visually
 * - Create visual hierarchy with elevated surfaces
 * - Consistent padding and border radius
 * - Composable with Header, Content, and Footer sub-components
 *
 * DESIGN PRINCIPLES:
 * - Minimal: Clean white background, subtle shadows
 * - Soft: Rounded corners, no harsh edges
 * - Light: White cards on off-white background for depth
 * - Flexible: Works for any content type
 */

import React from "react";
import { View, ViewProps, Pressable, PressableProps } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./Text";

/**
 * Card Container Props
 *
 * @extends ViewProps - All standard React Native View props
 * @property className - Additional Tailwind classes
 * @property variant - Visual style variant (default, outline)
 */
interface CardProps extends ViewProps {
  className?: string;
  variant?: "default" | "outline";
  children: React.ReactNode;
}

/**
 * Card Component
 *
 * The main container that provides background, border, and shadow.
 *
 * @example
 * // Basic card
 * <Card>
 *   <Text>Card content here</Text>
 * </Card>
 *
 * @example
 * // Card with all sections
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <Text>Main content</Text>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 *
 * @example
 * // Outline variant
 * <Card variant="outline">
 *   <Text>Bordered card</Text>
 * </Card>
 */
export function Card({
  className,
  variant = "default",
  children,
  ...props
}: CardProps) {
  return (
    <View
      className={cn(
        // Base styles
        "rounded-lg",
        // Variant styles
        variant === "default" && "bg-card",
        variant === "outline" && "border-2 border-border bg-transparent",
        // Custom classes
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * Pressable Card Props
 *
 * For cards that are interactive (tappable).
 */
interface PressableCardProps extends PressableProps {
  className?: string;
  variant?: "default" | "outline";
  children: React.ReactNode;
}

/**
 * PressableCard Component
 *
 * A card that can be pressed/tapped for navigation or actions.
 *
 * @example
 * <PressableCard onPress={() => navigate('details')}>
 *   <Text>Tap me</Text>
 * </PressableCard>
 */
export function PressableCard({
  className,
  variant = "default",
  children,
  ...props
}: PressableCardProps) {
  return (
    <Pressable
      className={cn(
        // Base styles
        "rounded-lg active:opacity-90",
        // Variant styles
        variant === "default" && "bg-card",
        variant === "outline" && "border-2 border-border bg-transparent",
        // Custom classes
        className
      )}
      {...props}
    >
      {children}
    </Pressable>
  );
}

/**
 * CardHeader Props
 */
interface CardHeaderProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * CardHeader Component
 *
 * Container for the card's header section (title, description, etc.).
 * Provides consistent padding at the top of the card.
 */
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <View className={cn("p-6 pb-0", className)} {...props}>
      {children}
    </View>
  );
}

/**
 * CardTitle Props
 */
interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * CardTitle Component
 *
 * The main title text for a card.
 * Uses h3 variant by default for appropriate sizing.
 */
export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <Text variant="h4" className={cn("", className)}>
      {children}
    </Text>
  );
}

/**
 * CardDescription Props
 */
interface CardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * CardDescription Component
 *
 * Subtitle or description text for a card.
 * Uses muted styling for visual hierarchy.
 */
export function CardDescription({ className, children }: CardDescriptionProps) {
  return (
    <Text variant="muted" className={cn("mt-1", className)}>
      {children}
    </Text>
  );
}

/**
 * CardContent Props
 */
interface CardContentProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * CardContent Component
 *
 * Container for the card's main content.
 * Provides consistent horizontal padding.
 */
export function CardContent({
  className,
  children,
  ...props
}: CardContentProps) {
  return (
    <View className={cn("p-6", className)} {...props}>
      {children}
    </View>
  );
}

/**
 * CardFooter Props
 */
interface CardFooterProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * CardFooter Component
 *
 * Container for card actions/buttons.
 * Provides consistent padding and flex layout for buttons.
 */
export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <View
      className={cn("flex-row items-center p-6 pt-0", className)}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * Export types for external use
 */
export type {
  CardProps,
  PressableCardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
};
