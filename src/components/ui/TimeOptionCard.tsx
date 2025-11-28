/**
 * TimeOptionCard Component
 *
 * A selectable card component for choosing daily learning time.
 * Used in onboarding and profile settings for time preference selection.
 *
 * WHY WE NEED THIS:
 * - Single-select option cards (radio button behavior)
 * - Clear visual feedback for selected state
 * - Supports predefined options and custom "Other" option
 * - Consistent styling across time selection screens
 *
 * DESIGN PRINCIPLES:
 * - Minimal: Clean cards with focused information
 * - Soft: Gentle colors, rounded corners
 * - Modern: Subtle borders, primary accent when selected
 * - Accessible: Clear visual states, touch-friendly
 *
 * STATES:
 * - Unselected: White background, subtle border, shadow
 * - Selected: Primary border highlight, primary background tint
 * - Disabled: Reduced opacity
 */

import React from "react";
import { Pressable, PressableProps, View } from "react-native";
import { Clock, Check } from "lucide-react-native";
import { cn } from "@/utils";
import { Text } from "./Text";

/**
 * TimeOptionCard Props
 *
 * @property label - The main text (e.g., "15 minutes a day")
 * @property description - Secondary text explaining the option
 * @property selected - Whether this option is currently selected
 * @property onPress - Callback when card is pressed
 * @property showIcon - Whether to show the clock icon (default: true)
 * @property isOtherOption - Renders as the "Other" option style
 * @property disabled - Disables the card
 * @property className - Additional Tailwind classes
 */
interface TimeOptionCardProps extends Omit<PressableProps, "children"> {
  label: string;
  description?: string;
  selected?: boolean;
  onPress?: () => void;
  showIcon?: boolean;
  isOtherOption?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode; // For custom content (like input field)
}

/**
 * TimeOptionCard Component
 *
 * @example
 * // Basic time option
 * <TimeOptionCard
 *   label="15 minutes a day"
 *   description="Balanced learning"
 *   selected={selectedTime === 15}
 *   onPress={() => setSelectedTime(15)}
 * />
 *
 * @example
 * // Selected state
 * <TimeOptionCard
 *   label="30 minutes a day"
 *   description="Deep dive sessions"
 *   selected={true}
 *   onPress={() => {}}
 * />
 *
 * @example
 * // "Other" option with custom input
 * <TimeOptionCard
 *   label="Other"
 *   description="Set your own time"
 *   isOtherOption
 *   selected={isCustomTime}
 *   onPress={() => setIsCustomTime(true)}
 * >
 *   {isCustomTime && (
 *     <TextInput
 *       placeholder="Enter minutes"
 *       value={customMinutes}
 *       onChangeText={setCustomMinutes}
 *     />
 *   )}
 * </TimeOptionCard>
 */
export function TimeOptionCard({
  label,
  description,
  selected = false,
  onPress,
  showIcon = true,
  isOtherOption = false,
  disabled = false,
  className,
  children,
  ...props
}: TimeOptionCardProps) {
  const isDisabled = disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="radio"
      accessibilityState={{
        checked: selected,
        disabled: isDisabled,
      }}
      accessibilityLabel={`${label}${description ? `, ${description}` : ""}`}
      className={cn(
        // Base styles: rounded card with padding
        "rounded-xl p-4",
        // Press feedback
        "active:opacity-90",
        // Unselected state: white background, subtle border, shadow
        !selected && "bg-card border-2 border-border",
        // Selected state: primary border, light primary background
        selected && "bg-primary/5 border-2 border-primary",
        // Disabled state
        isDisabled && "opacity-50",
        className
      )}
      {...props}
    >
      <View className="flex-row items-center">
        {/* Clock icon or check mark */}
        {showIcon && (
          <View
            className={cn(
              "w-10 h-10 rounded-full items-center justify-center mr-3",
              // Icon container background
              !selected && "bg-muted/20",
              selected && "bg-primary/20"
            )}
          >
            {selected ? (
              <Check
                size={20}
                color="#6B8E7B" // primary color
                strokeWidth={2.5}
              />
            ) : (
              <Clock
                size={20}
                color="#78716C" // muted color
                strokeWidth={2}
              />
            )}
          </View>
        )}

        {/* Text content */}
        <View className="flex-1">
          {/* Main label */}
          <Text
            className={cn(
              "text-base font-semibold",
              selected ? "text-primary" : "text-foreground"
            )}
          >
            {label}
          </Text>

          {/* Description */}
          {description && (
            <Text className="text-sm text-muted-foreground mt-0.5">
              {description}
            </Text>
          )}
        </View>

        {/* Selection indicator (radio-like) */}
        <View
          className={cn(
            "w-6 h-6 rounded-full border-2 items-center justify-center",
            !selected && "border-border",
            selected && "border-primary bg-primary"
          )}
        >
          {selected && (
            <View className="w-2 h-2 rounded-full bg-white" />
          )}
        </View>
      </View>

      {/* Custom content (for "Other" option input) */}
      {children && <View className="mt-3">{children}</View>}
    </Pressable>
  );
}

