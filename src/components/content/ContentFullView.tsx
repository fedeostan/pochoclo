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
 * - Footer shows two buttons: "Done Reading" and "Keep learning"
 *
 * POST-READING FOOTER (home context):
 * At the bottom of the article, user sees two clear options:
 * - "Done Reading" (primary) - closes modal, +1 to streak
 * - "Keep learning" (secondary) - closes modal, +1 to streak, triggers new content
 *
 * @example
 * <ContentFullView
 *   content={generatedContent}
 *   onClose={() => closeFullView()}
 *   onSave={() => saveContent()}
 *   onRequestMore={() => generateNewContent()}
 *   isSaved={false}
 * />
 */

import React from 'react';
import { View, ScrollView, Pressable, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
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
import { MarkdownBody } from './MarkdownBody';
import { GeneratedContent } from '@/types/content';
import { colors } from '@/theme';

/**
 * ContentFullView Props
 *
 * @property content - The generated content to display
 * @property onClose - Callback to close the full view
 * @property onSave - Callback when save/bookmark button is pressed
 * @property onDone - Callback when "Done Reading" is pressed (closes, +1 streak)
 * @property onRequestMore - Callback when "Keep learning" is pressed (+1 streak, new content)
 * @property isSaved - Whether the content is already saved/bookmarked
 * @property visible - Whether the view is visible (for modal pattern)
 * @property context - Where the view is displayed ('home' or 'saved')
 *
 * CONTEXT BEHAVIOR:
 * - 'home' (default): Shows two buttons - "Done Reading" and "Keep learning"
 * - 'saved': Shows just "Close" button (article stays saved)
 *
 * BUTTON BEHAVIORS (home context):
 * Both buttons add +1 to the weekly streak (user completed reading)
 * - "Done Reading" (primary) - closes modal, returns to home
 * - "Keep learning" (secondary) - closes modal, triggers new content generation
 */
interface ContentFullViewProps {
  content: GeneratedContent;
  onClose: () => void;
  onSave?: () => void;
  onDone?: () => void;
  onRequestMore?: () => void;
  isSaved?: boolean;
  visible?: boolean;
  context?: 'home' | 'saved';
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
  onRequestMore,
  isSaved = false,
  context = 'home',
}: ContentFullViewProps) {
  /**
   * Translation hooks for i18n support
   */
  const { t } = useTranslation('content');
  const { t: tCommon } = useTranslation('common');

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
   * Handle "Done Reading" button press
   *
   * Closes the modal and marks as read (triggers onDone callback).
   * Parent component handles: +1 streak, clear content, close modal
   */
  const handleDoneReading = () => {
    if (onDone) {
      onDone();
    }
    onClose();
  };

  /**
   * Handle "Keep learning" button press
   *
   * Triggers new content generation.
   * Parent component handles: +1 streak, clear content, trigger generation
   */
  const handleKeepLearning = () => {
    if (onRequestMore) {
      onRequestMore();
    }
  };

  return (
    /**
     * ANDROID ROUNDED CORNERS FIX
     *
     * React Native's Modal with presentationStyle="pageSheet" shows a gap at the top
     * on Android but does NOT automatically add rounded corners like iOS does.
     *
     * We wrap everything in a View with:
     * - borderTopLeftRadius/borderTopRightRadius: 24 (matches BottomSheet components)
     * - overflow: 'hidden' - CRITICAL for Android to properly clip the corners
     *
     * On iOS, the native pageSheet already has rounded corners, but adding them
     * here doesn't hurt and ensures consistency across platforms.
     */
    <View style={styles.modalContainer}>
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* ================================================================
          STICKY HEADER
          Contains back button, category, and save action
          Note: We use py-4 for comfortable touch targets and visual spacing
          ================================================================ */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border/30">
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

        {/*
         * Save/Remove Button
         *
         * Shows filled bookmark when isSaved=true, empty when isSaved=false.
         * Tapping toggles the saved state.
         */}
        <Pressable
          onPress={onSave}
          className="p-2"
          accessibilityLabel={
            isSaved
              ? 'Remove from saved'
              : 'Save for later'
          }
          accessibilityRole="button"
        >
          {/*
            BOOKMARK ICON LOGIC

            Shows filled bookmark (BookmarkCheck) if article is actually saved.
            Shows empty bookmark (Bookmark) if article is not saved.

            NOTE: We ONLY check isSaved prop here, NOT context.
            context='saved' controls the footer behavior (Close vs Done/Keep learning),
            but the bookmark should reflect the actual saved state.

            A recent article may have context='saved' but not actually be saved.
          */}
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
                {tCommon('time.minRead', { count: readingTimeMinutes })}
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
             * BODY TEXT RENDERING WITH MARKDOWN SUPPORT
             *
             * We use MarkdownBody to parse and render markdown formatting:
             * - ## headers become styled subheaders
             * - **bold** and *italic* text is properly rendered
             * - Lists (- bullet) are formatted correctly
             * - Links, code blocks, and blockquotes are supported
             *
             * The MarkdownBody component applies styles that match our
             * design system (colors, typography, spacing from UI_RULES.md).
             *
             * LEARNING NOTE:
             * The AI generates content with markdown formatting. Without
             * a markdown renderer, users would see raw "##" symbols.
             * Now they see properly styled section headers instead.
             */}
            <MarkdownBody content={body} />
          </View>

          {/* Sources section (if available) */}
          {sources && sources.length > 0 && (
            <SourcesList sources={sources} />
          )}

          {/* ================================================================
              DONE READING SECTION

              CONTEXT BEHAVIOR:
              - 'home': Shows two buttons - "Done Reading" (primary) + "Keep learning" (secondary)
              - 'saved': Shows just "Close" button (article stays saved)

              BUTTON BEHAVIORS (home context):
              Both buttons mark the article as read (+1 to weekly streak)
              - "Done Reading" - closes modal, returns to empty home
              - "Keep learning" - closes modal, triggers new content generation
              ================================================================ */}
          <View className="mt-8 pt-6 border-t border-border/30 items-center">
            {/* ---- SAVED CONTEXT: Simple close button ---- */}
            {context === 'saved' && (
              <>
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-4">
                  <CheckCircle size={24} color={colors.primary} />
                </View>
                <Text variant="h4" className="mb-2 text-center">
                  {t('fullView.finishedReading')}
                </Text>
                <Text variant="muted" className="mb-6 text-center px-4">
                  {t('fullView.savedMessage')}
                </Text>
                <Button onPress={onClose} className="w-full">
                  <Text className="text-white font-medium">
                    {t('fullView.close')}
                  </Text>
                </Button>
              </>
            )}

            {/* ---- HOME CONTEXT: Two buttons always visible ---- */}
            {context === 'home' && (
              <>
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-4">
                  <CheckCircle size={24} color={colors.primary} />
                </View>
                <Text variant="h4" className="mb-2 text-center">
                  {t('fullView.finishedReading')}
                </Text>
                <Text variant="muted" className="mb-6 text-center px-4">
                  {t('fullView.doneMessage')}
                </Text>

                {/* Two-button layout: primary on top, secondary below */}
                <View className="w-full gap-3">
                  {/* Primary: Done Reading */}
                  <Button onPress={handleDoneReading} className="w-full">
                    <Text className="text-white font-medium">
                      {t('fullView.doneReading')}
                    </Text>
                  </Button>

                  {/* Secondary: Keep learning */}
                  <Button
                    variant="outline"
                    onPress={handleKeepLearning}
                    className="w-full"
                  >
                    <Text className="text-primary font-medium">
                      {t('fullView.keepLearning')}
                    </Text>
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/**
 * =============================================================================
 * STYLES
 * =============================================================================
 *
 * StyleSheet for platform-specific styling that can't be done with NativeWind.
 * We use StyleSheet.create for better performance (styles are validated once).
 */
const styles = StyleSheet.create({
  /**
   * Modal Container
   *
   * Provides rounded top corners for the pageSheet modal presentation.
   * This is especially important on Android where the native modal doesn't
   * automatically add rounded corners like iOS does.
   *
   * Key properties:
   * - flex: 1 - fills the modal space
   * - backgroundColor: matches our design system background (#FAFAF9)
   * - borderTopLeftRadius/Right: 24px matches our BottomSheet components
   * - overflow: 'hidden' - CRITICAL for Android to clip corners properly
   */
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAF9', // colors.background - warm off-white
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden', // Required for Android to respect border radius
  },
});

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. SAFE AREA VIEW
 *    We use SafeAreaView with edges={['top', 'bottom']} to respect:
 *    - Top: device notch/status bar area (iPhone X+ style notches)
 *    - Bottom: home indicator area (devices without physical home button)
 *    This ensures content doesn't overlap system UI on any device.
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
 * 5. MARKDOWN SUPPORT (Implemented!)
 *    The body field contains markdown formatting from the AI.
 *    We use the MarkdownBody component to render it properly:
 *    - ## headers → styled section headers (20px, bold)
 *    - **bold** → bold text
 *    - *italic* → italic text
 *    - Lists → properly formatted bullet/number lists
 *    - Links, blockquotes, code → all supported
 *
 *    See MarkdownBody.tsx for the complete style configuration.
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
