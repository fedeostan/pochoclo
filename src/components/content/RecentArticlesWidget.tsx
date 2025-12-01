/**
 * RecentArticlesWidget Component
 *
 * A compact widget showing the user's 3 most recently read articles.
 * Displayed on the home screen below the main content card.
 *
 * PURPOSE:
 * - Quick access to recently read content
 * - Memory aid for users to revisit articles
 * - Shows engagement history at a glance
 *
 * DESIGN PRINCIPLES (from UX Expert):
 * - SUBORDINATE: Visually less prominent than main content card
 * - COMPACT: Title + one line preview (no thumbnails)
 * - SCANNABLE: Users should recognize articles in <1 second
 * - MINIMAL: Section header "Recent", no "View All" link
 *
 * INTERACTION:
 * - Tap article item → Opens ContentFullView with that article
 * - Real-time updates when new articles are added
 *
 * @example
 * <RecentArticlesWidget onArticlePress={(article) => openFullView(article)} />
 */

import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui';
import { useRecentArticles } from '@/hooks/useRecentArticles';
import { RecentArticle, ContentBody, GeneratedContent } from '@/types/content';
import { colors } from '@/theme';

/**
 * RecentArticlesWidget Props
 *
 * @property onArticlePress - Callback when an article item is tapped
 *                            Receives the article to display in full view
 * @property className - Additional styling classes for the container
 *
 * WHY onArticlePress RETURNS GeneratedContent?
 * The ContentFullView component expects GeneratedContent format.
 * We transform RecentArticle → GeneratedContent when calling onArticlePress.
 * This keeps the existing modal component unchanged.
 */
interface RecentArticlesWidgetProps {
  onArticlePress: (content: GeneratedContent) => void;
  className?: string;
}

/**
 * RecentArticlesWidget Component
 *
 * Displays a list of recently read articles for quick re-access.
 */