/**
 * TimeOptionCardGroup Component
 *
 * A container that wraps multiple TimeOptionCards with consistent spacing.
 * Use this to create a radio-group-like selection interface.
 *
 * @example
 * <TimeOptionCardGroup>
 *   {timeOptions.map(option => (
 *     <TimeOptionCard
 *       key={option.minutes}
 *       label={option.label}
 *       description={option.description}
 *       selected={selectedMinutes === option.minutes}
 *       onPress={() => setSelectedMinutes(option.minutes)}
 *     />
 *   ))}
 * </TimeOptionCardGroup>
 */
interface TimeOptionCardGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function TimeOptionCardGroup({
  children,
  className,
}: TimeOptionCardGroupProps) {
  return <View className={cn("gap-3", className)}>{children}</View>;
}

/**
 * Export types for external use
 */
export type { TimeOptionCardProps, TimeOptionCardGroupProps };

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. RADIO BUTTON BEHAVIOR
 *
 *    Time selection is single-select (like radio buttons):
 *    - Only one option can be selected at a time
 *    - accessibilityRole="radio" tells screen readers
 *    - accessibilityState.checked communicates selection
 *
 *    The parent component manages which one is selected,
 *    this component just reports its own state.
 *
 * 2. COMPOUND COMPONENTS PATTERN
 *
 *    Notice how TimeOptionCard can receive children?
 *    This is for the "Other" option where we need to show
 *    an input field inside the card when selected.
 *
 *    Parent usage:
 *    <TimeOptionCard label="Other" selected={isOther}>
 *      {isOther && <TextInput ... />}
 *    </TimeOptionCard>
 *
 *    The input only renders when the "Other" card is selected.
 *
 * 3. ICON STATES
 *
 *    We swap icons based on selection:
 *    - Unselected: Clock icon (shows it's a time option)
 *    - Selected: Check icon (confirms selection)
 *
 *    This provides immediate visual feedback beyond just colors.
 *
 * 4. RADIO INDICATOR DESIGN
 *
 *    The circle on the right mimics traditional radio buttons:
 *    - Unselected: Empty circle with border
 *    - Selected: Filled circle with white dot center
 *
 *    This familiar pattern helps users understand it's single-select.
 *
 * 5. TAILWIND NEGATIVE MARGINS
 *
 *    If you need tighter spacing, Tailwind supports negative margins:
 *    - -mt-1 (negative margin top)
 *    - -ml-2 (negative margin left)
 *
 *    Useful for fine-tuning layouts.
 *
 * 6. BG-PRIMARY/5 VS BG-PRIMARY/10
 *
 *    For subtle background tints:
 *    - /5 = 5% opacity (very subtle)
 *    - /10 = 10% opacity (more visible)
 *    - /20 = 20% opacity (clearly tinted)
 *
 *    We use /5 for selected card backgrounds because
 *    the border already provides strong visual feedback.
 *
 * 7. COMPOSITION OVER CONFIGURATION
 *
 *    Instead of adding many props for customization,
 *    we allow children for flexibility.
 *
 *    This follows React's composition pattern:
 *    - Component handles styling and structure
 *    - Parent provides custom content as needed
 *    - Less prop drilling, more flexible
 *
 * 8. GROUP COMPONENTS
 *
 *    Both CategoryChipGroup and TimeOptionCardGroup exist to:
 *    - Provide consistent spacing (gap-2, gap-3)
 *    - Establish layout patterns (flex-wrap vs stacked)
 *    - Make usage cleaner in parent components
 *
 *    You could do this inline, but a named component
 *    makes the code more readable and maintainable.
 */
