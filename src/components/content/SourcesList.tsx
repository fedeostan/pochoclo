/**
 * SourcesList Component
 *
 * Displays a collapsible list of sources/references used by the AI
 * when generating content.
 *
 * PURPOSE:
 * - Show credibility by listing sources
 * - Allow users to explore topics further via source links
 * - Provide transparency about where information comes from
 *
 * DESIGN PRINCIPLES (from UI_RULES.md):
 * - Minimal: Collapsed by default, expandable on demand
 * - Light: Subtle styling that doesn't compete with main content
 * - Soft: Rounded corners, muted colors
 * - Modern: Clean list with hover states
 *
 * INTERACTION PATTERNS:
 * - Tap header to expand/collapse list
 * - Tap individual source to open in browser
 *
 * @example
 * <SourcesList
 *   sources={[
 *     { title: "Source Article", url: "https://example.com/article" },
 *     { title: "Research Paper", url: "https://example.com/paper" }
 *   ]}
 * />
 */

import React, { useState } from 'react';
import { View, Pressable, Linking } from 'react-native';
import { ChevronDown, ChevronUp, ExternalLink, BookOpen } from 'lucide-react-native';
import { Text, Card, CardContent } from '@/components/ui';
import { ContentSource } from '@/types/content';
import { colors } from '@/theme';

/**
 * SourcesList Props
 *
 * @property sources - Array of source objects with title and url
 * @property initiallyExpanded - Whether to show sources expanded by default
 * @property className - Additional styling classes
 */
interface SourcesListProps {
  sources: ContentSource[];
  initiallyExpanded?: boolean;
  className?: string;
}

/**
 * SourcesList Component
 *
 * Collapsible list of content sources.
 */
export function SourcesList({
  sources,
  initiallyExpanded = false,
  className,
}: SourcesListProps) {
  /**
   * Local state for expand/collapse
   *
   * useState returns an array with two elements:
   * 1. The current state value
   * 2. A function to update the state
   *
   * Destructuring: [isExpanded, setIsExpanded]
   */
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  /**
   * Handle opening a source URL
   *
   * Uses React Native's Linking API to open URLs in the device browser.
   *
   * SECURITY NOTE:
   * - Linking.openURL is safe for https:// URLs
   * - Never open javascript: or data: URLs from untrusted sources
   */
  const handleOpenSource = async (url: string) => {
    try {
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.warn('[SourcesList] Cannot open URL:', url);
      }
    } catch (error) {
      console.error('[SourcesList] Error opening URL:', error);
    }
  };

  /**
   * Toggle expand/collapse
   */
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Don't render if no sources
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <Card variant="outline" className={className}>
      {/* Header - always visible, toggles expand/collapse */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between p-4"
        accessibilityLabel={isExpanded ? 'Collapse sources' : 'Expand sources'}
        accessibilityRole="button"
      >
        <View className="flex-row items-center gap-2">
          <BookOpen size={18} color={colors.primary} />
          <Text variant="body" className="font-medium">
            Sources ({sources.length})
          </Text>
        </View>

        {/* Expand/collapse indicator */}
        {isExpanded ? (
          <ChevronUp size={20} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={colors.textSecondary} />
        )}
      </Pressable>

      {/* Collapsible content */}
      {isExpanded && (
        <View className="border-t border-border/30">
          {sources.map((source, index) => (
            <Pressable
              key={`${source.url}-${index}`}
              onPress={() => handleOpenSource(source.url)}
              className="flex-row items-center justify-between px-4 py-3 active:bg-muted/10"
              accessibilityLabel={`Open source: ${source.title}`}
              accessibilityRole="link"
            >
              <View className="flex-1 mr-3">
                <Text variant="small" className="text-foreground" numberOfLines={2}>
                  {source.title}
                </Text>
                <Text variant="small" className="text-muted-foreground mt-0.5" numberOfLines={1}>
                  {getDomainFromUrl(source.url)}
                </Text>
              </View>
              <ExternalLink size={16} color={colors.textSecondary} />
            </Pressable>
          ))}

          {/* Help text */}
          <View className="px-4 pb-3">
            <Text variant="small" className="text-muted-foreground italic">
              Tap a source to open in your browser
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}

/**
 * Helper function to extract domain from URL
 *
 * @param url - Full URL string
 * @returns Domain name (e.g., "example.com")
 *
 * EXAMPLE:
 * getDomainFromUrl("https://www.example.com/path/to/page")
 * Returns: "example.com"
 */
function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove 'www.' prefix if present
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, return the original (truncated)
    return url.substring(0, 30);
  }
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. LOCAL STATE WITH useState
 *    We use useState for the expand/collapse state because:
 *    - It's local to this component (no need for Redux)
 *    - It only affects this component's rendering
 *    - Simple boolean toggle doesn't need complex state management
 *
 * 2. CONDITIONAL RENDERING
 *    {isExpanded && (...)} only renders the content when isExpanded is true.
 *    This is a common React pattern for showing/hiding UI elements.
 *
 * 3. LINKING API
 *    React Native's Linking module handles opening external URLs:
 *    - Linking.canOpenURL(url) - Check if URL can be opened
 *    - Linking.openURL(url) - Open URL in device browser
 *
 * 4. KEY PROP IN LISTS
 *    When using .map() to render lists, each item needs a unique `key` prop.
 *    We use `${source.url}-${index}` to ensure uniqueness even if URLs repeat.
 *
 * 5. numberOfLines PROP
 *    <Text numberOfLines={2}> truncates text to 2 lines with ellipsis.
 *    This prevents long titles from breaking the layout.
 *
 * 6. URL PARSING
 *    The URL constructor parses URLs safely:
 *    - new URL("https://example.com/path") creates a URL object
 *    - urlObj.hostname returns just the domain
 *    - We wrap in try/catch in case the URL is malformed
 *
 * 7. ACCESSIBILITY
 *    - accessibilityRole="link" tells screen readers this opens external content
 *    - accessibilityLabel describes the action
 *    - Interactive elements have appropriate press states
 */

export default SourcesList;
