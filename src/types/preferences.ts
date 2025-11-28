/**
 * preferences.ts - TypeScript Types for User Preferences
 *
 * This file defines all TypeScript interfaces and types related to user preferences.
 * These types ensure type safety across the app when working with learning preferences.
 *
 * WHY SEPARATE TYPES FILE?
 * - Single source of truth for preference types
 * - Avoids circular dependencies between slices and services
 * - Makes types easily importable from anywhere
 * - Documents the data structure clearly
 *
 * DATA FLOW:
 * 1. User selects preferences in onboarding
 * 2. Data flows through Redux (typed with these interfaces)
 * 3. Saved to Firestore (following this structure)
 * 4. Loaded back into Redux on app init
 */

/**
 * =============================================================================
 * PREDEFINED CATEGORIES
 * =============================================================================
 *
 * These are the built-in learning categories users can choose from.
 * We define them as a const array to:
 * - Reuse in UI components (category selection screen)
 * - Validate user input
 * - Generate TypeScript types
 */
export const PREDEFINED_CATEGORIES = [
  'technology',
  'science',
  'business',
  'health-fitness',
  'arts-culture',
  'history',
  'psychology',
  'finance',
  'languages',
  'philosophy',
  'environment',
  'politics',
  'design',
] as const;

/**
 * Type for predefined category values
 *
 * WHAT IS 'typeof ... [number]'?
 * - typeof PREDEFINED_CATEGORIES gives us the array type
 * - [number] extracts the element type from the array
 * - Result: 'technology' | 'science' | 'business' | ...
 *
 * This ensures we can only use valid predefined category values.
 */
export type PredefinedCategory = (typeof PREDEFINED_CATEGORIES)[number];

/**
 * Display names for predefined categories
 *
 * Maps the internal category ID (lowercase, hyphenated) to a user-friendly display name.
 * Used in the UI to show readable category labels.
 *
 * WHY SEPARATE FROM THE ARRAY?
 * - Internal IDs should be stable (no spaces, lowercase)
 * - Display names can change without affecting stored data
 * - Easier to add translations later
 */
export const CATEGORY_DISPLAY_NAMES: Record<PredefinedCategory, string> = {
  technology: 'Technology',
  science: 'Science',
  business: 'Business',
  'health-fitness': 'Health & Fitness',
  'arts-culture': 'Arts & Culture',
  history: 'History',
  psychology: 'Psychology',
  finance: 'Finance',
  languages: 'Languages',
  philosophy: 'Philosophy',
  environment: 'Environment',
  politics: 'Politics',
  design: 'Design',
};

/**
 * =============================================================================
 * TIME OPTIONS
 * =============================================================================
 *
 * Predefined daily learning time options.
 * Each option includes the minutes and a descriptive label.
 */
export const PREDEFINED_TIME_OPTIONS = [
  { minutes: 5, label: '5 minutes a day', description: 'Quick daily insights' },
  { minutes: 10, label: '10 minutes a day', description: 'Short focused sessions' },
  { minutes: 15, label: '15 minutes a day', description: 'Balanced learning' },
  { minutes: 30, label: '30 minutes a day', description: 'Deep dive sessions' },
] as const;

/**
 * Type for predefined time option minutes
 *
 * Extracts just the 'minutes' values: 5 | 10 | 15 | 30
 */
export type PredefinedTimeMinutes = (typeof PREDEFINED_TIME_OPTIONS)[number]['minutes'];

/**
 * Custom time validation constants
 *
 * These define the valid range for custom time input.
 * The "Other" option lets users enter their own value within this range.
 */
export const CUSTOM_TIME_MIN = 5;
export const CUSTOM_TIME_MAX = 120;

/**
 * =============================================================================
 * CATEGORY HELPER FUNCTIONS
 * =============================================================================
 *
 * Utility functions for working with categories.
 * Custom categories are prefixed with "custom:" to distinguish from predefined ones.
 */

/**
 * Check if a category is a custom category
 *
 * @param category - The category string to check
 * @returns true if it's a custom category (starts with "custom:")
 *
 * EXAMPLE:
 * isCustomCategory('technology') → false
 * isCustomCategory('custom:blockchain') → true
 */
export const isCustomCategory = (category: string): boolean => {
  return category.startsWith('custom:');
};

/**
 * Create a custom category string from user input
 *
 * @param name - The custom category name entered by user
 * @returns The prefixed custom category string
 *
 * EXAMPLE:
 * createCustomCategory('Blockchain') → 'custom:blockchain'
 * createCustomCategory('Machine  Learning') → 'custom:machine learning'
 *
 * WHY NORMALIZE?
 * - Consistent storage format
 * - Case-insensitive comparison (lowercase)
 * - Prevents duplicates like "Blockchain" and "blockchain"
 * - Multiple spaces collapsed to single space
 * - Leading/trailing whitespace removed
 */
export const createCustomCategory = (name: string): string => {
  // Normalize the input:
  // 1. Trim leading/trailing whitespace
  // 2. Convert to lowercase
  // 3. Collapse multiple spaces to single space
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space

  return `custom:${normalized}`;
};

