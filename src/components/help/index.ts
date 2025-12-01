/**
 * Help Components - Barrel Export
 *
 * This file exports all help-related components from a single location.
 * It follows the "barrel export" pattern for cleaner imports.
 *
 * USAGE:
 * Instead of:
 *   import { FAQItem } from '@/components/help/FAQItem';
 *
 * You can write:
 *   import { FAQItem } from '@/components/help';
 *
 * WHY BARREL EXPORTS?
 * - Cleaner import statements
 * - Single source of truth for exports
 * - Easier refactoring (change paths in one place)
 * - Better encapsulation (only export what's public)
 */

export { FAQItem } from './FAQItem';
