/**
 * MarkdownBody Component
 *
 * Renders markdown-formatted text with styling that matches our design system.
 * This component transforms raw markdown (like ## headers, **bold**, lists)
 * into properly styled React Native components.
 *
 * PURPOSE:
 * - Parse and render markdown content from AI-generated articles
 * - Provide consistent typography matching our design system
 * - Handle headers (##, ###), bold, italics, lists, and more
 *
 * WHY USE A MARKDOWN RENDERER?
 * ============================
 * Our AI (via n8n) generates content with markdown formatting for:
 * - Section headers (## Introduction, ## Key Points)
 * - Emphasis (**bold**, *italic*)
 * - Lists (- bullet points)
 * - And more...
 *
 * Without parsing, users see raw markdown: "## Introduction" instead of
 * a properly styled subheader.
 *
 * LIBRARY USED:
 * react-native-markdown-display
 * - Popular, well-maintained
 * - Supports custom styling
 * - Works well with React Native
 *
 * @example
 * <MarkdownBody content="## Section Title\n\nSome **bold** text here." />
 */

import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors } from '@/theme';

/**
 * MarkdownBody Props
 *
 * @property content - The markdown string to render
 */
interface MarkdownBodyProps {
  content: string;
}

/**
 * MarkdownBody Component
 *
 * Renders markdown content with styling that matches our design system.
 * All typography, colors, and spacing follow UI_RULES.md guidelines.
 */
export function MarkdownBody({ content }: MarkdownBodyProps) {
  return (
    <Markdown style={markdownStyles}>
      {content}
    </Markdown>
  );
}

/**
 * =============================================================================
 * MARKDOWN STYLES
 * =============================================================================
 *
 * These styles are applied to different markdown elements.
 * react-native-markdown-display uses specific style keys for each element type.
 *
 * IMPORTANT: These must match our design system in:
 * - colors.ts (color values)
 * - UI_RULES.md (typography, spacing)
 * - Text component variants (font sizes, weights)
 *
 * STYLE KEYS:
 * - body: Base text style (wraps everything)
 * - heading1: # headers (not typically used in body, reserved for title)
 * - heading2: ## headers (main section headers in article body)
 * - heading3: ### headers (sub-section headers)
 * - paragraph: Regular paragraphs
 * - strong: **bold text**
 * - em: *italic text*
 * - bullet_list: Unordered lists
 * - ordered_list: Numbered lists
 * - list_item: Individual list items
 * - link: [text](url) links
 */
