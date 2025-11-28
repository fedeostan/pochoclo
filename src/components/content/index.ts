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
