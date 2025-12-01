/**
 * Content Components Index
 *
 * Barrel export file for content-related components.
 * This allows clean imports from a single location.
 *
 * USAGE:
 * import { ContentCard, ContentFullView, SourcesList } from '@/components/content';
 *
 * WHY BARREL FILES?
 * 1. Cleaner imports (one line instead of three)
 * 2. Easier refactoring (only this file changes if components move)
 * 3. Clear public API (only exports what's meant to be used)
 */

// Content display components
export { ContentCard } from './ContentCard';
export { ContentFullView } from './ContentFullView';
export { SourcesList } from './SourcesList';
export { MarkdownBody } from './MarkdownBody';

// Loading states
export { ContentLoadingFullScreen } from './ContentLoadingFullScreen';

// Home screen UI components
export { MinimalStatsBar } from './MinimalStatsBar';
export { RecentArticlesWidget } from './RecentArticlesWidget';

// NOTE: PostReadingPrompt was REMOVED (July 2025)
// The post-reading flow is now handled inline within ContentFullView.
// When user taps "Done Reading", the footer transforms to show
// "Keep learning" and "Done" buttons - no separate component needed.
