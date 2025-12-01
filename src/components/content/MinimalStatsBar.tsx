/**
 * MinimalStatsBar Component
 *
 * A subtle, non-intrusive stats bar that shows:
 * - Weekly reading streak ("3 this week")
 * - Saved articles count
 *
 * PURPOSE:
 * Replaces the cluttered Quick Stats cards with a minimal top bar.
 * Provides gentle encouragement without pressure or distraction.
 *
 * DESIGN PHILOSOPHY:
 * - Minimal: Takes up minimal space at top of screen
 * - Encouraging: "X this week" celebrates progress without pressure
 * - Non-blocking: Doesn't compete with content for attention
 * - Information-dense: Two metrics in one compact row
 *
 * WHY "THIS WEEK" INSTEAD OF "DAILY GOAL"?
 * - "Daily goal" creates pressure and guilt when missed
 * - "This week" celebrates cumulative achievement
 * - Users feel good about reading 3 articles, not bad about missing a day
 * - Aligns with app's purpose: fill dead time, not create obligations
 *
 * @module components/content/MinimalStatsBar
 */

import { View } from 'react-native';
import { Bookmark, Flame } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { colors } from '@/theme';

/**
 * Props for MinimalStatsBar
 *
 * @property weeklyCount - Number of articles read this week
 * @property savedCount - Number of saved/bookmarked articles
 * @property className - Optional additional styles
 */
interface MinimalStatsBarProps {
  weeklyCount: number;
  savedCount: number;
  className?: string;
}

/**
 * MinimalStatsBar Component
 *
 * Renders a horizontal bar with two stats:
 * 1. Left: Streak indicator with flame icon
 * 2. Right: Saved count with bookmark icon
 *
 * USAGE:
 * ```tsx
 * <MinimalStatsBar weeklyCount={3} savedCount={5} />
 * ```
 *
 * STYLING NOTES:
 * - Uses flex-row with justify-between for edge-to-edge layout
 * - Muted colors to not compete with main content
 * - Small icons (16px) and text for minimal footprint
 * - Padding matches container padding for alignment
 */
export function MinimalStatsBar({
  weeklyCount,
  savedCount,
  className = '',
}: MinimalStatsBarProps) {
  return (
    <View className={`flex-row items-center justify-between py-3 ${className}`}>
      {/* ================================================================
          LEFT: Weekly Reading Streak

          Shows "X this week" with a flame icon.
          The flame icon suggests "streak" or "on fire" without
          being as aggressive as explicit streak counters.
          ================================================================ */}
      <View className="flex-row items-center gap-1.5">
        <Flame size={16} color={colors.mutedForeground} />
        <Text variant="small" className="text-muted-foreground">
          {weeklyCount} this week
        </Text>
      </View>

      {/* ================================================================
          RIGHT: Saved Articles Count

          Shows saved count with bookmark icon.
          Tapping this could navigate to Saved tab in the future.
          For now, it's just an indicator.
          ================================================================ */}
      <View className="flex-row items-center gap-1.5">
        <Bookmark size={16} color={colors.mutedForeground} />
        <Text variant="small" className="text-muted-foreground">
          {savedCount} saved
        </Text>
      </View>
    </View>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. MINIMAL FOOTPRINT DESIGN
 *    This component is intentionally small and unobtrusive.
 *    In content-focused apps, every pixel matters. Stats should
 *    inform without blocking the primary experience (reading).
 *
 * 2. PSYCHOLOGICAL FRAMING
 *    "3 this week" vs "3/7 days" - subtle but important difference:
 *    - "3 this week" = accomplishment, celebration
 *    - "3/7 days" = incomplete, 4 days missed, guilt
 *
 * 3. ICON CHOICE
 *    Flame = streak/momentum (positive)
 *    Bookmark = saved for later (personal collection)
 *    Both are encouraging, not demanding.
 *
 * 4. COLOR CHOICE
 *    Using mutedForeground keeps stats in the background.
 *    Primary colors would draw attention away from content.
 *
 * 5. FUTURE ENHANCEMENTS
 *    - Make saved count tappable to navigate to Saved tab
 *    - Add subtle animation when streak increases
 *    - Show streak fire icon only when 3+ articles this week
 */