export function RecentArticlesWidget({
  onArticlePress,
  className,
}: RecentArticlesWidgetProps) {
  const { t } = useTranslation('content');

  // Fetch recent articles using our custom hook
  // This provides real-time updates when articles change
  const { articles, loading, error } = useRecentArticles();

  /**
   * Transform RecentArticle to GeneratedContent format
   *
   * The ContentFullView modal expects GeneratedContent, but we store
   * RecentArticle in Firestore. This function adapts the data structure.
   *
   * WHY THIS TRANSFORMATION?
   * - Keeps ContentFullView unchanged (single responsibility)
   * - RecentArticle stores what we need for the widget
   * - GeneratedContent is what the modal expects
   * - This adapter pattern is common when bridging data formats
   */
  const handleArticlePress = (article: RecentArticle) => {
    const generatedContent: GeneratedContent = {
      // Use the article ID as requestId (doesn't need to be original)
      requestId: article.id || `recent-${Date.now()}`,
      status: 'completed',
      content: article.contentBody,
      topicSummary: article.contentBody.title.substring(0, 100),
      generatedAt: article.createdAt,
    };

    onArticlePress(generatedContent);
  };

  // Loading state - show subtle spinner
  if (loading) {
    return (
      <View className={`mt-8 ${className || ''}`}>
        <Text variant="body" className="text-muted-foreground font-medium mb-3">
          {t('recent.title')}
        </Text>
        <View className="items-center py-6">
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      </View>
    );
  }

  // Error state - show message but don't break the page
  if (error) {
    return (
      <View className={`mt-8 ${className || ''}`}>
        <Text variant="body" className="text-muted-foreground font-medium mb-3">
          {t('recent.title')}
        </Text>
        <View className="py-4">
          <Text variant="small" className="text-muted-foreground text-center">
            {t('recent.errorLoading')}
          </Text>
        </View>
      </View>
    );
  }

  // Empty state - show helpful message
  if (articles.length === 0) {
    return (
      <View className={`mt-8 ${className || ''}`}>
        <Text variant="body" className="text-muted-foreground font-medium mb-3">
          {t('recent.title')}
        </Text>
        <View className="py-6">
          <Text variant="small" className="text-muted-foreground text-center">
            {t('recent.emptyState')}
          </Text>
        </View>
      </View>
    );
  }

  // Main render - list of recent articles
  return (
    <View className={`mt-8 ${className || ''}`}>
      {/* Section header
       *
       * WHY "Recent" AND NOT "Continue Reading"?
       * - "Recent" is accurate (these are most recent, regardless of completion)
       * - "Continue Reading" implies unfinished articles (some may be fully read)
       * - Single word aligns with MINIMAL design principle
       * - Common pattern users recognize (Recent Files, Recent Searches, etc.)
       */}
      <Text variant="body" className="text-muted-foreground font-medium mb-3">
        {t('recent.title')}
      </Text>

      {/* Articles list */}
      <View className="bg-card rounded-lg overflow-hidden">
        {articles.map((article, index) => (
          <RecentArticleItem
            key={article.id}
            article={article}
            onPress={() => handleArticlePress(article)}
            isLast={index === articles.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * =============================================================================
 * RECENT ARTICLE ITEM SUB-COMPONENT
 * =============================================================================
 */

/**
 * RecentArticleItem Props
 */
interface RecentArticleItemProps {
  article: RecentArticle;
  onPress: () => void;
  isLast: boolean;
}

/**
 * RecentArticleItem Component
 *
 * A single item in the recent articles list.
 * Shows title + one line preview in a compact format.
 *
 * DESIGN SPECS (from UX Expert):
 * - Title: text-base font-medium text-foreground
 * - Preview: text-sm text-muted-foreground, numberOfLines={1}
 * - Padding: py-3 px-4 (comfortable touch area)
 * - Divider: border-b border-muted/50 (except last item)
 * - Min height: 44px (touch target accessibility)
 */
function RecentArticleItem({
  article,
  onPress,
  isLast,
}: RecentArticleItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`
        py-3 px-4 min-h-[44px]
        active:bg-muted/30
        ${!isLast ? 'border-b border-muted/50' : ''}
      `}
      accessibilityRole="button"
      accessibilityLabel={`${article.contentBody.title}. ${article.contentBody.summary}. Tap to open.`}
      accessibilityHint="Opens the full article"
    >
      {/* Title - primary text, 2 lines max
       *
       * WHY 2 LINES FOR TITLE?
       * - Many article titles are longer than one line
       * - Two lines balance readability vs. compactness
       * - Truncation with ellipsis indicates more content
       */}
      <Text
        variant="body"
        className="font-medium text-foreground"
        numberOfLines={2}
      >
        {article.contentBody.title}
      </Text>

      {/* Preview - one line of the summary
       *
       * WHY SUMMARY AND NOT BODY?
       * - Summary is specifically written as a hook/preview
       * - Body might start with headers or formatting
       * - Summary gives better context in limited space
       */}
      <Text
        variant="small"
        className="text-muted-foreground mt-0.5"
        numberOfLines={1}
      >
        {article.contentBody.summary}
      </Text>
    </Pressable>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. COMPONENT COMPOSITION
 *    RecentArticlesWidget contains RecentArticleItem as an internal component.
 *    This keeps related code together and the item component is not exported
 *    (it's only used here). If the item were needed elsewhere, we'd export it.
 *
 * 2. STATE HANDLING PATTERNS
 *    We handle three states explicitly:
 *    - Loading: Show spinner (don't leave blank space)
 *    - Error: Show friendly message (don't crash)
 *    - Empty: Show educational text (teach the feature exists)
 *    Early returns make the happy path (articles list) clean.
 *
 * 3. DATA TRANSFORMATION (ADAPTER PATTERN)
 *    handleArticlePress transforms RecentArticle → GeneratedContent.
 *    This "adapter" pattern is useful when:
 *    - Two systems need to communicate
 *    - You don't want to change existing components
 *    - The data represents the same thing, just structured differently
 *
 * 4. ACCESSIBILITY
 *    Each article item has:
 *    - accessibilityRole="button" - tells screen reader it's tappable
 *    - accessibilityLabel - describes the content
 *    - accessibilityHint - tells what will happen on tap
 *    - min-h-[44px] - meets touch target size requirement
 *
 * 5. CONDITIONAL STYLING
 *    The border-b is applied conditionally: `${!isLast ? 'border-b...' : ''}`
 *    This removes the divider from the last item (cleaner look).
 *    Alternative: Use CSS :last-child, but RN doesn't support it natively.
 *
 * 6. PRESS FEEDBACK
 *    `active:bg-muted/30` provides visual feedback on press.
 *    The /30 means 30% opacity - subtle but noticeable.
 *    This follows iOS/Android patterns for list item selection.
 *
 * 7. TEXT TRUNCATION
 *    numberOfLines={1} or {2} with ellipsizeMode (default "tail")
 *    truncates text with "..." when it exceeds available space.
 *    This keeps the layout predictable regardless of content length.
 *
 * 8. REAL-TIME UPDATES
 *    Because useRecentArticles uses onSnapshot, this widget
 *    automatically updates when:
 *    - User finishes reading an article (added to recent)
 *    - Oldest article is deleted (when 4th is added)
 *    No manual refresh needed!
 */

export default RecentArticlesWidget;