/**
 * Get the display name for a custom category
 *
 * Removes the "custom:" prefix and capitalizes the first letter of each word.
 *
 * @param category - The custom category string
 * @returns The display name for UI
 *
 * EXAMPLE:
 * getCustomCategoryDisplayName('custom:blockchain') → 'Blockchain'
 * getCustomCategoryDisplayName('custom:machine learning') → 'Machine Learning'
 */
export const getCustomCategoryDisplayName = (category: string): string => {
  if (!isCustomCategory(category)) {
    return category;
  }

  // Remove the "custom:" prefix
  const name = category.slice(7);

  // Capitalize first letter of each word (Title Case)
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get the display name for any category (predefined or custom)
 *
 * @param category - The category string
 * @returns The user-friendly display name
 */
export const getCategoryDisplayName = (category: string): string => {
  if (isCustomCategory(category)) {
    return getCustomCategoryDisplayName(category);
  }

  // Check if it's a valid predefined category
  if (category in CATEGORY_DISPLAY_NAMES) {
    return CATEGORY_DISPLAY_NAMES[category as PredefinedCategory];
  }

  // Fallback: Return the category as-is
  return category;
};

/**
 * =============================================================================
 * VALIDATION FUNCTIONS
 * =============================================================================
 */

/**
 * Validate a custom category name
 *
 * @param name - The custom category name to validate
 * @returns Object with isValid boolean and optional error message
 *
 * VALIDATION RULES:
 * - Must be 2-50 characters
 * - Only alphanumeric and spaces allowed
 * - Cannot be a duplicate of predefined category
 */
export const validateCustomCategory = (
  name: string
): { isValid: boolean; error?: string } => {
  const trimmed = name.trim();

  // Length check
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Category name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Category name must be 50 characters or less' };
  }

  // Character check: alphanumeric and spaces only
  const validPattern = /^[a-zA-Z0-9\s]+$/;
  if (!validPattern.test(trimmed)) {
    return { isValid: false, error: 'Only letters, numbers, and spaces are allowed' };
  }

  // Check if it matches a predefined category (case-insensitive)
  const lowercased = trimmed.toLowerCase().replace(/\s+/g, '-');
  if (PREDEFINED_CATEGORIES.includes(lowercased as PredefinedCategory)) {
    return { isValid: false, error: 'This category already exists' };
  }

  return { isValid: true };
};

/**
 * Validate custom time minutes
 *
 * @param minutes - The number of minutes to validate
 * @returns Object with isValid boolean and optional error message
 */
export const validateCustomTime = (
  minutes: number
): { isValid: boolean; error?: string } => {
  // Check if it's a valid number
  if (isNaN(minutes) || !Number.isInteger(minutes)) {
    return { isValid: false, error: 'Please enter a whole number' };
  }

  // Range check
  if (minutes < CUSTOM_TIME_MIN) {
    return { isValid: false, error: `Minimum is ${CUSTOM_TIME_MIN} minutes` };
  }

  if (minutes > CUSTOM_TIME_MAX) {
    return { isValid: false, error: `Maximum is ${CUSTOM_TIME_MAX} minutes` };
  }

  return { isValid: true };
};

/**
 * =============================================================================
 * FIRESTORE DATA TYPES
 * =============================================================================
 *
 * These types define the structure of preferences data in Firestore.
 */

/**
 * User Preferences Interface
 *
 * This is the shape of the preferences object stored in Firestore
 * under users/{userId}/preferences.
 *
 * FIELDS:
 * - categories: Array of category IDs (predefined or custom)
 * - dailyLearningMinutes: Number of minutes per day
 * - onboardingCompleted: Whether user finished onboarding
 * - updatedAt: Timestamp of last update (null when creating)
 */
export interface UserPreferences {
  categories: string[];
  dailyLearningMinutes: number;
  onboardingCompleted: boolean;
  updatedAt: Date | null;
}

/**
 * Input type for saving preferences to Firestore
 *
 * Similar to UserPreferences but without updatedAt
 * (that's set automatically by the server).
 */
export interface SavePreferencesInput {
  categories: string[];
  dailyLearningMinutes: number;
  onboardingCompleted?: boolean;
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. CONST ASSERTIONS (as const)
 *    When we use 'as const', TypeScript treats the array as readonly
 *    with literal types. This lets us derive types from the values.
 *
 *    Without 'as const':
 *    const CATEGORIES = ['a', 'b']; // type: string[]
 *
 *    With 'as const':
 *    const CATEGORIES = ['a', 'b'] as const; // type: readonly ['a', 'b']
 *
 * 2. RECORD TYPE
 *    Record<K, V> creates an object type with keys of type K and values of type V.
 *    Record<PredefinedCategory, string> ensures we have a display name for
 *    every predefined category - TypeScript will error if one is missing!
 *
 * 3. CUSTOM CATEGORY PREFIX
 *    We use "custom:" prefix to distinguish user-created categories.
 *    This is a simple but effective pattern for:
 *    - Easy identification in code
 *    - Simple filtering (startsWith)
 *    - No collision with predefined categories
 *
 * 4. VALIDATION FUNCTIONS
 *    These functions return objects with isValid and error, allowing:
 *    - Clear success/failure check
 *    - Informative error messages for UI
 *    - Easy composition (validate multiple things)
 */
