/**
 * ContentFullView Component
 *
 * A full-screen reading view for AI-generated content.
 * This modal/screen provides an immersive reading experience.
 *
 * PURPOSE:
 * - Display the complete content body in a readable format
 * - Provide comfortable reading with proper typography
 * - Show sources for further exploration
 * - Allow saving and closing actions
 *
 * DESIGN PRINCIPLES (from UI_RULES.md):
 * - Minimal: Focus on content, minimal UI chrome
 * - Light: Clean background for comfortable reading
 * - Soft: Generous margins and line height
 * - Modern: Clean typography optimized for readability
 *
 * INTERACTION PATTERNS:
 * - Scroll to read full content
 * - Sticky header with back button and save action
 * - Sources list at the bottom (collapsible)
 * - "Done reading" button at the end
 *
 * @example
 * <ContentFullView
 *   content={generatedContent}
 *   onClose={() => closeFullView()}
 *   onSave={() => saveContent()}
 *   isSaved={false}
 * />
 */

import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Clock,
  Tag,
  CheckCircle,
} from 'lucide-react-native';
import { Text, Button } from '@/components/ui';
import { SourcesList } from './SourcesList';
import { GeneratedContent } from '@/types/content';
import { colors } from '@/theme';

/**
 * ContentFullView Props
 *
 * @property content - The generated content to display
 * @property onClose - Callback to close the full view
 * @property onSave - Callback when save/bookmark button is pressed
 * @property onDone - Callback when "Done reading" is pressed
 * @property isSaved - Whether the content is already saved/bookmarked
 * @property visible - Whether the view is visible (for modal pattern)
 */
interface ContentFullViewProps {
  content: GeneratedContent;
  onClose: () => void;
  onSave?: () => void;
  onDone?: () => void;
  isSaved?: boolean;
  visible?: boolean;
}

/**
 * ContentFullView Component
 *
 * Full-screen reading experience for generated content.
 */
export function ContentFullView({
  content,
  onClose,
  onSave,
  onDone,
  isSaved = false,
}: ContentFullViewProps) {
  // Guard: Don't render if no content body
  if (!content.content) {
    return null;
  }

  const {
    title,
    summary,
    body,
    category,
    readingTimeMinutes,
    sources,
  } = content.content;

  /**
   * Handle done reading
   * Calls onDone if provided, otherwise just closes
   */
  const handleDone = () => {
    if (onDone) {
      onDone();
    }
    onClose();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* ================================================================
          STICKY HEADER
          Contains back button, category, and save action
          ================================================================ */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/30">
        {/* Back button */}
        <Pressable
          onPress={onClose}
          className="flex-row items-center gap-1 py-2 px-1"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>

        {/* Category badge (centered) */}
        <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
          <Tag size={12} color={colors.primary} />
          <Text variant="small" className="text-primary font-medium capitalize">
            {category}
          </Text>
        </View>

        {/* Save button */}
        <Pressable
          onPress={onSave}
          className="p-2"
          accessibilityLabel={isSaved ? 'Remove from saved' : 'Save for later'}
          accessibilityRole="button"
        >
          {isSaved ? (
            <BookmarkCheck size={24} color={colors.primary} />
          ) : (
            <Bookmark size={24} color={colors.textPrimary} />
          )}
        </Pressable>
      </View>

      {/* ================================================================
          SCROLLABLE CONTENT
          Main reading area with title, metadata, body, and sources
          ================================================================ */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={true}
      >
        <View className="px-6 py-6">
          {/* Title */}
          <Text variant="h1" className="mb-4 leading-tight">
            {title}
          </Text>

          {/* Metadata row */}
          <View className="flex-row items-center gap-4 mb-6 pb-6 border-b border-border/30">
            {/* Reading time */}
            <View className="flex-row items-center gap-1.5">
              <Clock size={16} color={colors.textSecondary} />
              <Text variant="small" className="text-muted-foreground">
                {readingTimeMinutes} min read
              </Text>
            </View>
          </View>

          {/* Summary/Hook - styled differently from body */}
          <View className="mb-6 p-4 rounded-lg bg-primary/5 border-l-4 border-primary">
            <Text variant="lead" className="text-foreground leading-relaxed italic">
              {summary}
            </Text>
          </View>

          {/* Main body content */}
          <View className="mb-8">
            {/*
             * BODY TEXT RENDERING
             *
             * For now, we render the body as plain text.
             * In the future, you could use react-native-markdown-display
             * to render markdown formatting (headers, bold, lists, etc.)
             *
             * LEARNING NOTE:
             * The body may contain markdown. To support it:
             * 1. npx expo install react-native-markdown-display
             * 2. import Markdown from 'react-native-markdown-display'
             * 3. Replace <Text> with <Markdown style={markdownStyles}>
             */}
            <Text
              variant="body"
              className="text-foreground leading-relaxed"
              style={{ lineHeight: 28 }}
            >
              {body}
            </Text>
          </View>

          {/* Sources section (if available) */}
          {sources && sources.length > 0 && (
            <SourcesList sources={sources} />
          )}

          {/* ================================================================
              DONE READING SECTION
              ================================================================ */}
          <View className="mt-8 pt-6 border-t border-border/30 items-center">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-4">
              <CheckCircle size={24} color={colors.primary} />
            </View>
            <Text variant="h4" className="mb-2 text-center">
              Finished reading?
            </Text>
            <Text variant="muted" className="mb-6 text-center px-4">
              Mark as done to get new content next time
            </Text>
            <Button onPress={handleDone} className="w-full">
              <Text className="text-white font-medium">Done Reading</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. SAFE AREA VIEW
 *    We use SafeAreaView with edges={['top']} to respect the device notch/
 *    status bar area. This ensures content doesn't overlap system UI.
 *
 * 2. STICKY HEADER PATTERN
 *    The header is outside the ScrollView, making it "sticky" (always visible).
 *    This gives users quick access to navigation and save actions.
 *
 * 3. TYPOGRAPHY FOR READABILITY
 *    - Title: h1 variant for maximum impact
 *    - Summary: "lead" variant with italic styling (quote-like)
 *    - Body: "body" variant with lineHeight: 28 for comfortable reading
 *
 * 4. VISUAL HIERARCHY
 *    - Summary has a colored left border and background to stand out
 *    - Border separators between sections create visual breaks
 *    - "Done Reading" section is separated and centered for emphasis
 *
 * 5. MARKDOWN SUPPORT (Future Enhancement)
 *    The body field may contain markdown formatting. To support it:
 *
 *    npm install react-native-markdown-display
 *
 *    Then replace the body <Text> with:
 *    import Markdown from 'react-native-markdown-display';
 *    <Markdown style={markdownStyles}>{body}</Markdown>
 *
 * 6. SCROLL BEHAVIOR
 *    - contentContainerStyle={{ paddingBottom: 40 }} prevents content from
 *      being cut off at the bottom
 *    - showsVerticalScrollIndicator={true} shows scroll position
 *
 * 7. ACCESSIBILITY
 *    All interactive elements have accessibilityLabel and accessibilityRole
 *    to support screen readers and assistive technologies.
 */

export default ContentFullView;
