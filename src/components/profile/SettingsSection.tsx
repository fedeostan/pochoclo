/**
 * SettingsSection Component
 *
 * A container component for grouping related settings items together.
 * Creates a visual section with a header label and a card containing
 * the settings items.
 *
 * PURPOSE:
 * Mobile profile screens organize settings into logical groups.
 * This pattern is seen in iOS Settings, Android preferences, and
 * most well-designed apps. It helps users:
 * - Scan quickly to find what they need
 * - Understand which settings are related
 * - Navigate predictably through options
 *
 * ANATOMY:
 * ┌──────────────────────────────────────┐
 * │  SECTION TITLE                       │  ← Section header (muted, uppercase)
 * ├──────────────────────────────────────┤
 * │ ┌──────────────────────────────────┐ │
 * │ │  Setting Item 1               ›  │ │  ← Card container
 * │ ├──────────────────────────────────┤ │
 * │ │  Setting Item 2          [Toggle]│ │
 * │ └──────────────────────────────────┘ │
 * └──────────────────────────────────────┘
 *
 * DESIGN DECISIONS:
 * - Uppercase section titles: Follows iOS Human Interface Guidelines
 * - Card container: Creates visual grouping and elevation
 * - Consistent spacing: Creates rhythm and predictability
 * - Children accept SettingsItem components for content
 */

import React from 'react';
import { View } from 'react-native';
import { Text, Card } from '@/components/ui';

/**
 * Props for SettingsSection
 *
 * @property title - Section header text (will be uppercased)
 * @property children - SettingsItem components to display in the section
 */
interface SettingsSectionProps {
  /** Section title displayed above the card (e.g., "MY LEARNING") */
  title: string;
  /** Child components - typically SettingsItem components */
  children: React.ReactNode;
}

/**
 * SettingsSection Component
 *
 * Groups related settings under a labeled section.
 *
 * @example
 * // Basic section with settings items
 * <SettingsSection title="My Learning">
 *   <SettingsItem
 *     icon={<BookOpen size={20} />}
 *     label="Learning Preferences"
 *     subtitle="Technology, Science • 15 min/day"
 *     type="navigation"
 *     onPress={() => router.push('/edit-preferences')}
 *   />
 *   <SettingsItem
 *     icon={<Bookmark size={20} />}
 *     label="Saved Content"
 *     type="navigation"
 *     onPress={() => router.push('/saved')}
 *   />
 * </SettingsSection>
 *
 * @example
 * // Section with toggle items
 * <SettingsSection title="Notifications">
 *   <SettingsItem
 *     icon={<Bell size={20} />}
 *     label="Daily Reminder"
 *     subtitle="9:00 AM"
 *     type="toggle"
 *     value={reminderEnabled}
 *     onToggle={setReminderEnabled}
 *   />
 * </SettingsSection>
 */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View className="mb-6">
      {/**
       * Section Header
       *
       * Styling follows iOS Settings conventions:
       * - Uppercase: Creates visual separation from content
       * - Small text: Doesn't compete with item labels
       * - Muted color: Subtle but readable
       * - Tracking-wide: Improves readability of uppercase text
       * - Left padding: Aligns with card content
       */}
      <Text
        variant="small"
        className="text-muted-foreground uppercase tracking-wide px-4 mb-2"
      >
        {title}
      </Text>

      {/**
       * Card Container
       *
       * Groups all settings items in a single elevated surface.
       * The Card component provides:
       * - White background for contrast with page background
       * - Rounded corners for modern look
       * - Consistent styling with other cards in the app
       *
       * overflow-hidden ensures child dividers don't extend
       * beyond the card's rounded corners.
       */}
      <Card className="overflow-hidden">
        {children}
      </Card>
    </View>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. COMPOSITION PATTERN
 *    This component uses the composition pattern:
 *    - SettingsSection provides structure and styling
 *    - children (SettingsItem) provide content
 *    - They work together but are independent
 *
 *    Benefits:
 *    - Flexible: Any content can go inside
 *    - Reusable: Section logic is separate from item logic
 *    - Testable: Each component can be tested alone
 *
 * 2. PROPS.CHILDREN
 *    React's special `children` prop allows components to wrap content:
 *    ```tsx
 *    <Parent>
 *      <Child1 />
 *      <Child2 />
 *    </Parent>
 *    ```
 *    Inside Parent, you access these via `props.children`
 *
 * 3. CSS CONVENTIONS
 *    We follow certain conventions for section headers:
 *    - `uppercase`: ALL CAPS for section titles
 *    - `tracking-wide`: Increased letter spacing (helps readability)
 *    - `text-muted-foreground`: Lower contrast (secondary information)
 *    - `text-small`: Smaller than content text
 *
 * 4. MARGIN VS PADDING
 *    We use mb-6 (margin-bottom) on the section, not p-6:
 *    - Margin creates space BETWEEN sections
 *    - Padding would create space INSIDE the section
 *    - This ensures consistent gaps between sections
 *
 * 5. OVERFLOW-HIDDEN
 *    On the Card, `overflow-hidden` is important because:
 *    - Card has rounded corners (rounded-lg)
 *    - Child items have divider borders
 *    - Without overflow-hidden, borders would extend past corners
 *    - This clips content to the card's shape
 *
 * 6. DESIGN SYSTEM ADHERENCE
 *    This component follows UI_RULES.md:
 *    - Uses Card component (not custom View styling)
 *    - Uses Text component with variants
 *    - Uses Tailwind utility classes
 *    - Follows spacing scale (mb-6, px-4, mb-2)
 */
