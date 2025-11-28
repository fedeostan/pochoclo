/**
 * Edit Preferences Screen
 *
 * Allows users to modify their learning preferences after completing onboarding.
 * This screen combines both category selection and time selection into a single
 * editable form, providing a convenient way to update preferences from the profile.
 *
 * PURPOSE:
 * ========
 * 1. Display current learning preferences (categories and time)
 * 2. Allow users to add/remove categories
 * 3. Allow users to change their daily learning time
 * 4. Save changes to Firestore via Redux
 *
 * HOW IT DIFFERS FROM ONBOARDING:
 * ===============================
 * - Onboarding: Two separate screens, saves at the end
 * - Edit: Single screen with both sections, saves on "Save Changes"
 * - Edit: Pre-populated with existing preferences
 * - Edit: Uses updatePreferencesAsync instead of savePreferences
 *
 * STATE MANAGEMENT:
 * =================
 * - Redux: Source of truth for current preferences
 * - Local state: Temporary edits before saving
 *
 * WHY LOCAL STATE FOR EDITS?
 * We copy Redux values to local state so the user can:
 * - Make changes without immediately affecting the app
 * - Cancel and discard changes
 * - See a "dirty" state (changes made but not saved)
 *
 * When the user taps "Save Changes":
 * 1. Dispatch updatePreferencesAsync with local state values
 * 2. Firestore and Redux are updated
 * 3. Navigate back to profile
 *
 * DESIGN SYSTEM:
 * ==============
 * - Uses same CategoryChip and TimeOptionCard components as onboarding
 * - Follows UI_RULES.md styling
 * - NavBar with back button and title
 * - Single scrollable form with sections
 */

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
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
  TimeOptionCard,
  TimeOptionCardGroup,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store';
import { updatePreferencesAsync } from '@/store/slices/userPreferencesSlice';
import {
  PREDEFINED_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  PredefinedCategory,
  isCustomCategory,
  createCustomCategory,
  getCategoryDisplayName,
  validateCustomCategory,
  PREDEFINED_TIME_OPTIONS,
  validateCustomTime,
  CUSTOM_TIME_MIN,
  CUSTOM_TIME_MAX,
} from '@/types/preferences';

/**
 * EditPreferencesScreen Component
 *
 * Main component for editing learning preferences.
 *
 * COMPONENT STRUCTURE:
 * ====================
 * - NavBar (fixed at top with back button and title)
 * - ScrollView (main content)
 *   - Categories Section
 *     - Predefined category chips
 *     - Custom categories (with remove)
 *     - Add custom category input
 *   - Time Section
 *     - Predefined time options
 *     - "Other" custom option with input
 * - Bottom Section (Save Changes button)
 */
