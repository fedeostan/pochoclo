/**
 * Category Selection Screen
 *
 * The first step in the onboarding flow where users select their learning interests.
 * This screen helps personalize the app experience by understanding what topics
 * the user wants to learn about.
 *
 * PURPOSE:
 * ========
 * 1. Allow users to select multiple predefined categories
 * 2. Support adding custom categories for topics not in the list
 * 3. Store selections in Redux (for later persistence)
 * 4. Navigate to time selection after valid selection
 *
 * USER FLOW:
 * ==========
 * 1. User sees grid of category chips (Technology, Science, etc.)
 * 2. User taps chips to select/deselect (multi-select)
 * 3. User can tap "Add Custom" to add their own category
 * 4. User taps "Continue" when at least 1 category is selected
 * 5. Navigation to time-selection screen
 *
 * DESIGN SYSTEM:
 * ==============
 * - Uses CategoryChip component from Phase 2
 * - Follows UI_RULES.md (minimal, light, soft, modern)
 * - Uses our custom Text, Button, Input components
 * - Background: off-white (#FAFAF9)
 * - Primary accent: sage green (#6B8E7B)
 *
 * STATE MANAGEMENT:
 * =================
 * - Redux: Stores selected categories (persisted across screens)
 * - Local state: Custom category input, UI state (showing input)
 *
 * The Redux store is updated as user selects/deselects categories.
 * This makes the selections available to the time-selection screen
 * and eventually to the savePreferences thunk.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Button,
  NavBar,
  useNavBarHeight,
  CategoryChip,
  CategoryChipGroup,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  toggleCategory,
  addCategory,
  removeCategory,
} from '@/store/slices/userPreferencesSlice';
import {
  PREDEFINED_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  PredefinedCategory,
  isCustomCategory,
  createCustomCategory,
  getCategoryDisplayName,
  validateCustomCategory,
} from '@/types/preferences';

/**
 * CategorySelectionScreen Component
 *
 * Main component for the category selection onboarding step.
 *
 * COMPONENT STRUCTURE:
 * ====================
 * - NavBar (fixed at top with back button)
 * - ScrollView (main content)
 *   - Header (title, subtitle)
 *   - Predefined Category Chips
 *   - Custom Categories (if any)
 *   - Add Custom Button / Input
 * - Bottom Section (Continue button)
 *
 * WHY THIS STRUCTURE?
 * - Fixed NavBar: Always accessible navigation
 * - ScrollView: Handles overflow if many custom categories
 * - Fixed bottom button: Accessible for thumb, standard mobile UX
 */
