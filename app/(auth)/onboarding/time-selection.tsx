/**
 * Time Selection Screen
 *
 * The second (and final) step in the onboarding flow where users select
 * their daily learning time commitment. This helps the app personalize
 * content delivery based on available time.
 *
 * PURPOSE:
 * ========
 * 1. Allow users to select from predefined time options
 * 2. Support custom time input for flexibility
 * 3. Save all preferences to Firestore
 * 4. Complete onboarding and navigate to home
 *
 * USER FLOW:
 * ==========
 * 1. User sees 4 predefined time options (5, 10, 15, 30 minutes)
 * 2. User sees "Other" option for custom time
 * 3. User taps an option (single select - radio behavior)
 * 4. If "Other", user enters custom minutes (5-120)
 * 5. User taps "Get Started" to complete onboarding
 * 6. Preferences saved to Firestore → Navigate to home
 *
 * DESIGN SYSTEM:
 * ==============
 * - Uses TimeOptionCard component from Phase 2
 * - Single-select (radio) behavior
 * - Selected state: primary border/background
 * - Follows UI_RULES.md styling
 *
 * STATE MANAGEMENT:
 * =================
 * - Redux: Stores selected time + triggers save to Firestore
 * - Local state: "Other" input value, validation
 *
 * The savePreferences thunk is called on "Get Started":
 * - Saves categories (from step 1) + time (from this step)
 * - Sets onboardingCompleted: true
 * - On success: Navigate to home
 */

import { useState, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';
import {
  Text,
  Button,
  NavBar,
  useNavBarHeight,
  TimeOptionCard,
  TimeOptionCardGroup,
} from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setDailyTime,
  savePreferences,
} from '@/store/slices/userPreferencesSlice';
import {
  PREDEFINED_TIME_OPTIONS,
  validateCustomTime,
  CUSTOM_TIME_MIN,
  CUSTOM_TIME_MAX,
} from '@/types/preferences';

/**
 * TimeSelectionScreen Component
 *
 * Main component for the time selection onboarding step.
 *
 * COMPONENT STRUCTURE:
 * ====================
 * - NavBar (fixed at top with back button)
 * - ScrollView (main content)
 *   - Header (title, subtitle)
 *   - Predefined Time Options (4 cards)
 *   - "Other" Custom Option (with input)
 * - Bottom Section (Get Started button)
 */
