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

// Overlays & Sheets
export { BottomSheet } from "./BottomSheet";
export type { BottomSheetProps, BottomSheetRef } from "./BottomSheet";

// Modal version of BottomSheet - renders ABOVE all UI including tab bar
// Use this when you need the sheet to cover the entire screen (focused interaction)
export { BottomSheetModal } from "./BottomSheetModal";
export type { BottomSheetModalProps, BottomSheetModalRef } from "./BottomSheetModal";

// Full-screen modal - for forms and settings screens
// Use this for profile sub-screens (change email, help, about, etc.)
export { FullScreenModal } from "./FullScreenModal";
export type { FullScreenModalProps, FullScreenModalRef } from "./FullScreenModal";

export { TimePicker } from "./TimePicker";
export type { TimePickerProps } from "./TimePicker";

// Media & Avatars
export { Avatar, getInitials } from "./Avatar";
export type { AvatarProps, AvatarSize } from "./Avatar";

// Selection Components (for Onboarding & Preferences)
export { CategoryChip, CategoryChipGroup } from "./CategoryChip";
export type { CategoryChipProps, CategoryChipGroupProps } from "./CategoryChip";

export { TimeOptionCard, TimeOptionCardGroup } from "./TimeOptionCard";
export type { TimeOptionCardProps, TimeOptionCardGroupProps } from "./TimeOptionCard";
