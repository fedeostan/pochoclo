/**
 * Sign In Screen
 *
 * This screen allows existing users to log into their accounts using
 * email and password authentication through Firebase Auth.
 *
 * PURPOSE:
 * The Sign In screen handles:
 * 1. Email and password input with validation
 * 2. Form submission to Firebase Auth (via Redux)
 * 3. Error handling and user feedback
 * 4. Loading states during authentication
 * 5. Navigation to other auth screens (sign-up, password recovery)
 *
 * DESIGN SYSTEM:
 * Uses our NativeWind/Tailwind-based UI components:
 * - Text component with variants (h1, body, muted)
 * - Button component with variants and loading states
 * - Input component with labels and error states
 * - Tailwind classes for layout and spacing
 *
 * Follows UI_RULES.md principles:
 * - Minimal: Clean form with purposeful whitespace
 * - Light: Off-white background (#FAFAF9)
 * - Soft: Muted sage green accent (#6B8E7B)
 * - Modern: Rounded inputs, clean typography
 *
 * UX IMPROVEMENTS:
 * - Button and footer stay at bottom of screen (closer to thumb)
 * - Button moves up with keyboard for easy access after typing
 * - Button is disabled until form is valid (prevents premature submission)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Input, NavBar, useNavBarHeight } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store';
import { signIn, clearError } from '@/store/slices/authSlice';
import { validateEmail } from '@/utils/validation';

/**
 * SignInScreen Component
 *
 * A form-based screen that handles user authentication.
 *
 * STATE MANAGEMENT:
 * Uses local state (useState) for:
 * - Form field values (email, password)
 * - Client-side validation errors
 *
 * Uses Redux (useAppSelector/useAppDispatch) for:
 * - Authentication state (loading, error from server)
 * - Dispatching signIn action
 *
 * WHY SPLIT STATE THIS WAY?
 * Local state for form inputs (changes frequently, only needed here).
 * Redux for auth state (comes from async thunk, shared across app).
 */