export default function TimeSelectionScreen() {
  /**
   * Translation Hooks
   *
   * useTranslation('onboarding') loads translations from the 'onboarding' namespace.
   * We also use 'common' for shared validation messages and button text.
   */
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');

  /**
   * Redux Hooks
   *
   * dispatch: Send actions to Redux store
   * categories: Selected categories from step 1
   * dailyLearningMinutes: Currently selected time (null = none)
   * saving: Loading state for savePreferences thunk
   * error: Error from savePreferences (if any)
   * user: Current authenticated user (need UID for Firestore)
   */
  const dispatch = useAppDispatch();
  const { categories, dailyLearningMinutes, saving, error } = useAppSelector(
    (state) => state.userPreferences
  );
  const { user } = useAppSelector((state) => state.auth);

  /**
   * NavBar Height
   *
   * Used to add padding to ScrollView content.
   */
  const navBarHeight = useNavBarHeight();

  /**
   * Local UI State
   *
   * - isOtherSelected: Whether the "Other" option is active
   * - customMinutesInput: The custom time value as string (for TextInput)
   * - customTimeError: Validation error for custom time
   * - isScrolled: For NavBar border styling
   */
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('');
  const [customTimeError, setCustomTimeError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

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
   * Derived State: Form Validation
   *
   * Valid when:
   * - A predefined option is selected, OR
   * - "Other" is selected AND custom minutes is valid
   */
  const isFormValid = (() => {
    if (!isOtherSelected) {
      // Predefined option must be selected
      return dailyLearningMinutes !== null;
    } else {
      // Custom time must be valid
      const minutes = parseInt(customMinutesInput, 10);
      return validateCustomTime(minutes).isValid;
    }
  })();

  /**
   * Handle Predefined Time Selection
   *
   * Called when user taps a predefined time option card.
   *
   * @param minutes - The predefined minutes value (5, 10, 15, or 30)
   */
  const handleSelectPredefined = (minutes: number) => {
    // Clear "Other" state
    setIsOtherSelected(false);
    setCustomMinutesInput('');
    setCustomTimeError('');

    // Update Redux
    dispatch(setDailyTime(minutes));
  };

  /**
   * Handle "Other" Option Selection
   *
   * Shows the custom input and clears predefined selection.
   */
  const handleSelectOther = () => {
    setIsOtherSelected(true);

    // Clear predefined selection in Redux
    // We'll set the actual value when user enters valid input
    dispatch(setDailyTime(null));
  };

  /**
   * Handle Custom Minutes Input Change
   *
   * Validates input and updates Redux if valid.
   *
   * @param text - The input text
   */
  const handleCustomMinutesChange = (text: string) => {
    // Only allow numeric input
    const numericOnly = text.replace(/[^0-9]/g, '');
    setCustomMinutesInput(numericOnly);

    // Clear previous error
    setCustomTimeError('');

    // If empty, clear Redux value
    if (!numericOnly) {
      dispatch(setDailyTime(null));
      return;
    }

    // Validate and update Redux if valid
    const minutes = parseInt(numericOnly, 10);
    const validation = validateCustomTime(minutes);

    if (validation.isValid) {
      dispatch(setDailyTime(minutes));
    } else {
      // Don't show error while typing - wait for blur or submit
      dispatch(setDailyTime(null));
    }
  };

  /**
   * Handle Custom Input Blur
   *
   * Shows validation error when user leaves the input.
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
   * Handle Get Started Button
   *
   * Saves preferences to Firestore and navigates to home.
   *
   * FLOW:
   * 1. Validate form is complete (categories + time)
   * 2. Validate custom time (if "Other" selected)
   * 3. Dispatch savePreferences thunk
   * 4. On success: Navigate to /home (replace, not push)
   * 5. On failure: Show error with retry option
   *
   * IMPORTANT: Navigation only happens after confirmed save success.
   * This prevents users from thinking their preferences were saved
   * when they actually weren't due to a network error.
   */
  const handleGetStarted = async () => {
    // Validate form is complete before attempting save
    // This guards against edge cases where the form might be invalid
    if (!isFormValid || dailyLearningMinutes === null) {
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

    // Need user to be authenticated
    if (!user?.uid) {
      // Show user-facing error instead of silent failure
      Alert.alert(
        tCommon('error.authRequired'),
        tCommon('error.authRequiredMessage'),
        [{ text: tCommon('button.ok') }]
      );
      return;
    }

    // Save preferences to Firestore
    // Note: dailyLearningMinutes is guaranteed to be a number here
    // because we checked isFormValid and dailyLearningMinutes !== null above
    try {
      await dispatch(
        savePreferences({
          userId: user.uid,
          preferences: {
            categories,
            dailyLearningMinutes: dailyLearningMinutes,
            onboardingCompleted: true,
          },
        })
      ).unwrap();

      // Success! Navigate to home
      // Use replace so user can't go "back" to onboarding
      // Content generation will be triggered when user lands on HomeScreen
      router.replace('/home');
    } catch (err) {
      // Error is already set in Redux state
      // Show alert with retry option for better UX
      Alert.alert(
        tCommon('error.saveFailed'),
        tCommon('error.saveFailedMessage'),
        [
          { text: tCommon('button.ok'), style: 'cancel' },
          { text: tCommon('button.retry'), onPress: handleGetStarted },
        ]
      );
      console.error('Failed to save preferences:', err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {/**
       * Fixed Navigation Bar
       *
       * Back button navigates to category-selection.
       */}
      <NavBar showBackButton isScrolled={isScrolled} />

      {/**
       * Keyboard Avoiding View
       *
       * For the custom time input.
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
             * Progress Indicator
             *
             * Shows the user which step of onboarding they're on.
             * Step 2 is highlighted as current.
             */}
            <View className="mb-6">
              <View className="flex-row items-center justify-center gap-2 mb-2">
                {/* Step 1 - Completed (filled) */}
                <View className="w-3 h-3 rounded-full bg-primary" />
                {/* Connecting line - filled to show progress */}
                <View className="w-8 h-0.5 bg-primary" />
                {/* Step 2 - Current (filled) */}
                <View className="w-3 h-3 rounded-full bg-primary" />
              </View>
              <Text variant="small" className="text-muted-foreground text-center">
                {t('timeSelection.step', { current: 2, total: 2 })}
              </Text>
            </View>

            {/**
             * Header Section
             */}
            <View className="mb-8">
              <Text variant="h1" className="mb-2">
                {t('timeSelection.title')}
              </Text>
              <Text variant="lead">
                {t('timeSelection.subtitle')}
              </Text>
            </View>

            {/**
             * Time Options Section
             *
             * Predefined options + "Other" custom option.
             */}
            <TimeOptionCardGroup>
              {/**
               * Predefined Time Options
               *
               * 4 cards for common time values (5, 10, 15, 30 minutes).
               * Single-select behavior - only one can be selected.
               */}
              {PREDEFINED_TIME_OPTIONS.map((option) => (
                <TimeOptionCard
                  key={option.minutes}
                  label={option.label}
                  description={option.description}
                  selected={
                    !isOtherSelected && dailyLearningMinutes === option.minutes
                  }
                  onPress={() => handleSelectPredefined(option.minutes)}
                />
              ))}

              {/**
               * "Other" Custom Option
               *
               * Allows user to enter any value between 5-120 minutes.
               * Shows input field when selected.
               */}
              <TimeOptionCard
                label={t('timeSelection.other.label')}
                description={t('timeSelection.other.description')}
                selected={isOtherSelected}
                onPress={handleSelectOther}
                isOtherOption
              >
                {/**
                 * Custom Time Input
                 *
                 * Only shows when "Other" is selected.
                 * Accepts numeric input (5-120).
                 */}
                {isOtherSelected && (
                  <View>
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        className="flex-1 bg-background rounded-lg px-4 py-3 text-foreground border border-border"
                        placeholder={t('timeSelection.other.placeholder', { min: CUSTOM_TIME_MIN, max: CUSTOM_TIME_MAX })}
                        placeholderTextColor="#78716C"
                        value={customMinutesInput}
                        onChangeText={handleCustomMinutesChange}
                        onBlur={handleCustomInputBlur}
                        keyboardType="number-pad"
                        maxLength={3}
                        autoFocus
                      />
                      <Text className="text-muted-foreground">{t('timeSelection.other.unit')}</Text>
                    </View>

                    {/* Validation Error */}
                    {customTimeError && (
                      <Text className="text-destructive text-sm mt-2">
                        {customTimeError}
                      </Text>
                    )}
                  </View>
                )}
              </TimeOptionCard>
            </TimeOptionCardGroup>

            {/**
             * Save Error Message
             *
             * Shows if savePreferences fails.
             */}
            {error && (
              <View className="bg-destructive rounded-lg p-4 mt-6">
                <Text className="text-destructive-foreground text-sm">
                  {error}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/**
         * Bottom Section - Get Started Button
         *
         * Completes onboarding and navigates to home.
         * Disabled until a valid time is selected.
         */}
        <View className="px-6 pb-6 pt-2">
          <Button
            onPress={handleGetStarted}
            disabled={!isFormValid || saving}
            isLoading={saving}
          >
            {t('timeSelection.button')}
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
 * 1. SINGLE-SELECT VS MULTI-SELECT
 *
 *    This screen uses single-select (radio behavior):
 *    - Only one option can be selected at a time
 *    - Selecting a new option deselects the previous
 *    - Redux stores a single number (or null)
 *
 *    We track "Other" separately with isOtherSelected because:
 *    - Need to show/hide the custom input
 *    - dailyLearningMinutes could be 30 (predefined) or 45 (custom)
 *    - Need to distinguish between "30 minutes predefined" and "30 typed custom"
 *
 * 2. CONTROLLED NUMERIC INPUT
 *
 *    The custom minutes input is controlled and restricted:
 *    - keyboardType="number-pad": Only shows numbers on keyboard
 *    - .replace(/[^0-9]/g, ''): Filters out any non-numeric characters
 *    - maxLength={3}: Maximum 3 digits (allows up to 999, we validate 120)
 *
 *    WHY FILTER NON-NUMERIC?
 *    Even with number-pad, some devices allow special characters.
 *    The regex filter ensures only digits are stored.
 *
 * 3. VALIDATION TIMING
 *
 *    We validate at different times:
 *    - onChange: Update Redux only if valid (silent validation)
 *    - onBlur: Show error message when user leaves field
 *    - onSubmit: Final validation before saving
 *
 *    This provides good UX - no errors while typing, but clear
 *    feedback when user moves away from invalid input.
 *
 * 4. ROUTER.REPLACE VS ROUTER.PUSH
 *
 *    We use router.replace('/home') instead of push:
 *    - replace: Replaces current screen in history
 *    - push: Adds to navigation stack
 *
 *    After completing onboarding, user shouldn't be able to
 *    "go back" to onboarding screens. Replace removes them
 *    from the navigation history.
 *
 * 5. ASYNC THUNK WITH UNWRAP
 *
 *    dispatch(savePreferences(...)).unwrap()
 *
 *    unwrap() is Redux Toolkit's way to:
 *    - Return the fulfilled payload on success
 *    - Throw the rejected payload on failure
 *
 *    This lets us use try/catch for flow control:
 *    - Success: Navigate to home
 *    - Failure: Error is in Redux, UI shows it
 *
 * 6. NULL VS 0 FOR UNSELECTED
 *
 *    dailyLearningMinutes is number | null:
 *    - null: No selection (form invalid)
 *    - 0: Could be a valid value (but we don't use it)
 *    - 5-120: Valid time values
 *
 *    Using null for "not selected" is clearer than using 0.
 *
 * 7. COMBINED VALIDATION STATE
 *
 *    isFormValid is computed differently based on mode:
 *
 *    Predefined mode: dailyLearningMinutes !== null
 *    Custom mode: validateCustomTime(customMinutesInput).isValid
 *
 *    This handles the case where user:
 *    1. Selects 15 minutes → valid
 *    2. Clicks "Other" → becomes invalid (need to enter time)
 *    3. Types "25" → becomes valid again
 *
 * 8. ERROR DISPLAY LAYERS
 *
 *    Two error sources:
 *    - customTimeError: Local validation (displayed inline)
 *    - error: Redux save error (displayed in error banner)
 *
 *    They serve different purposes and show in different places.
 *
 * WHAT HAPPENS AFTER THIS:
 * ========================
 *
 * When user taps "Get Started":
 * 1. savePreferences thunk is dispatched
 * 2. Firestore write: users/{uid}/preferences = { categories, time, completed: true }
 * 3. Redux state updated with onboardingCompleted: true
 * 4. Navigation to /home (replace)
 *
 * Next app launch:
 * 1. Auth listener detects user
 * 2. loadPreferences checks onboardingCompleted
 * 3. If true → go to home
 * 4. If false → go to onboarding
 *
 * The navigation integration (Phase 4) will set this up in app/index.tsx.
 */