export default function EditPreferencesScreen() {
  /**
   * Redux Hooks
   *
   * dispatch: Send actions to Redux store
   * categories: Current categories from Redux (used to initialize local state)
   * dailyLearningMinutes: Current time from Redux (used to initialize local state)
   * saving: Loading state for updatePreferencesAsync thunk
   * error: Error from updatePreferencesAsync (if any)
   * user: Current authenticated user (need UID for Firestore)
   */
  const dispatch = useAppDispatch();
  const {
    categories: reduxCategories,
    dailyLearningMinutes: reduxMinutes,
    saving,
    error,
  } = useAppSelector((state) => state.userPreferences);
  const { user } = useAppSelector((state) => state.auth);

  /**
   * NavBar Height
   *
   * Used to add padding to ScrollView content.
   */
  const navBarHeight = useNavBarHeight();

  /**
   * Local State for Categories
   *
   * We copy Redux categories to local state so edits don't immediately
   * affect the app. User must tap "Save Changes" to persist.
   *
   * selectedCategories: Array of currently selected category IDs
   */
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  /**
   * Local State for Time
   *
   * selectedTime: The currently selected time value (or null)
   * isOtherSelected: Whether "Other" custom option is active
   * customMinutesInput: Text input for custom time
   */
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('');

  /**
   * Local UI State
   *
   * showCustomCategoryInput: Whether the custom category input is visible
   * customCategoryInput: The text user is typing for custom category
   * customCategoryError: Validation error for custom category
   * customTimeError: Validation error for custom time
   * isScrolled: Whether user has scrolled (for NavBar border)
   */
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [customCategoryError, setCustomCategoryError] = useState('');
  const [customTimeError, setCustomTimeError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  /**
   * Initialize Local State from Redux
   *
   * When the component mounts, copy current preferences from Redux
   * to local state. This lets the user edit without affecting the app
   * until they save.
   *
   * WHY useEffect?
   * We want this to run once on mount, using the Redux values at that time.
   * If Redux changes while editing (unlikely), we don't want to lose edits.
   */
  useEffect(() => {
    // Initialize categories
    setSelectedCategories([...reduxCategories]);

    // Initialize time
    if (reduxMinutes !== null) {
      // Check if it's a predefined time
      const isPredefined = PREDEFINED_TIME_OPTIONS.some(
        (opt) => opt.minutes === reduxMinutes
      );

      if (isPredefined) {
        setSelectedTime(reduxMinutes);
        setIsOtherSelected(false);
      } else {
        // Custom time
        setSelectedTime(reduxMinutes);
        setIsOtherSelected(true);
        setCustomMinutesInput(String(reduxMinutes));
      }
    }
  }, []); // Empty deps = run once on mount

  /**
   * Scroll Event Handler
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      setIsScrolled(scrollY > 0);
    },
    []
  );

  /**
   * ==========================================================================
   * CATEGORY HANDLERS
   * ==========================================================================
   */

  /**
   * Derived State: Separate Predefined and Custom Categories
   */
  const customCategories = selectedCategories.filter(isCustomCategory);
  const selectedPredefined = selectedCategories.filter((c) => !isCustomCategory(c));

  /**
   * Handle Category Toggle (Predefined)
   *
   * Toggles selection of a predefined category.
   */
  const handleToggleCategory = (category: PredefinedCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        // Remove if already selected
        return prev.filter((c) => c !== category);
      } else {
        // Add if not selected
        return [...prev, category];
      }
    });
  };

  /**
   * Handle Add Custom Category
   *
   * Validates and adds a custom category to the selection.
   */
  const handleAddCustomCategory = () => {
    setCustomCategoryError('');

    const validation = validateCustomCategory(customCategoryInput);
    if (!validation.isValid) {
      setCustomCategoryError(validation.error ?? 'Invalid category');
      return;
    }

    const customCategoryId = createCustomCategory(customCategoryInput);

    if (selectedCategories.includes(customCategoryId)) {
      setCustomCategoryError('This category is already selected');
      return;
    }

    setSelectedCategories((prev) => [...prev, customCategoryId]);
    setCustomCategoryInput('');
    setShowCustomCategoryInput(false);
    setCustomCategoryError('');
  };

  /**
   * Handle Remove Custom Category
   *
   * Removes a custom category from the selection.
   */
  const handleRemoveCustomCategory = (category: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== category));
  };

  /**
   * ==========================================================================
   * TIME HANDLERS
   * ==========================================================================
   */

  /**
   * Handle Predefined Time Selection
   */
  const handleSelectPredefinedTime = (minutes: number) => {
    setIsOtherSelected(false);
    setCustomMinutesInput('');
    setCustomTimeError('');
    setSelectedTime(minutes);
  };

  /**
   * Handle "Other" Option Selection
   */
  const handleSelectOther = () => {
    setIsOtherSelected(true);
    setSelectedTime(null);
  };

  /**
   * Handle Custom Minutes Input Change
   */
  const handleCustomMinutesChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    setCustomMinutesInput(numericOnly);
    setCustomTimeError('');

    if (!numericOnly) {
      setSelectedTime(null);
      return;
    }

    const minutes = parseInt(numericOnly, 10);
    const validation = validateCustomTime(minutes);

    if (validation.isValid) {
      setSelectedTime(minutes);
    } else {
      setSelectedTime(null);
    }
  };

  /**
   * Handle Custom Input Blur
   */
  const handleCustomInputBlur = () => {
    if (!customMinutesInput) return;

    const minutes = parseInt(customMinutesInput, 10);
    const validation = validateCustomTime(minutes);

    if (!validation.isValid) {
      setCustomTimeError(validation.error ?? 'Invalid time');
    }
  };

  /**
   * ==========================================================================
   * FORM VALIDATION AND SUBMISSION
   * ==========================================================================
   */

  /**
   * Derived State: Form Validation
   *
   * Valid when:
   * - At least 1 category is selected
   * - A valid time is selected
   */
  const isFormValid = (() => {
    // Need at least 1 category
    if (selectedCategories.length === 0) return false;

    // Need a valid time
    if (!isOtherSelected) {
      return selectedTime !== null;
    } else {
      const minutes = parseInt(customMinutesInput, 10);
      return validateCustomTime(minutes).isValid;
    }
  })();

  /**
   * Derived State: Has Changes
   *
   * True if the local state differs from Redux state.
   * Used to enable/disable the save button and show confirmation on back.
   */
  const hasChanges = (() => {
    // Check if categories changed
    const categoriesChanged =
      selectedCategories.length !== reduxCategories.length ||
      !selectedCategories.every((c) => reduxCategories.includes(c));

    // Check if time changed
    const timeChanged = selectedTime !== reduxMinutes;

    return categoriesChanged || timeChanged;
  })();

  /**
   * Handle Save Changes
   *
   * Validates form and dispatches updatePreferencesAsync.
   *
   * IMPORTANT: Only navigates back after confirmed save success.
   * Shows retry option on failure instead of silent error.
   */
  const handleSaveChanges = async () => {
    // Validate form is complete before attempting save
    if (!isFormValid || selectedTime === null) {
      console.error('Form validation failed - cannot save');
      return;
    }

    // Additional validation for custom time
    if (isOtherSelected) {
      const minutes = parseInt(customMinutesInput, 10);
      const validation = validateCustomTime(minutes);

      if (!validation.isValid) {
        setCustomTimeError(validation.error ?? 'Invalid time');
        return;
      }
    }

    if (!user?.uid) {
      Alert.alert(
        'Authentication Error',
        'You need to be signed in to save preferences. Please sign in again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // selectedTime is guaranteed to be a number here because we checked above
      await dispatch(
        updatePreferencesAsync({
          userId: user.uid,
          updates: {
            categories: selectedCategories,
            dailyLearningMinutes: selectedTime,
          },
        })
      ).unwrap();

      // Success! Show confirmation and navigate back
      Alert.alert(
        'Preferences Saved',
        'Your learning preferences have been updated.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('Failed to save preferences:', err);
      // Show alert with retry option
      Alert.alert(
        'Save Failed',
        'Could not save your preferences. Please check your connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: handleSaveChanges },
        ]
      );
    }
  };

  /**
   * Handle Back Navigation
   *
   * If there are unsaved changes, show confirmation dialog.
   */
  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  /**
   * Effect: Handle Redux Error State
   *
   * This effect is kept as a fallback for any Redux errors
   * that might occur outside of our try/catch blocks.
   * Primary error handling is done inline in handleSaveChanges.
   *
   * NOTE: We check if 'saving' is false to avoid showing error
   * while another save operation might be in progress.
   */
  useEffect(() => {
    if (error && !saving) {
      // Only show if error wasn't already handled by the inline Alert
      // This is a fallback for unexpected errors
      console.warn('Redux error state detected:', error);
    }
  }, [error, saving]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {/**
       * Fixed Navigation Bar
       *
       * Shows title and back button.
       * Custom onBackPress to handle unsaved changes.
       */}
      <NavBar
        title="Edit Preferences"
        showBackButton
        onBackPress={handleBack}
        isScrolled={isScrolled}
      />

      {/**
       * Keyboard Avoiding View
       */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        {/**
         * Scrollable Content
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
             * =============================================================
             * CATEGORIES SECTION
             * =============================================================
             */}
            <View className="mb-8">
              <Text variant="h2" className="mb-2">
                Learning Topics
              </Text>
              <Text variant="muted" className="mb-4">
                Select the topics you want to learn about.
              </Text>

              {/**
               * Predefined Categories
               */}
              <View className="mb-4">
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
               * Custom Categories
               */}
              {customCategories.length > 0 && (
                <View className="mb-4">
                  <Text variant="small" className="text-muted-foreground mb-3">
                    Your Topics
                  </Text>
                  <CategoryChipGroup>
                    {customCategories.map((category) => (
                      <CategoryChip
                        key={category}
                        label={getCategoryDisplayName(category)}
                        selected
                        showRemoveIcon
                        onPress={() => handleRemoveCustomCategory(category)}
                      />
                    ))}
                  </CategoryChipGroup>
                </View>
              )}

              {/**
               * Add Custom Category
               */}
              <View>
                {!showCustomCategoryInput ? (
                  <CategoryChip
                    label="Add Custom Topic"
                    isAddButton
                    onPress={() => setShowCustomCategoryInput(true)}
                  />
                ) : (
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
                    {customCategoryError && (
                      <Text className="text-destructive text-sm mb-2">
                        {customCategoryError}
                      </Text>
                    )}
                    <View className="flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => {
                          setShowCustomCategoryInput(false);
                          setCustomCategoryInput('');
                          setCustomCategoryError('');
                        }}
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

            {/**
             * =============================================================
             * TIME SECTION
             * =============================================================
             */}
            <View className="mb-6">
              <Text variant="h2" className="mb-2">
                Daily Learning Time
              </Text>
              <Text variant="muted" className="mb-4">
                How much time can you dedicate each day?
              </Text>

              <TimeOptionCardGroup>
                {/**
                 * Predefined Time Options
                 */}
                {PREDEFINED_TIME_OPTIONS.map((option) => (
                  <TimeOptionCard
                    key={option.minutes}
                    label={option.label}
                    description={option.description}
                    selected={!isOtherSelected && selectedTime === option.minutes}
                    onPress={() => handleSelectPredefinedTime(option.minutes)}
                  />
                ))}

                {/**
                 * "Other" Custom Option
                 */}
                <TimeOptionCard
                  label="Other"
                  description="Set your own time"
                  selected={isOtherSelected}
                  onPress={handleSelectOther}
                  isOtherOption
                >
                  {isOtherSelected && (
                    <View>
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          className="flex-1 bg-background rounded-lg px-4 py-3 text-foreground border border-border"
                          placeholder={`Enter minutes (${CUSTOM_TIME_MIN}-${CUSTOM_TIME_MAX})`}
                          placeholderTextColor="#78716C"
                          value={customMinutesInput}
                          onChangeText={handleCustomMinutesChange}
                          onBlur={handleCustomInputBlur}
                          keyboardType="number-pad"
                          maxLength={3}
                          autoFocus
                        />
                        <Text className="text-muted-foreground">min/day</Text>
                      </View>
                      {customTimeError && (
                        <Text className="text-destructive text-sm mt-2">
                          {customTimeError}
                        </Text>
                      )}
                    </View>
                  )}
                </TimeOptionCard>
              </TimeOptionCardGroup>
            </View>

            {/**
             * Validation Message
             *
             * Shows what's needed to enable the save button.
             */}
            {!isFormValid && (
              <View className="mb-4">
                {selectedCategories.length === 0 && (
                  <Text className="text-muted-foreground text-sm">
                    Select at least 1 topic to save.
                  </Text>
                )}
                {selectedCategories.length > 0 && selectedTime === null && (
                  <Text className="text-muted-foreground text-sm">
                    Select a daily learning time to save.
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/**
         * Bottom Section - Save Changes Button
         *
         * Disabled until form is valid and changes have been made.
         * Shows loading spinner while saving.
         */}
        <View className="px-6 pb-6 pt-2">
          <Button
            onPress={handleSaveChanges}
            disabled={!isFormValid || !hasChanges || saving}
            isLoading={saving}
          >
            {hasChanges ? 'Save Changes' : 'No Changes'}
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
 * 1. LOCAL STATE VS REDUX FOR EDITS
 *
 *    We copy Redux state to local state for editing because:
 *    - User can make changes without immediately affecting the app
 *    - User can cancel/discard changes easily
 *    - We can track if there are unsaved changes
 *    - Prevents flickering or inconsistent UI during edits
 *
 *    Pattern:
 *    - On mount: Copy Redux → Local State
 *    - During edit: Modify Local State only
 *    - On save: Dispatch action to update Redux + Firestore
 *    - On cancel: Just navigate back (local state discarded)
 *
 * 2. UNSAVED CHANGES DETECTION
 *
 *    hasChanges compares local state to Redux state:
 *    - If arrays are different length → changed
 *    - If any element differs → changed
 *    - If time value differs → changed
 *
 *    Used for:
 *    - Enabling/disabling save button
 *    - Showing confirmation on back navigation
 *
 * 3. CONFIRMATION DIALOG ON BACK
 *
 *    handleBack shows Alert.alert() if hasChanges is true:
 *    - "Discard Changes?" with Cancel/Discard options
 *    - Prevents accidental loss of edits
 *    - Standard UX pattern for forms
 *
 * 4. UPDATE VS SAVE THUNK
 *
 *    updatePreferencesAsync is used here (not savePreferences) because:
 *    - savePreferences: Full save, sets onboardingCompleted
 *    - updatePreferencesAsync: Partial update, doesn't touch onboardingCompleted
 *
 *    Since user already completed onboarding, we just update the fields.
 *
 * 5. COMPONENT REUSE
 *
 *    This screen reuses the same components as onboarding:
 *    - CategoryChip, CategoryChipGroup
 *    - TimeOptionCard, TimeOptionCardGroup
 *
 *    This ensures visual consistency across the app.
 *    The user sees the same UI for both onboarding and editing.
 *
 * 6. SINGLE FORM VS TWO SCREENS
 *
 *    Onboarding uses two separate screens (progressive disclosure).
 *    Edit uses one combined screen because:
 *    - User already knows the options
 *    - Faster to edit everything in one place
 *    - No need for step-by-step guidance
 *
 * INTEGRATION:
 * ============
 *
 * Profile Screen calls router.push('/edit-preferences'):
 * - Opens this screen as a modal/stack
 * - User can go back to profile
 *
 * On save:
 * - updatePreferencesAsync updates Firestore and Redux
 * - router.back() returns to profile
 * - Profile shows updated preferences immediately
 *
 * On cancel (back with no changes or confirmed discard):
 * - router.back() returns to profile
 * - No changes to Redux or Firestore
 */