export default function SignInScreen() {
  /**
   * Redux Hooks
   *
   * useAppDispatch: Returns the dispatch function for sending actions
   * useAppSelector: Reads specific state from the Redux store
   */
  const dispatch = useAppDispatch();
  const { loading, error: authError } = useAppSelector((state) => state.auth);

  /**
   * NavBar Height
   *
   * Get the total height of the NavBar (including safe area inset).
   * We use this to add paddingTop to the ScrollView content so it
   * doesn't start hidden behind the fixed NavBar.
   */
  const navBarHeight = useNavBarHeight();

  /**
   * Local Form State
   *
   * Form inputs kept in local state:
   * - They change frequently (every keystroke)
   * - Only this component needs them
   */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  /**
   * Scroll State for NavBar Border
   *
   * Tracks whether the user has scrolled down from the top.
   * When true, the NavBar shows a subtle bottom border to indicate
   * that content is scrolling behind it.
   *
   * This is a polished UX detail seen in native iOS/Android apps.
   */
  const [isScrolled, setIsScrolled] = useState(false);

  /**
   * Scroll Event Handler
   *
   * Called whenever the ScrollView is scrolled.
   * Updates isScrolled state based on the scroll position.
   *
   * WHY useCallback?
   * - Memoizes the function to prevent unnecessary re-renders
   * - The function reference stays stable across renders
   * - Required for optimal performance with onScroll events
   *
   * SCROLL THRESHOLD:
   * We consider content "scrolled" when scrollY > 0.
   * This means even 1 pixel of scroll triggers the border.
   * You could use a larger threshold (e.g., 10) for a delay effect.
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      setIsScrolled(scrollY > 0);
    },
    []
  );

  /**
   * Clear Auth Error on Mount and Unmount
   *
   * Prevents showing stale errors from previous sign-in attempts.
   */
  useEffect(() => {
    dispatch(clearError());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  /**
   * Form Validation State
   *
   * Computed value that determines if the form is ready for submission.
   * The button will be disabled until this returns true.
   *
   * WHY REAL-TIME VALIDATION?
   * - Better UX: User knows when form is ready
   * - Prevents unnecessary error messages from premature submissions
   * - Button becomes "active" as visual feedback when form is complete
   *
   * VALIDATION RULES:
   * 1. Email must be valid format (checked by validateEmail returning undefined)
   * 2. Password must be at least 6 characters (Firebase minimum)
   */
  const isFormValid = !validateEmail(email) && password.length >= 6;

  /**
   * Form Submission Handler
   *
   * FLOW:
   * 1. Clear previous errors
   * 2. Validate input (client-side) - extra safety check
   * 3. Dispatch signIn thunk to Redux
   * 4. Wait for result using unwrap()
   * 5. On success: Navigate to /home explicitly
   * 6. On failure: Error is set in Redux, displayed automatically
   *
   * WHY EXPLICIT NAVIGATION?
   * The Redirect component in index.tsx only evaluates on initial render.
   * It doesn't re-trigger when Redux state changes mid-session.
   * So we explicitly navigate after successful sign-in.
   *
   * NOTE: With isFormValid preventing premature submission,
   * these validation checks are mostly redundant but kept as a safety net.
   */
  const handleSignIn = async () => {
    setValidationError('');
    dispatch(clearError());

    // Validate email format (safety check - button should already be disabled if invalid)
    const emailError = validateEmail(email);
    if (emailError) {
      setValidationError(emailError);
      return;
    }

    // Validate password length (safety check)
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    /**
     * Dispatch sign in action and wait for result
     *
     * unwrap() is a Redux Toolkit method that:
     * - Returns the fulfilled value if successful
     * - Throws the rejected value if failed
     *
     * This lets us use try/catch to handle success/failure.
     * On success, we navigate to "/" (root).
     * On failure, Redux already set the error, so we don't need to do anything.
     *
     * WHY NAVIGATE TO "/" INSTEAD OF "/home"?
     * The root index.tsx handles routing based on BOTH auth state AND
     * onboarding status. By navigating to "/", we let it decide:
     * - If onboarding is complete → /home
     * - If onboarding is incomplete → /onboarding/category-selection
     *
     * This ensures new users go through onboarding, while returning
     * users (who previously signed out) go directly to home.
     */
    try {
      await dispatch(signIn({ email, password })).unwrap();
      // Success! Navigate to root for proper routing
      router.replace('/');
    } catch {
      // Error is already set in Redux state by the rejected action
      // The UI will display it automatically via authError
    }
  };

  /**
   * Navigation Handlers
   */
  const handleForgotPassword = () => router.push('/forgot-password');
  const handleCreateAccount = () => router.push('/sign-up');

  // Determine which error to show (validation takes priority)
  const displayError = validationError || authError;

  /**
   * Safe Area Insets
   *
   * Instead of using SafeAreaView with edges={['top']}, we use the View
   * with only bottom edge protection. This removes the invisible header
   * at the top while still protecting content from the bottom home indicator.
   *
   * The top safe area (notch/status bar) is handled by the content padding.
   */

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {/**
       * Fixed Navigation Bar
       *
       * The NavBar component is positioned absolutely at the top of the screen.
       * It stays fixed while the ScrollView content scrolls behind it.
       *
       * HOW IT WORKS:
       * 1. NavBar uses position: absolute + zIndex: 100
       * 2. NavBar extends from top of screen (including status bar area)
       * 3. NavBar background matches app background (#FAFAF9)
       * 4. ScrollView content has paddingTop to start below the NavBar
       * 5. When user scrolls, content passes "behind" the NavBar and is hidden
       *
       * This creates a native, polished feel where the navigation stays
       * accessible while scrolling through content.
       */}
      <NavBar showBackButton isScrolled={isScrolled} />

      {/**
       * KeyboardAvoidingView Configuration
       *
       * This wraps the entire screen content and adjusts when keyboard appears.
       *
       * behavior="padding" (both platforms):
       * - Adds padding to push content up when keyboard opens
       * - Works reliably on both iOS and Android
       * - "height" behavior had issues on Android with Expo's edge-to-edge mode
       *
       * keyboardVerticalOffset:
       * - iOS: 0 (no extra offset needed)
       * - Android: 20 (compensates for different keyboard height calculation)
       *
       * By having the button OUTSIDE the ScrollView but INSIDE KeyboardAvoidingView,
       * the button will move up when the keyboard appears - making it easily
       * accessible with your thumb right after typing.
       */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        {/**
         * Scrollable Content Area
         *
         * Contains the header, form fields, and error message.
         * Uses flex-1 to take remaining space above the fixed bottom section.
         *
         * WHY SCROLLVIEW?
         * - Handles overflow when keyboard is open
         * - Allows users to scroll to see all content
         * - keyboardShouldPersistTaps="handled" prevents keyboard dismissal on tap
         *
         * PADDING TOP:
         * We add paddingTop equal to the NavBar height so content starts
         * below the fixed NavBar. Without this, the first content would
         * be hidden behind the NavBar.
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
             * Header Section
             *
             * Title and subtitle for the screen.
             * The back button is now in the fixed NavBar above.
             */}
            <View className="mb-8">
              {/* Screen Title */}
              <Text variant="h1" className="mb-2">
                Welcome Back
              </Text>
              <Text variant="lead">
                Sign in to continue your journey
              </Text>
            </View>

            {/**
             * Form Section
             *
             * Email and password inputs using our Input component.
             * gap-4 provides consistent 16px spacing between fields.
             */}
            <View className="gap-4">
              {/* Email Input */}
              <Input
                label="Email"
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              {/* Password Input */}
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onSubmitEditing={handleSignIn}
                editable={!loading}
              />

              {/* Forgot Password Link */}
              <Pressable
                onPress={handleForgotPassword}
                disabled={true} // Enable in Phase 7
                className="self-end -mt-2"
              >
                <Text variant="muted">Forgot password?</Text>
              </Pressable>
            </View>

            {/**
             * Error Message
             *
             * Shows validation or authentication errors.
             * Only appears when there's an error to display.
             * Positioned after form, before the spacer.
             */}
            {displayError && (
              <View className="bg-destructive rounded-lg p-4 mt-4">
                <Text className="text-destructive-foreground text-sm">
                  {displayError}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/**
         * Fixed Bottom Section
         *
         * Contains the CTA button and footer link.
         * This section is OUTSIDE the ScrollView so it stays at the bottom.
         *
         * WHY OUTSIDE SCROLLVIEW?
         * 1. Always visible at the bottom of the screen
         * 2. Moves up with keyboard (inside KeyboardAvoidingView)
         * 3. Closer to thumb - better mobile UX
         * 4. No need to scroll to find the submit button
         *
         * The button is disabled when:
         * - Form is not valid (!isFormValid)
         * - API request is in progress (loading)
         *
         * This provides clear visual feedback - user knows when they can submit.
         */}
        <View className="px-6 pb-6 pt-2">
          {/**
           * Sign In Button
           *
           * Primary action with loading state.
           * isLoading prop shows spinner and disables button.
           * disabled when form is invalid OR loading is in progress.
           *
           * Button appears at 50% opacity when disabled, providing
           * visual feedback that more input is needed.
           */}
          <Button
            onPress={handleSignIn}
            isLoading={loading}
            disabled={loading || !isFormValid}
            className="mb-3"
          >
            Sign In
          </Button>

          {/**
           * Footer Section
           *
           * Sign up prompt for new users.
           * Grouped with button for cohesive bottom action area.
           */}
          <View className="flex-row justify-center items-center py-2">
            <Text variant="muted">Don't have an account? </Text>
            <Pressable onPress={handleCreateAccount}>
              <Text className="text-primary font-semibold">Create one</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. NEW UI COMPONENTS
 *    We now use our custom components:
 *    - <Input> instead of custom TextInput + PasswordInput
 *    - <Button isLoading> instead of Button loading prop
 *    - <Text variant="..."> instead of styled Text
 *
 * 2. TAILWIND CLASS BENEFITS
 *    - gap-4: Consistent 16px spacing between form elements
 *    - mb-6, mb-8: Clear visual sections
 *    - flex-row items-center: Easy horizontal layouts
 *    - self-end: Align forgot password to right
 *
 * 3. ERROR STYLING
 *    Uses our semantic destructive colors:
 *    - bg-destructive: Soft red background (#FEE2E2)
 *    - text-destructive-foreground: Dark red text (#B91C1C)
 *
 * 4. KEYBOARD HANDLING (IMPROVED)
 *    - KeyboardAvoidingView: Pushes content up on iOS
 *    - ScrollView: Allows scrolling when keyboard is open
 *    - Fixed bottom section: Button moves with keyboard
 *    - keyboardShouldPersistTaps="handled": Proper tap handling
 *
 * 5. ICON USAGE
 *    Using lucide-react-native:
 *    - ArrowLeft for back button
 *    - Consistent icon style across app
 *    - Primary color (#6B8E7B) for brand consistency
 *
 * 6. FORM ACCESSIBILITY
 *    - Labels linked to inputs via Input component
 *    - Error messages visible to screen readers
 *    - Disabled states prevent interaction during loading
 *
 * 7. REDUX INTEGRATION (unchanged)
 *    - dispatch(signIn({ email, password })) triggers auth
 *    - loading/error come from Redux state
 *    - Navigation handled by root layout on success
 *
 * 8. FORM VALIDATION UX (NEW)
 *    - isFormValid computed value checks all fields
 *    - Button disabled until form is complete and valid
 *    - Provides visual feedback (50% opacity when disabled)
 *    - Prevents unnecessary error messages from premature taps
 *
 * 9. BOTTOM BUTTON PATTERN (NEW)
 *    - Button placed outside ScrollView
 *    - Stays at bottom of screen (ergonomic for thumb)
 *    - Moves up with keyboard (easy to tap after typing)
 *    - Common mobile UX pattern used by major apps
 */