const markdownStyles = StyleSheet.create({
  /**
   * BODY
   * Base text style that applies to all content.
   * Sets the default font, color, and line height.
   */
  body: {
    color: colors.foreground,           // Main text color (#1C1917)
    fontSize: 16,                        // Base body font size
    lineHeight: 28,                      // Comfortable reading line height
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  /**
   * HEADING 2 (##)
   * Main section headers within the article body.
   * These are the "## Introduction", "## Key Points" etc.
   *
   * Styled to stand out from body text but not overpower the article title.
   * Uses our foreground color with larger size and bold weight.
   */
  heading2: {
    color: colors.foreground,           // Same as body for consistency
    fontSize: 20,                        // Larger than body (16)
    fontWeight: '700',                   // Bold for emphasis
    lineHeight: 28,                      // Comfortable line height
    marginTop: 24,                       // Space above section header
    marginBottom: 12,                    // Space below before content
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  /**
   * HEADING 3 (###)
   * Sub-section headers, smaller than ## but still prominent.
   * Used for nested topics within a section.
   */
  heading3: {
    color: colors.foreground,
    fontSize: 18,                        // Between h2 (20) and body (16)
    fontWeight: '600',                   // Semibold
    lineHeight: 26,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  /**
   * HEADING 4 (####)
   * Smaller headers for fine-grained structure.
   */
  heading4: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  /**
   * PARAGRAPH
   * Regular text blocks.
   * Note: Most styling comes from 'body', but we add paragraph-specific margins.
   */
  paragraph: {
    marginTop: 0,
    marginBottom: 16,                    // Space between paragraphs
  },

  /**
   * STRONG (**bold**)
   * Bold text emphasis within paragraphs.
   */
  strong: {
    fontWeight: '700',                   // Bold
  },

  /**
   * EM (*italic*)
   * Italic text emphasis within paragraphs.
   */
  em: {
    fontStyle: 'italic',
  },

  /**
   * BULLET LIST (- item)
   * Container for unordered lists.
   */
  bullet_list: {
    marginTop: 8,
    marginBottom: 16,
  },

  /**
   * ORDERED LIST (1. item)
   * Container for numbered lists.
   */
  ordered_list: {
    marginTop: 8,
    marginBottom: 16,
  },

  /**
   * LIST ITEM
   * Individual items in both bullet and ordered lists.
   */
  list_item: {
    marginBottom: 8,                     // Space between list items
    flexDirection: 'row',                // Bullet/number + text side by side
  },

  /**
   * BULLET LIST ICON
   * The bullet point character styling.
   */
  bullet_list_icon: {
    color: colors.primary,               // Sage green bullets for brand touch
    fontSize: 16,
    marginRight: 8,
  },

  /**
   * ORDERED LIST ICON
   * The number styling in numbered lists.
   */
  ordered_list_icon: {
    color: colors.textSecondary,         // Muted color for numbers
    fontSize: 16,
    marginRight: 8,
  },

  /**
   * LIST ITEM CONTENT
   * The text content of list items.
   */
  bullet_list_content: {
    flex: 1,                             // Take remaining space after bullet
  },
  ordered_list_content: {
    flex: 1,
  },

  /**
   * LINK ([text](url))
   * Clickable links within the content.
   * Uses primary color to indicate interactivity.
   */
  link: {
    color: colors.primary,               // Sage green to match brand
    textDecorationLine: 'underline',     // Clear affordance that it's clickable
  },

  /**
   * BLOCKQUOTE (> quote)
   * Quoted text, styled with left border similar to our summary component.
   */
  blockquote: {
    backgroundColor: `${colors.primary}08`, // Very light sage green background
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,     // Sage green left border
    paddingLeft: 16,
    paddingVertical: 12,
    marginVertical: 16,
    borderRadius: 4,
  },

  /**
   * CODE INLINE (`code`)
   * Inline code snippets.
   */
  code_inline: {
    backgroundColor: colors.muted,       // Stone-100 background
    color: colors.foreground,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  /**
   * CODE BLOCK (```)
   * Multi-line code blocks.
   */
  code_block: {
    backgroundColor: colors.muted,
    color: colors.foreground,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    overflow: 'hidden',
  },

  /**
   * FENCE (``` with language)
   * Same as code_block but for fenced code blocks.
   */
  fence: {
    backgroundColor: colors.muted,
    color: colors.foreground,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    overflow: 'hidden',
  },

  /**
   * HORIZONTAL RULE (---)
   * Divider line between sections.
   */
  hr: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 24,
  },
});

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. MARKDOWN PARSING
 *    The library parses markdown text and converts it to React Native components.
 *    "## Hello" becomes a styled View with Text inside.
 *
 * 2. STYLE KEYS
 *    Each markdown element has a specific style key (heading2, paragraph, etc.)
 *    The library applies these styles when rendering that element type.
 *
 * 3. DESIGN SYSTEM CONSISTENCY
 *    We use colors from @/theme/colors to ensure markdown content
 *    matches the rest of the app's look and feel.
 *
 * 4. TYPOGRAPHY HIERARCHY
 *    - Article title (h1): Rendered separately, not in markdown
 *    - Section headers (##): 20px, bold - main sections
 *    - Sub-headers (###): 18px, semibold - sub-sections
 *    - Body text: 16px, regular - main content
 *
 * 5. SPACING RHYTHM
 *    Consistent margins (8, 12, 16, 24) create visual rhythm.
 *    More space before headers, moderate space between paragraphs.
 *
 * 6. ACCESSIBILITY
 *    - Sufficient color contrast (foreground on background)
 *    - Links have underline (not just color) for recognition
 *    - Font sizes are readable (minimum 14px)
 */

export default MarkdownBody;
