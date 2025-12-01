/**
 * SettingsItem Component
 *
 * A versatile list item component for settings screens that can display:
 * - Navigation items (tappable, shows chevron)
 * - Toggle items (shows switch)
 * - Display-only items (shows static value/badge)
 *
 * PURPOSE:
 * This is the workhorse of settings screens. Every row in a settings
 * section uses this component, ensuring consistent layout and behavior
 * across all settings.
 *
 * ANATOMY:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ [Icon]  Label                              [Right Element]  ›  │
 * │         Subtitle (optional, muted)                             │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * The right element varies by type:
 * - navigation: Chevron (›)
 * - toggle: Switch component
 * - display: Custom element (badge, status icon, etc.)
 *
 * DESIGN DECISIONS:
 * - 44pt minimum touch target: Accessibility requirement
 * - Icon container: Fixed width ensures alignment
 * - Flex label: Takes remaining space
 * - Dividers: Handled by not being last child
 */

import React from 'react';
import { View, Pressable, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { colors } from '@/theme';

/**
 * SettingsItem Types
 *
 * - navigation: Tappable item that navigates somewhere (shows chevron)
 * - toggle: Item with a toggle switch (on/off)
 * - display: Non-interactive item showing a value (badge, status, etc.)
 */
type SettingsItemType = 'navigation' | 'toggle' | 'display';

/**
 * Props for SettingsItem
 */
interface SettingsItemProps {
  /** Icon displayed on the left (use Lucide icons, 20px) */
  icon: React.ReactNode;
  /** Main label text */
  label: string;
  /** Optional subtitle shown below label (muted style) */
  subtitle?: string;
  /** Type of item: navigation, toggle, or display */
  type: SettingsItemType;
  /** For toggle type: current value */
  value?: boolean;
  /** For navigation type: called when pressed */
  onPress?: () => void;
  /** For toggle type: called when switch changes */
  onToggle?: (value: boolean) => void;
  /** For display type: custom element to show on right */
  rightElement?: React.ReactNode;
  /** Whether to show bottom border (true except for last item) */
  showBorder?: boolean;
  /** Disable the item (grays out, not interactive) */
  disabled?: boolean;
}

/**
 * SettingsItem Component
 *
 * @example
 * // Navigation item
 * <SettingsItem
 *   icon={<BookOpen size={20} color={colors.primary} />}
 *   label="Learning Preferences"
 *   subtitle="Technology, Science • 15 min/day"
 *   type="navigation"
 *   onPress={() => router.push('/edit-preferences')}
 * />
 *
 * @example
 * // Toggle item
 * <SettingsItem
 *   icon={<Bell size={20} color={colors.primary} />}
 *   label="Daily Reminder"
 *   subtitle="9:00 AM"
 *   type="toggle"
 *   value={reminderEnabled}
 *   onToggle={setReminderEnabled}
 * />
 *
 * @example
 * // Display item with custom right element
 * <SettingsItem
 *   icon={<Shield size={20} color={colors.primary} />}
 *   label="Email Verified"
 *   type="display"
 *   rightElement={
 *     <View className="flex-row items-center">
 *       <CheckCircle size={18} color={colors.primary} />
 *     </View>
 *   }
 * />
 */
export function SettingsItem({
  icon,
  label,
  subtitle,
  type,
  value,
  onPress,
  onToggle,
  rightElement,
  showBorder = true,
  disabled = false,
}: SettingsItemProps) {
  /**
   * Render Right Element
   *
   * Returns the appropriate element for the right side based on type:
   * - navigation: Chevron icon
   * - toggle: Switch component
   * - display: Custom rightElement or nothing
   */
  const renderRightElement = () => {
    switch (type) {
      case 'navigation':
        return (
          <ChevronRight
            size={20}
            color={colors.mutedForeground}
            strokeWidth={2}
          />
        );

      case 'toggle':
        return (
          <Switch
            value={value}
            onValueChange={onToggle}
            disabled={disabled}
            // Use primary color for active state
            trackColor={{
              false: colors.border,
              true: colors.primary + '80', // 50% opacity
            }}
            thumbColor={value ? colors.primary : colors.surface}
            // iOS-specific styling
            ios_backgroundColor={colors.border}
          />
        );

      case 'display':
        return rightElement || null;

      default:
        return null;
    }
  };

  /**
   * Content Layout
   *
   * The inner content is the same for all types:
   * - Icon on left with fixed width container
   * - Label and optional subtitle in the middle (flex-1)
   * - Right element on the right
   */
  const content = (
    <View
      className={`
        flex-row items-center p-4
        ${showBorder ? 'border-b border-border' : ''}
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      {/**
       * Icon Container
       *
       * Fixed width ensures all icons align vertically.
       * Background creates a subtle visual anchor.
       * Rounded corners match design system.
       */}
      <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3">
        {icon}
      </View>

      {/**
       * Label Container
       *
       * flex-1 takes all available space between icon and right element.
       * Contains main label and optional subtitle.
       */}
      <View className="flex-1">
        <Text className="font-medium">{label}</Text>
        {subtitle && (
          <Text variant="small" className="text-muted-foreground mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>

      {/**
       * Right Element
       *
       * Chevron, toggle, or custom element based on type.
       */}
      {renderRightElement()}
    </View>
  );

  /**
   * Wrapper Component
   *
   * For navigation and toggle types, we wrap in Pressable for touch handling.
   * For display type, we use a plain View (no interaction).
   *
   * Note: Toggle items are Pressable so tapping anywhere toggles the switch
   * (better UX than requiring precise switch taps).
   */
  if (type === 'navigation' || type === 'toggle') {
    return (
      <Pressable
        onPress={type === 'navigation' ? onPress : () => onToggle?.(!value)}
        disabled={disabled}
        className="active:bg-muted/50"
        accessibilityRole={type === 'navigation' ? 'button' : 'switch'}
        accessibilityState={type === 'toggle' ? { checked: value } : undefined}
        accessibilityLabel={`${label}${subtitle ? `, ${subtitle}` : ''}`}
      >
        {content}
      </Pressable>
    );
  }

  // Display type - no interaction
  return content;
}

/**
 * LEARNING NOTES:
 *
 * 1. DISCRIMINATED UNIONS
 *    The `type` prop acts as a discriminator that determines:
 *    - What props are relevant (value/onToggle for toggle)
 *    - What to render on the right side
 *    - How the item behaves (pressable or not)
 *
 *    This is more type-safe than separate components because:
 *    - One component handles all cases
 *    - TypeScript can narrow types based on `type`
 *    - Consistent API for consumers
 *
 * 2. ACCESSIBILITY
 *    We include several accessibility features:
 *    - accessibilityRole: Tells screen readers what this is
 *    - accessibilityState: For toggles, announces checked state
 *    - accessibilityLabel: Combines label + subtitle for context
 *    - Minimum 44pt touch target (p-4 = 16px padding + content)
 *
 * 3. SWITCH COMPONENT
 *    React Native's Switch has platform-specific styling:
 *    - trackColor: Background of the switch track
 *    - thumbColor: The circular thumb that moves
 *    - ios_backgroundColor: iOS-specific track color when off
 *
 *    We customize these to match our design system's primary color.
 *
 * 4. TEMPLATE STRINGS FOR CLASSNAME
 *    We use template strings for conditional classes:
 *    ```tsx
 *    className={`
 *      flex-row items-center p-4
 *      ${showBorder ? 'border-b border-border' : ''}
 *    `}
 *    ```
 *    This is simpler than cn() for straightforward conditions.
 *
 * 5. TAPPABLE TOGGLE ROWS
 *    For toggle items, the entire row is tappable:
 *    - Better UX (larger touch target)
 *    - Follows iOS/Android patterns
 *    - The switch itself still works independently
 *
 * 6. ICON COLOR CONVENTION
 *    Icons should be passed with their color already set:
 *    ```tsx
 *    icon={<Bell size={20} color={colors.primary} />}
 *    ```
 *    This gives consumers control over icon colors while
 *    keeping SettingsItem generic.
 *
 * 7. BORDER HANDLING
 *    showBorder={true} by default adds bottom border.
 *    The LAST item in a section should pass showBorder={false}
 *    to avoid a border above the card's bottom edge.
 *
 *    Alternative: Use CSS :last-child in web, but React Native
 *    doesn't support this, so we use a prop.
 */