export default function CategorySelectionScreen() {
  /**
   * Redux Hooks
   *
   * dispatch: Send actions to Redux store
   * categories: Currently selected categories from Redux state
   */
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.userPreferences);

  /**
   * NavBar Height
   *
   * Used to add padding to ScrollView content so it starts below the NavBar.
   */
  const navBarHeight = useNavBarHeight();

  /**
   * Local UI State
   *
   * These manage the "Add Custom Category" feature:
   * - showCustomInput: Whether the input field is visible
   * - customCategoryInput: The text user is typing
   * - customInputError: Validation error message
   * - isScrolled: Whether user has scrolled (for NavBar border)
   */
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [customInputError, setCustomInputError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  /**
   * Scroll Event Handler
   *
   * Updates isScrolled state for NavBar styling.
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      setIsScrolled(scrollY > 0);
    },
    []
  );

  /**
   * Derived State: Selected Category Count
   *
   * Used for:
   * - Button text: "Continue (3 selected)"
   * - Form validation: At least 1 category required
   *
   * WHY DERIVE FROM REDUX?
   * The categories array is in Redux, so we compute the count from it.
   * This ensures the count is always in sync with the actual selections.
   */
  const selectedCount = categories.length;

  /**
   * Derived State: Form Validation
   *
   * User must select at least 1 category to proceed.
   */
  const isFormValid = selectedCount > 0;

  /**
   * Derived State: Separate Predefined and Custom Categories
   *
   * We display these in separate sections:
   * - Predefined: Grid of all available categories
   * - Custom: User-added categories (shown separately)
   *
   * WHY SEPARATE?
   * - Visual distinction between system and user categories
   * - Custom categories can be removed, predefined cannot
   * - Custom categories show the "X" icon for removal
   */
  const customCategories = categories.filter(isCustomCategory);
  const selectedPredefined = categories.filter((c) => !isCustomCategory(c));

  /**
   * Handle Category Toggle
   *
   * Called when user taps a predefined category chip.
   * Dispatches toggleCategory action to Redux.
   *
   * WHY USE toggleCategory?
   * - Single action for both select and deselect
   * - Reducer handles the logic (add if not present, remove if present)
   * - Simpler component code
   *
   * @param category - The predefined category ID to toggle
   */
  const handleToggleCategory = (category: PredefinedCategory) => {
    dispatch(toggleCategory(category));
  };

  /**
   * Handle Custom Category Submit
   *
   * Called when user submits a custom category (Enter key or button).
   *
   * FLOW:
   * 1. Validate the input (length, characters, not duplicate)
   * 2. Create the custom category ID (prefixed with "custom:")
   * 3. Check if already selected (prevent duplicates)
   * 4. Add to Redux store
   * 5. Clear input and hide field
   *
   * @returns void
   */
  const handleAddCustomCategory = () => {
    // Clear previous error
    setCustomInputError('');

    // Validate the input
    const validation = validateCustomCategory(customCategoryInput);
    if (!validation.isValid) {
      setCustomInputError(validation.error ?? 'Invalid category');
      return;
    }

    // Create the custom category ID
    const customCategoryId = createCustomCategory(customCategoryInput);

    // Check if already in selection (case-insensitive via normalized ID)
    if (categories.includes(customCategoryId)) {
      setCustomInputError('This category is already selected');
      return;
    }

    // Add to Redux store
    dispatch(addCategory(customCategoryId));

    // Clear input and hide
    setCustomCategoryInput('');
    setShowCustomInput(false);
    setCustomInputError('');
  };

  /**
   * Handle Custom Category Removal
   *
   * Called when user taps the X icon on a custom category chip.
   *
   * @param category - The custom category ID to remove
   */
  const handleRemoveCustomCategory = (category: string) => {
    dispatch(removeCategory(category));
  };

  /**
   * Handle Continue Button
   *
   * Navigates to the time selection screen.
   * Categories are already in Redux, so no need to pass them.
   */
  const handleContinue = () => {
    router.push('/onboarding/time-selection');
  };

  /**
   * Handle Add Custom Button
   *
   * Shows the custom category input field.
   */
  const handleShowCustomInput = () => {
    setShowCustomInput(true);
    setCustomInputError('');
  };

  /**
   * Handle Cancel Custom Input
   *
   * Hides the input field without adding a category.
   */
  const handleCancelCustomInput = () => {
    setShowCustomInput(false);
    setCustomCategoryInput('');
    setCustomInputError('');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {/**
       * Fixed Navigation Bar
       *
       * Shows at the top of the screen with back button.
       * Back navigates to sign-in (or wherever user came from).
       */}
      <NavBar showBackButton isScrolled={isScrolled} />

      {/**
       * Keyboard Avoiding View
       *
       * Ensures the custom category input stays visible when keyboard opens.
       */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        {/**
         * Scrollable Content
         *
         * Contains all the category selection UI.
         * Uses flexGrow: 1 so content fills available space.
         */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingTop: navBarHeight }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View className="flex-1 px-6 py-4">
            {/**
             * Progress Indicator
             *
             * Shows the user which step of onboarding they're on.
             * This helps users understand how much of the flow remains.
             *
             * DESIGN:
             * - Two circles: filled for current/completed, outlined for remaining
             * - Connecting line between steps
             * - "Step X of Y" text for clarity
             */}
            <View className="mb-6">
              <View className="flex-row items-center justify-center gap-2 mb-2">
                {/* Step 1 - Current (filled) */}
                <View className="w-3 h-3 rounded-full bg-primary" />
                {/* Connecting line */}
                <View className="w-8 h-0.5 bg-border" />
                {/* Step 2 - Upcoming (outlined) */}
                <View className="w-3 h-3 rounded-full border-2 border-border" />
              </View>
              <Text variant="small" className="text-muted-foreground text-center">
                Step 1 of 2
              </Text>
            </View>

            {/**
             * Header Section
             *
             * Title and subtitle explaining the purpose of this screen.
             */}
            <View className="mb-8">
              <Text variant="h1" className="mb-2">
                What do you want to learn about?
              </Text>
              <Text variant="lead">
                Select topics that interest you. You can always change this later.
              </Text>
            </View>

            {/**
             * Predefined Categories Section
             *
             * Grid of all available category chips.
             * Users tap to select/deselect.
             *
             * CategoryChipGroup provides flex-wrap layout with consistent gaps.
             */}
            <View className="mb-6">
              <Text variant="small" className="text-muted-foreground mb-3">
                Popular Topics
              </Text>
              <CategoryChipGroup>
                {PREDEFINED_CATEGORIES.map((category) => (
                  <CategoryChip
                    key={category}
                    label={CATEGORY_DISPLAY_NAMES[category]}
                    selected={selectedPredefined.includes(category)}
                    onPress={() => handleToggleCategory(category)}
                  />
                ))}
              </CategoryChipGroup>
            </View>

            {/**
             * Custom Categories Section
             *
             * Shows user-added categories (if any).
             * These have an X icon for removal.
             */}
            {customCategories.length > 0 && (
              <View className="mb-6">
                <Text variant="small" className="text-muted-foreground mb-3">
                  Your Topics
                </Text>
                <CategoryChipGroup>
                  {customCategories.map((category) => (
                    <CategoryChip
                      key={category}
                      label={getCategoryDisplayName(category)}
                      selected={true}
                      showRemoveIcon
                      onPress={() => handleRemoveCustomCategory(category)}
                    />
                  ))}
                </CategoryChipGroup>
              </View>
            )}

            {/**
             * Add Custom Category Section
             *
             * Two states:
             * 1. Button visible: User can tap to show input
             * 2. Input visible: User types custom category name
             */}
            <View className="mb-6">
              {!showCustomInput ? (
                /**
                 * Add Custom Button
                 *
                 * Renders as a special "Add" variant of CategoryChip.
                 * Dashed border with plus icon indicates additive action.
                 */
                <CategoryChip
                  label="Add Custom Topic"
                  isAddButton
                  onPress={handleShowCustomInput}
                />
              ) : (
                /**
                 * Custom Category Input
                 *
                 * Shows when user taps "Add Custom Topic".
                 * Includes input field, error message, and action buttons.
                 */
                <View className="bg-card rounded-xl p-4 border-2 border-border">
                  <Text variant="small" className="text-foreground mb-2 font-medium">
                    Add a custom topic
                  </Text>
                  <TextInput
                    className="bg-background rounded-lg px-4 py-3 text-foreground border border-border mb-2"
                    placeholder="e.g., Blockchain, Machine Learning"
                    placeholderTextColor="#78716C"
                    value={customCategoryInput}
                    onChangeText={setCustomCategoryInput}
                    onSubmitEditing={handleAddCustomCategory}
                    autoFocus
                    maxLength={50}
                    autoCapitalize="words"
                  />

                  {/* Error Message */}
                  {customInputError && (
                    <Text className="text-destructive text-sm mb-2">
                      {customInputError}
                    </Text>
                  )}

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={handleCancelCustomInput}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onPress={handleAddCustomCategory}
                      disabled={customCategoryInput.trim().length < 2}
                      className="flex-1"
                    >
                      Add
                    </Button>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/**
         * Bottom Section - Continue Button
         *
         * Fixed at bottom, outside ScrollView.
         * Shows selected count in button text.
         * Disabled until at least 1 category is selected.
         */}
        <View className="px-6 pb-6 pt-2">
          <Button
            onPress={handleContinue}
            disabled={!isFormValid}
          >
            {selectedCount > 0
              ? `Continue (${selectedCount} selected)`
              : 'Select at least 1 topic'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. MULTI-SELECT VS SINGLE-SELECT
 *
 *    This screen uses multi-select (checkboxes behavior):
 *    - User can select multiple categories
 *    - Tapping toggles selection
 *    - Redux stores array of selected IDs
 *
 *    Time selection will use single-select (radio behavior):
 *    - User can only select one option
 *    - Selecting new option replaces previous
 *    - Redux stores single value
 *
 * 2. CONTROLLED VS UNCONTROLLED INPUTS
 *
 *    The custom category TextInput is controlled:
 *    - value={customCategoryInput}
 *    - onChangeText={setCustomCategoryInput}
 *
 *    Controlled means React manages the value, not the DOM/native.
 *    This gives us full control over validation and updates.
 *
 * 3. DERIVED STATE
 *
 *    We compute values from Redux state rather than storing separately:
 *    - selectedCount = categories.length
 *    - customCategories = categories.filter(isCustomCategory)
 *
 *    Benefits:
 *    - Single source of truth (Redux)
 *    - No sync issues between states
 *    - Computed on render (React optimizes this)
 *
 * 4. CUSTOM CATEGORY ID FORMAT
 *
 *    Custom categories use "custom:" prefix:
 *    - User types: "Blockchain"
 *    - Stored as: "custom:blockchain"
 *    - Displayed as: "Blockchain"
 *
 *    The createCustomCategory() function handles this.
 *    The getCategoryDisplayName() reverses it for display.
 *
 * 5. VALIDATION FLOW
 *
 *    Custom category validation:
 *    1. Length: 2-50 characters
 *    2. Characters: alphanumeric + spaces only
 *    3. Not a predefined category (prevents confusion)
 *    4. Not already selected (no duplicates)
 *
 *    validateCustomCategory() handles 1-3.
 *    We check 4 separately against Redux state.
 *
 * 6. KEYBOARD HANDLING
 *
 *    For the custom input:
 *    - KeyboardAvoidingView pushes content up
 *    - onSubmitEditing triggers add (Enter key)
 *    - keyboardShouldPersistTaps="handled" keeps keyboard open
 *    - autoFocus opens keyboard when input appears
 *
 * 7. NAVIGATION
 *
 *    We use router.push() not router.replace():
 *    - push: Adds to navigation stack (can go back)
 *    - replace: Replaces current screen (cannot go back)
 *
 *    User should be able to go back to change categories.
 *    We'll use replace when going from time-selection to home
 *    (user shouldn't go "back" to onboarding after completing it).
 *
 * 8. BUTTON STATES
 *
 *    The Continue button shows different states:
 *    - Invalid: "Select at least 1 topic" (disabled, 50% opacity)
 *    - Valid: "Continue (3 selected)" (enabled, full opacity)
 *
 *    This provides clear feedback about what's needed.
 *
 * NEXT STEPS:
 * ===========
 * After creating this screen, we need:
 * 1. time-selection.tsx - Second onboarding screen
 * 2. Navigation integration - Route to onboarding after auth
 * 3. Profile integration - Allow editing preferences later
 */
