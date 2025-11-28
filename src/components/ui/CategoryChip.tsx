/**
 * CategoryChip Component
 *
 * A selectable chip/tag component for category selection.
 * Used in both onboarding and profile settings for choosing learning categories.
 *
 * WHY WE NEED THIS:
 * - Toggle selection with visual feedback
 * - Consistent styling across category selection screens
 * - Supports both predefined and custom categories
 * - Reusable in onboarding and settings
 *
 * DESIGN PRINCIPLES:
 * - Minimal: Simple pill shape, clean typography
 * - Soft: Gentle colors, rounded-full for pill effect
 * - Modern: Subtle color transitions on selection
 * - Accessible: Clear visual states, touch-friendly size
 *
 * STATES:
 * - Unselected: Light background, subtle border
 * - Selected: Primary color tint, primary border
 * - Disabled: Reduced opacity, not interactive
 */

import React from "react";
import { Pressable, PressableProps, View } from "react-native";
import { X, Plus } from "lucide-react-native";
import { cn } from "@/utils";
import { Text } from "./Text";

/**
 * CategoryChip Props
 *
 * @property label - The text to display on the chip
 * @property selected - Whether the chip is currently selected
 * @property onPress - Callback when chip is pressed (toggle selection)
 * @property showRemoveIcon - Shows X icon for removing (used for custom categories)
 * @property isAddButton - Renders as an "Add" button with plus icon
 * @property disabled - Disables the chip
 * @property className - Additional Tailwind classes
 */
interface CategoryChipProps extends Omit<PressableProps, "children"> {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  showRemoveIcon?: boolean;
  isAddButton?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * CategoryChip Component
 *
 * @example
 * // Basic unselected chip
 * <CategoryChip
 *   label="Technology"
 *   selected={false}
 *   onPress={() => handleSelect('technology')}
 * />
 *
 * @example
 * // Selected chip
 * <CategoryChip
 *   label="Science"
 *   selected={true}
 *   onPress={() => handleDeselect('science')}
 * />
 *
 * @example
 * // Custom category with remove icon
 * <CategoryChip
 *   label="Blockchain"
 *   selected={true}
 *   showRemoveIcon
 *   onPress={() => handleRemove('custom:blockchain')}
 * />
 *
 * @example
 * // Add button variant
 * <CategoryChip
 *   label="Add Custom"
 *   isAddButton
 *   onPress={() => setShowInput(true)}
 * />
 */
export function CategoryChip({
  label,
  selected = false,
  onPress,
  showRemoveIcon = false,
  isAddButton = false,
  disabled = false,
  className,
  ...props
}: CategoryChipProps) {
  /**
   * Determine the visual state of the chip
   *
   * Three main states:
   * 1. Add button: Dashed border, plus icon
   * 2. Selected: Primary background tint, primary border
   * 3. Unselected: White background, subtle border
   */
  const isDisabled = disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{
        selected,
        disabled: isDisabled,
      }}
      accessibilityLabel={
        isAddButton
          ? `Add custom category`
          : `${label}, ${selected ? "selected" : "not selected"}`
      }
      className={cn(
        // Base styles: pill shape, horizontal padding, vertical padding
        "flex-row items-center px-4 py-2 rounded-full",
        // Transition effect on press
        "active:opacity-80",
        // Conditional styles based on state
        isAddButton && [
          // Add button: dashed border, transparent background
          "border-2 border-dashed border-primary bg-transparent",
        ],
        !isAddButton && selected && [
          // Selected: Primary background tint, solid primary border
          "bg-primary/10 border-2 border-primary",
        ],
        !isAddButton && !selected && [
          // Unselected: White background, subtle border
          "bg-card border-2 border-border",
        ],
        // Disabled state
        isDisabled && "opacity-50",
        className
      )}
      {...props}
    >
      {/* Plus icon for add button */}
      {isAddButton && (
        <Plus
          size={16}
          color="#6B8E7B" // primary color
          strokeWidth={2.5}
          style={{ marginRight: 6 }}
        />
      )}

      {/* Label text */}
      <Text
        className={cn(
          "text-sm font-medium",
          // Text color based on state
          isAddButton && "text-primary",
          !isAddButton && selected && "text-primary",
          !isAddButton && !selected && "text-foreground"
        )}
      >
        {label}
      </Text>

      {/* Remove icon for custom categories */}
      {showRemoveIcon && selected && !isAddButton && (
        <View className="ml-2">
          <X
            size={14}
            color="#6B8E7B" // primary color
            strokeWidth={2.5}
          />
        </View>
      )}
    </Pressable>
  );
}

/**
 * CategoryChipGroup Component
 *
 * A container that wraps multiple CategoryChips in a flex-wrap layout.
 * Provides consistent gap spacing between chips.
 *
 * @example
 * <CategoryChipGroup>
 *   {categories.map(cat => (
 *     <CategoryChip
 *       key={cat}
 *       label={cat}
 *       selected={selectedCategories.includes(cat)}
 *       onPress={() => toggleCategory(cat)}
 *     />
 *   ))}
 * </CategoryChipGroup>
 */
interface CategoryChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function CategoryChipGroup({
  children,
  className,
}: CategoryChipGroupProps) {
  return (
    <View className={cn("flex-row flex-wrap gap-2", className)}>{children}</View>
  );
}

/**
 * Export types for external use
 */
export type { CategoryChipProps, CategoryChipGroupProps };

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. ACCESSIBILITY
 *
 *    We use several accessibility props:
 *    - accessibilityRole="button": Tells screen readers it's interactive
 *    - accessibilityState.selected: Announces selection state
 *    - accessibilityLabel: Custom label for screen readers
 *
 *    This is crucial for users with visual impairments!
 *
 * 2. TAILWIND COLOR OPACITY
 *
 *    We use bg-primary/10 for a 10% opacity primary color.
 *    This is Tailwind's opacity modifier syntax:
 *    - bg-primary: Full primary color (#6B8E7B)
 *    - bg-primary/10: 10% opacity primary (rgba(107, 142, 123, 0.1))
 *
 *    Great for subtle background tints!
 *
 * 3. DASHED BORDERS
 *
 *    For the "Add" button, we use border-dashed to create a
 *    dotted/dashed border effect. This visually distinguishes
 *    it from regular category chips and signals "add new".
 *
 * 4. PRESSABLE VS TOUCHABLEOPACITY
 *
 *    We use Pressable instead of TouchableOpacity because:
 *    - More control over pressed state styling
 *    - Better accessibility support
 *    - Can use active:opacity-80 for press feedback
 *    - Official recommendation from React Native
 *
 * 5. ICON SIZING
 *
 *    Icons from lucide-react-native:
 *    - size={16}: Small icons that fit with text
 *    - strokeWidth={2.5}: Slightly bolder for visibility
 *    - color: Must be a hex/rgb value, not Tailwind class
 *
 * 6. REUSABILITY
 *
 *    This component works for:
 *    - Predefined categories (just label + selected)
 *    - Custom categories (with showRemoveIcon)
 *    - Add button (with isAddButton)
 *
 *    Same component, different configurations!
 */
