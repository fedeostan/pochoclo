/**
 * ContentCard Component
 *
 * A beautifully designed card that displays AI-generated content preview.
 * This is the main way users interact with content on the home screen.
 *
 * PURPOSE:
 * - Display content title, summary, and metadata in an engaging format
 * - Allow users to tap to read full content
 * - Provide quick actions: save/bookmark, dismiss
 * - Show category and reading time for context
 *
 * DESIGN PRINCIPLES (from UI_RULES.md):
 * - Minimal: Clean layout, no unnecessary elements
 * - Light: Off-white background, white card
 * - Soft: Rounded corners (12px), muted colors
 * - Modern: Clean typography, comfortable spacing
 *
 * INTERACTION PATTERNS:
 * - Tap card → Opens ContentFullView
 * - Tap bookmark icon → Saves content
 * - Tap dismiss icon → Marks as read, removes from view
 *
 * @example
 * <ContentCard
 *   content={generatedContent}
 *   onPress={() => openFullView()}
 *   onSave={() => saveContent()}
 *   onDismiss={() => dismissContent()}
 * />
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Bookmark, BookmarkCheck, Clock, Tag, ChevronRight, X } from 'lucide-react-native';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Text,
  Button,
} from '@/components/ui';
import { GeneratedContent } from '@/types/content';
import { colors } from '@/theme';

/**
 * ContentCard Props
 *
 * @property content - The generated content to display
 * @property onPress - Callback when card is tapped (open full view)
 * @property onSave - Callback when save/bookmark button is pressed
 * @property onDismiss - Callback when dismiss button is pressed
 * @property isSaved - Whether the content is already saved/bookmarked
 * @property className - Additional styling classes
 */
interface ContentCardProps {
  content: GeneratedContent;
  onPress?: () => void;
  onSave?: () => void;
  onDismiss?: () => void;
  isSaved?: boolean;
  className?: string;
}

/**
 * ContentCard Component
 *
 * The main card component for displaying content previews.
 */
export function ContentCard({
  content,
  onPress,
  onSave,
  onDismiss,
  isSaved = false,
  className,
}: ContentCardProps) {
  // Guard: Don't render if no content body
  if (!content.content) {
    return null;
  }

  const { title, summary, category, readingTimeMinutes } = content.content;

  return (
    <Card className={className}>
      {/* Main pressable area - opens full view */}
      <Pressable
        onPress={onPress}
        className="active:opacity-90"
        accessibilityLabel={`Read article: ${title}`}
        accessibilityRole="button"
      >
        {/* Header with category badge and reading time */}
        <CardHeader>
          {/* Metadata row */}
          <View className="flex-row items-center justify-between mb-3">
            {/* Category badge */}
            <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
              <Tag size={12} color={colors.primary} />
              <Text variant="small" className="text-primary font-medium capitalize">
                {category}
              </Text>
            </View>

            {/* Reading time */}
            <View className="flex-row items-center gap-1">
              <Clock size={14} color={colors.textSecondary} />
              <Text variant="small" className="text-muted-foreground">
                {readingTimeMinutes} min read
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text variant="h3" className="leading-tight">
            {title}
          </Text>
        </CardHeader>

        {/* Content preview */}
        <CardContent className="pt-2">
          {/* Summary text */}
          <Text variant="body" className="text-muted-foreground leading-relaxed">
            {summary}
          </Text>

          {/* "Read more" indicator */}
          <View className="flex-row items-center mt-4">
            <Text variant="small" className="text-primary font-medium">
              Read full article
            </Text>
            <ChevronRight size={16} color={colors.primary} />
          </View>
        </CardContent>
      </Pressable>

      {/* Action buttons footer */}
      <CardFooter className="justify-between border-t border-border/50 mt-2">
        {/* Save/Bookmark button */}
        <Pressable
          onPress={onSave}
          className="flex-row items-center gap-2 py-2 px-3 rounded-lg active:bg-primary/10"
          accessibilityLabel={isSaved ? 'Remove from saved' : 'Save for later'}
          accessibilityRole="button"
        >
          {isSaved ? (
            <>
              <BookmarkCheck size={20} color={colors.primary} />
              <Text variant="small" className="text-primary font-medium">
                Saved
              </Text>
            </>
          ) : (
            <>
              <Bookmark size={20} color={colors.textSecondary} />
              <Text variant="small" className="text-muted-foreground">
                Save
              </Text>
            </>
          )}
        </Pressable>

        {/* Dismiss button */}
        <Pressable
          onPress={onDismiss}
          className="flex-row items-center gap-2 py-2 px-3 rounded-lg active:bg-muted/20"
          accessibilityLabel="Mark as read and dismiss"
          accessibilityRole="button"
        >
          <X size={20} color={colors.textSecondary} />
          <Text variant="small" className="text-muted-foreground">
            Done
          </Text>
        </Pressable>
      </CardFooter>
    </Card>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. COMPOSITION PATTERN
 *    We use the existing Card, CardHeader, CardContent, CardFooter components
 *    rather than building from scratch. This ensures consistency with the
 *    design system and reduces code duplication.
 *
 * 2. PRESSABLE WRAPPER
 *    The main content area is wrapped in Pressable to handle taps.
 *    We use `active:opacity-90` for visual feedback on press.
 *    The footer buttons are separate Pressable components.
 *
 * 3. ACCESSIBILITY
 *    - accessibilityLabel: Describes what the element does
 *    - accessibilityRole: Tells screen readers how to treat the element
 *    Always include accessibility props for interactive elements!
 *
 * 4. CONDITIONAL RENDERING
 *    We check `content.content` exists before rendering. This guards against
 *    incomplete content (e.g., status "pending" or "error").
 *
 * 5. DESIGN SYSTEM COLORS
 *    - colors.primary: Sage green for emphasis
 *    - colors.muted: Gray for secondary elements
 *    - text-muted-foreground: Tailwind class for muted text
 *    - bg-primary/10: 10% opacity primary for subtle backgrounds
 *
 * 6. ICON SIZES
 *    Consistent icon sizing:
 *    - 12px: Very small (in badges)
 *    - 14px: Small (metadata)
 *    - 16px: Medium (inline with text)
 *    - 20px: Standard action buttons
 *
 * 7. SPACING
 *    Using Tailwind spacing scale:
 *    - gap-1: 4px
 *    - gap-1.5: 6px
 *    - gap-2: 8px
 *    - mb-3: 12px margin bottom
 *    - mt-4: 16px margin top
 */

export default ContentCard;
