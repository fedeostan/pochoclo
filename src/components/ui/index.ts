/**
 * UI Components Index
 *
 * This file exports all UI components from a single location.
 * This pattern is called a "barrel file" and provides several benefits:
 *
 * 1. CLEANER IMPORTS:
 *    Instead of: import { Button } from "@/components/ui/Button"
 *    You can do: import { Button } from "@/components/ui"
 *
 * 2. ENCAPSULATION:
 *    Internal component details stay hidden
 *    Only expose what's meant to be public
 *
 * 3. REFACTORING:
 *    If you move or rename a component file,
 *    only this index needs to change
 *
 * USAGE:
 * import { Button, Input, Text, Card } from "@/components/ui";
 */

// Typography
export { Text } from "./Text";
export type { TextVariant, TextProps } from "./Text";

// Form Elements
export { Button } from "./Button";
export type { ButtonVariant, ButtonSize, ButtonProps } from "./Button";

export { Input } from "./Input";
export type { InputProps } from "./Input";

// Layout & Containers
export {
  Card,
  PressableCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";
export type {
  CardProps,
  PressableCardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from "./Card";

// Navigation
export { NavBar, useNavBarHeight, NAV_BAR_CONTENT_HEIGHT } from "./NavBar";
export type { NavBarProps } from "./NavBar";
