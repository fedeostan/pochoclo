/**
 * FAQItem Component
 *
 * An expandable accordion item for displaying FAQ content in a user-friendly way.
 * Tapping the question reveals/hides the answer with a smooth animation.
 *
 * PURPOSE:
 * Help/FAQ screens need to show many questions without overwhelming users.
 * The accordion pattern (expand/collapse) solves this by:
 * - Showing all questions at a glance (scannable)
 * - Revealing answers only when needed (reduces cognitive load)
 * - Keeping the screen organized (progressive disclosure)
 *
 * ANATOMY:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ [Collapsed State]                                               │
 * │  How does POCHOCLO work?                                    ∨  │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ [Expanded State]                                                │
 * │  How does POCHOCLO work?                                    ∧  │
 * │                                                                 │
 * │  POCHOCLO delivers bite-sized learning content tailored to      │
 * │  your interests. Each day, you'll get fresh content...          │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * DESIGN DECISIONS:
 * - Single-tap to toggle (large touch target)
 * - Chevron rotates to indicate state (visual feedback)
 * - Answer text is muted (visual hierarchy)
 * - LayoutAnimation for smooth expand/collapse
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { colors } from '@/theme';

/**
 * Enable LayoutAnimation on Android
 *
 * Android requires explicit enablement of LayoutAnimation.
 * This is a one-time setup that should run before any animations.
 *
 * WHY IS THIS NEEDED?
 * iOS has LayoutAnimation enabled by default.
 * Android disabled it historically due to performance concerns,
 * but modern Android handles it well.
 */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Props for FAQItem
 */
interface FAQItemProps {
  /** The question text */
  question: string;
  /** The answer text (shown when expanded) */
  answer: string;
  /** Whether this is the last item (no bottom border) */
  isLast?: boolean;
}

/**
 * FAQItem Component
 *
 * An individual FAQ question/answer pair that can be expanded/collapsed.
 *
 * @example
 * <FAQItem
 *   question="How does POCHOCLO work?"
 *   answer="POCHOCLO delivers bite-sized learning content..."
 * />
 *
 * @example
 * // Last item in a section (no border)
 * <FAQItem
 *   question="How do I delete my account?"
 *   answer="Contact us at support@pochoclo.app..."
 *   isLast
 * />
 */
export function FAQItem({ question, answer, isLast = false }: FAQItemProps) {
  /**
   * Track whether the answer is visible
   *
   * This is local UI state - no need for Redux because:
   * - It's purely visual (doesn't persist)
   * - It only affects this component
   * - It doesn't need to be shared
   */
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Toggle the expanded state with animation
   *
   * We use LayoutAnimation to create a smooth expand/collapse effect.
   * The animation configuration creates a spring-like motion that feels natural.
   *
   * WHY LAYOUTANIMATION?
   * - Built into React Native (no dependencies)
   * - Simple API (just call before setState)
   * - Works well for height changes
   *
   * ALTERNATIVES:
   * - react-native-reanimated: More powerful but complex
   * - Animated API: More control but more boilerplate
   *
   * For a learning project, LayoutAnimation teaches the concept
   * without overwhelming complexity.
   */
  const toggleExpand = useCallback(() => {
    // Configure animation before state change
    LayoutAnimation.configureNext({
      duration: 200, // 200ms - fast but noticeable
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    // Toggle the state (animation automatically applies)
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <View
      className={`
        ${!isLast ? 'border-b border-border' : ''}
      `}
    >
      {/**
       * Question Row (Always Visible)
       *
       * This is the tappable header that shows the question and chevron.
       * The entire row is pressable for a large touch target.
       */}
      <Pressable
        onPress={toggleExpand}
        className="flex-row items-center justify-between p-4 active:bg-muted/50"
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={question}
        accessibilityHint={isExpanded ? 'Tap to collapse answer' : 'Tap to expand answer'}
      >
        {/**
         * Question Text
         *
         * flex-1 ensures the text takes available space,
         * mr-3 gives breathing room before the chevron.
         */}
        <Text className="flex-1 font-medium mr-3">{question}</Text>

        {/**
         * Chevron Indicator
         *
         * The chevron rotates 180 degrees when expanded.
         * This provides clear visual feedback about the state.
         *
         * Note: We use inline style for rotation because:
         * - NativeWind doesn't have rotate-180 utility
         * - transform prop is the standard React Native approach
         */}
        <View
          style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
          }}
        >
          <ChevronDown size={20} color={colors.mutedForeground} />
        </View>
      </Pressable>

      {/**
       * Answer Section (Conditional)
       *
       * Only rendered when expanded. LayoutAnimation handles
       * the height transition automatically.
       *
       * STYLING:
       * - px-4: Match horizontal padding of question
       * - pb-4: Bottom padding (top padding comes from question row)
       * - pt-0: No top padding (question row has bottom padding)
       * - text-muted-foreground: Lower visual weight than question
       */}
      {isExpanded && (
        <View className="px-4 pb-4">
          <Text variant="body" className="text-muted-foreground leading-6">
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. ACCORDION PATTERN
 *    Accordions are a common UI pattern for showing/hiding content.
 *    They're especially useful for:
 *    - FAQs (many questions, user picks which to read)
 *    - Settings (group related options)
 *    - Navigation (nested menus)
 *
 *    The key UX principle: progressive disclosure.
 *    Show users what they need, when they need it.
 *
 * 2. LAYOUTANIMATION
 *    React Native's built-in animation system. How it works:
 *
 *    a) Call LayoutAnimation.configureNext() BEFORE state change
 *    b) Change state (causes re-render)
 *    c) React Native animates the layout changes automatically
 *
 *    It's like saying "animate whatever changes next".
 *
 * 3. ANIMATION DURATION
 *    200ms is the "sweet spot" for UI animations:
 *    - Under 100ms: Too fast, feels jarring
 *    - Over 300ms: Too slow, feels sluggish
 *    - 200-250ms: Noticeable but snappy
 *
 *    This follows Apple's Human Interface Guidelines.
 *
 * 4. STATE MANAGEMENT DECISION
 *    We use local state (useState) not Redux because:
 *    - UI-only state (doesn't persist between sessions)
 *    - Component-scoped (other components don't need it)
 *    - No derived data needed
 *
 *    Rule of thumb: Keep state as local as possible.
 *    Only lift to Redux when needed for persistence or sharing.
 *
 * 5. ACCESSIBILITY
 *    We include several accessibility features:
 *    - accessibilityRole="button": Announces as interactive
 *    - accessibilityState={{ expanded }}: Announces open/closed
 *    - accessibilityHint: Tells user what tapping will do
 *
 *    Screen readers will announce:
 *    "How does POCHOCLO work? Button. Collapsed. Tap to expand answer."
 *
 * 6. TOUCH TARGET SIZE
 *    The Pressable covers the entire question row.
 *    With p-4 (16px) padding, the touch target is well above
 *    the 44pt minimum required for accessibility.
 *
 * 7. VISUAL HIERARCHY
 *    - Question: font-medium (bolder, primary importance)
 *    - Answer: text-muted-foreground (lighter, secondary)
 *    - Chevron: mutedForeground (subtle, not competing with text)
 *
 *    This creates a clear reading order and importance.
 *
 * 8. CONDITIONAL RENDERING
 *    We use {isExpanded && (...)} instead of ternary.
 *    This completely removes the answer from the DOM when collapsed,
 *    which is more performant for long lists.
 *
 * 9. LEADING (LINE HEIGHT)
 *    leading-6 sets line-height to 24px (1.5rem).
 *    Generous line height improves readability of body text,
 *    especially for longer answers.
 */
