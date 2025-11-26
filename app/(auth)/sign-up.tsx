/**
 * Sign Up Screen (Create Account)
 *
 * This screen allows new users to create an account using email and password
 * authentication through Firebase Auth.
 *
 * PURPOSE:
 * The Sign Up screen handles:
 * 1. Email, password, confirm password, and display name input
 * 2. Client-side validation (email format, password strength, confirmation match)
 * 3. Account creation via Firebase Auth (using Redux signUp thunk)
 * 4. Error handling and user feedback
 * 5. Loading states during account creation
 * 6. Navigation back to sign-in screen
 *
 * USER FLOW:
 * 1. User enters email, password, confirm password, and optional display name
 * 2. User taps "Create Account" button
 * 3. App validates input (client-side)
 * 4. App dispatches signUp action to Redux
 * 5. Redux thunk calls Firebase Auth to create account
 * 6. On success: Firebase signs user in automatically, navigation handled by auth state
 * 7. On error: Redux sets error, component displays it
 *
 * DESIGN SYSTEM:
 * Uses our NativeWind/Tailwind-based UI components:
 * - Text component with variants (h1, lead, muted)
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
 *
 * REDUX INTEGRATION:
 * Same pattern as SignInScreen:
 * - useAppSelector: Read auth state (loading, error)
 * - useAppDispatch: Dispatch signUp thunk
 * - clearError action: Clear error when starting new attempt
 *
 * FIREBASE SIGN UP BEHAVIOR:
 * When creating an account with Firebase:
 * - User is automatically signed in after creation (no separate sign-in needed)
 * - displayName is set via updateProfile after account creation
 * - No email verification required by default (can be added later)
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
import { signUp, clearError } from '@/store/slices/authSlice';
import { validateEmail } from '@/utils/validation';

/**
 * SignUpScreen Component
 *
 * A form-based screen that handles new user registration.
 *
 * STATE MANAGEMENT:
 * Uses local state (useState) for:
 * - Form field values (email, password, confirmPassword, displayName)
 * - Client-side validation errors
 *
 * Uses Redux (useAppSelector/useAppDispatch) for:
 * - Authentication state (loading, error from server)
 * - Dispatching signUp action
 *
 * WHY MORE FIELDS THAN SIGN IN?
 * Sign up needs additional validation:
 * - Confirm password: Prevents typos in password
 * - Display name: Optional personalization (stored in Firebase profile)
 *
 * PASSWORD CONFIRMATION:
 * This is a UX best practice because:
 * - Users can't see their password while typing
 * - Typos in passwords lock users out
 * - Catching mismatches before submission saves frustration
 */
export default function SignUpScreen() {
  /**
   * Redux Hooks
   *
   * Same pattern as SignInScreen:
   * - useAppDispatch: Returns dispatch function for actions
   * - useAppSelector: Reads specific state from Redux store
   */
  const dispatch = useAppDispatch();

  /**
   * Select Auth State from Redux
   *
   * We need:
   * - loading: Show spinner during account creation
   * - error (as authError): Display server-side errors
   */
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
   * More fields than sign-in because we need:
   * - email: User's email address (becomes account identifier)
   * - password: User's chosen password (min 6 characters for Firebase)
   * - confirmPassword: Must match password (prevents typos)
   * - displayName: Optional name shown in profile
   *
   * validationError: Client-side validation messages (separate from authError)
   */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
   * Same pattern as SignInScreen:
   * - Clear stale errors when entering the screen
   * - Clean up when leaving the screen
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
   * 1. Email must be valid format (validateEmail returns undefined when valid)
   * 2. Password must be at least 6 characters (Firebase minimum)
   * 3. Confirm password must match password
   * 4. Confirm password must not be empty (ensures user actually confirmed)
   *
   * NOTE: displayName is optional, so we don't validate it
   */
  const isFormValid =
    !validateEmail(email) &&
    password.length >= 6 &&
    password === confirmPassword &&
    confirmPassword.length > 0;

  /**
   * Form Submission Handler
   *
   * Creates a new account with Firebase Auth via Redux signUp thunk.
   *
   * VALIDATION ORDER:
   * 1. Email format validation
   * 2. Password length validation (Firebase requires min 6 chars)
   * 3. Password confirmation match
   * 4. If all pass, dispatch signUp action
   *
   * NOTE: With isFormValid preventing premature submission,
   * these validation checks are mostly redundant but kept as a safety net.
   */
  const handleSignUp = async () => {
    // Clear previous errors
    setValidationError('');
    dispatch(clearError());

    /**
     * CLIENT-SIDE VALIDATION (Safety Checks)
     *
     * These are safety checks - the button should already be disabled
     * if any of these conditions are met, but we keep them as a fallback.
     */

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      setValidationError(emailError);
      return;
    }

    // Validate password length
    // Firebase requires at least 6 characters
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    // Validate password confirmation
    // This catches typos before they become a problem
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    /**
     * DISPATCH SIGN UP ACTION
     *
     * The signUp thunk will:
     * 1. Create account with createUserWithEmailAndPassword
     * 2. If displayName provided, update profile with updateProfile
     * 3. Return the user (or error)
     *
     * Redux handles:
     * - signUp.pending → loading = true
     * - signUp.fulfilled → user set
     * - signUp.rejected → error set, displayed below
     *
     * WHY EXPLICIT NAVIGATION?
     * The Redirect component in index.tsx only evaluates on initial render.
     * It doesn't re-trigger when Redux state changes mid-session.
     * So we explicitly navigate after successful sign-up.
     *
     * DISPLAY NAME:
     * We trim whitespace and only send if not empty.
     * Firebase's updateProfile stores this in the User object.
     */
    try {
      await dispatch(
        signUp({
          email,
          password,
          displayName: displayName.trim() || undefined,
        })
      ).unwrap();
      // Success! Navigate to home screen
      router.replace('/home');
    } catch {
      // Error is already set in Redux state by the rejected action
      // The UI will display it automatically via authError
    }
  };

  /**
   * Navigation Handler: Sign In
   *
   * For users who already have an account.
   * Uses replace() instead of push() to avoid stacking auth screens.
   *
   * WHY REPLACE?
   * If user goes: Welcome → Sign Up → Sign In
   * With push(): Back would go to Sign Up (confusing)
   * With replace(): Back goes to Welcome (expected)
   */
  const handleSignIn = () => {
    router.replace('/sign-in');
  };

  /**
   * Determine which error to show
   *
   * Priority: validation errors over auth errors
   * (Same logic as SignInScreen)
   */
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
         * Essential for sign-up because:
         * 1. More fields = more content than sign-in
         * 2. Keyboard covers more of the screen
         * 3. Users need to scroll to see all fields
         * 4. Error messages add to content height
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
                Create Account
              </Text>
              <Text variant="lead">
                Join us and start your learning journey
              </Text>
            </View>

            {/**
             * Form Section
             *
             * Four inputs:
             * 1. Display Name (optional) - personalizes the experience
             * 2. Email (required) - becomes the account identifier
             * 3. Password (required) - at least 6 characters
             * 4. Confirm Password (required) - must match password
             *
             * Using gap-4 for consistent 16px spacing between inputs.
             */}
            <View className="gap-4">
              {/**
               * Display Name Input (Optional)
               *
               * This is optional but encouraged because:
               * - Personalizes the app ("Welcome, John!")
               * - Stored in Firebase User.displayName
               * - Can be updated later via profile settings
               *
               * WHY FIRST?
               * - Friendlier onboarding (personal before technical)
               * - Optional fields often get skipped if at the bottom
               * - Shows we care about the person, not just the account
               */}
              <Input
                label="Display Name"
                placeholder="How should we call you?"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />

              {/**
               * Email Input
               *
               * Same configuration as SignInScreen:
               * - Email keyboard type
               * - No auto-capitalize (emails are lowercase)
               * - No auto-correct (don't change email addresses)
               */}
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

              {/**
               * Password Input
               *
               * Users are creating their password, so we explain requirements.
               * Firebase requires minimum 6 characters.
               *
               * SECURITY NOTE:
               * We could add more requirements (uppercase, number, special char)
               * but Firebase only enforces the 6-character minimum.
               * Additional requirements would need client-side validation.
               *
               * The Input component has built-in password visibility toggle
               * when secureTextEntry is true.
               */}
              <Input
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              {/**
               * Confirm Password Input
               *
               * Must match the password field.
               * This prevents users from locking themselves out due to typos.
               *
               * UX TIP:
               * Some apps show a checkmark when passwords match.
               * We could add this enhancement later.
               *
               * onSubmitEditing triggers form submission when user presses
               * "Done" on the keyboard - convenient for quick sign-ups.
               */}
              <Input
                label="Confirm Password"
                placeholder="Type your password again"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                onSubmitEditing={handleSignUp}
                editable={!loading}
              />
            </View>

            {/**
             * Error Message
             *
             * Shows validation or authentication errors.
             * Common sign-up errors:
             * - "An account with this email already exists"
             * - "Password is too weak"
             * - "Passwords do not match" (validation)
             *
             * Styling matches sign-in screen:
             * - bg-destructive: Soft red background (#FEE2E2)
             * - text-destructive-foreground: Dark red text (#B91C1C)
             * - rounded-lg: 12px border radius for modern look
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
           * Create Account Button
           *
           * Primary action button.
           * Features:
           * - Shows loading spinner during account creation (isLoading prop)
           * - Disabled when form is invalid OR loading is in progress
           * - Full width (default button behavior)
           * - Uses primary variant (sage green)
           *
           * Button appears at 50% opacity when disabled, providing
           * visual feedback that more input is needed.
           */}
          <Button
            onPress={handleSignUp}
            isLoading={loading}
            disabled={loading || !isFormValid}
            className="mb-3"
          >
            Create Account
          </Button>

          {/**
           * Footer Section
           *
           * Sign in prompt for users who already have an account.
           * Common pattern: "Already have an account? Sign in"
           * Grouped with button for cohesive bottom action area.
           */}
          <View className="flex-row justify-center items-center py-2">
            <Text variant="muted">Already have an account? </Text>
            <Pressable onPress={handleSignIn}>
              <Text className="text-primary font-semibold">Sign In</Text>
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
 * 1. SIGN UP VS SIGN IN DIFFERENCES
 *
 *    Sign In:
 *    - Two fields (email, password)
 *    - User already has an account
 *    - Quick, simple form
 *
 *    Sign Up:
 *    - Four fields (display name, email, password, confirm password)
 *    - User is new, needs guidance
 *    - More validation (password confirmation)
 *    - Optional fields (display name)
 *
 * 2. PASSWORD CONFIRMATION PATTERN
 *
 *    WHY: Users can't see their password while typing (dots/asterisks).
 *    A typo in the password would lock them out of their new account.
 *
 *    HOW: Compare password === confirmPassword before submitting.
 *    This is client-side only - Firebase doesn't know about confirmPassword.
 *
 * 3. OPTIONAL VS REQUIRED FIELDS
 *
 *    Required (Firebase Auth needs these):
 *    - email: Account identifier
 *    - password: Authentication credential
 *
 *    Optional (nice to have):
 *    - displayName: Personalization, stored in Firebase User
 *
 *    For truly optional fields, don't show validation errors if empty.
 *    Our displayName.trim() || undefined passes undefined if empty.
 *
 * 4. FIREBASE SIGN UP BEHAVIOR
 *
 *    After successful createUserWithEmailAndPassword:
 *    - User is automatically signed in
 *    - onAuthStateChanged fires with the new user
 *    - Navigation happens automatically (no router.push needed)
 *
 *    This is different from some systems where:
 *    - User must verify email first
 *    - User must sign in separately after creating account
 *
 * 5. USING replace() VS push()
 *
 *    router.push('/sign-in'): Adds to navigation stack
 *    - Back button goes to previous screen (sign-up)
 *    - Good for browsing, exploring
 *
 *    router.replace('/sign-in'): Replaces current screen
 *    - Back button skips sign-up, goes to screen before it
 *    - Good for auth flows where going "back" to sign-up is weird
 *
 * 6. FORM STATE MANAGEMENT
 *
 *    Each input has its own useState:
 *    - Individual updates (only changed field re-renders)
 *    - Clear control over each field
 *    - Easy to add field-specific validation
 *
 *    Alternative: Single state object { email, password, ... }
 *    - One setState call
 *    - But: More complex updates, entire form re-renders
 *    - For simple forms, individual useState is cleaner
 *
 * 7. ERROR MESSAGE HIERARCHY
 *
 *    We show: validationError || authError
 *
 *    This means:
 *    - Validation errors take priority (shown first)
 *    - Auth errors only show if no validation error
 *    - One error at a time (less overwhelming)
 *
 *    Alternative: Show all errors with field-level validation
 *    - More complex UI (error under each field)
 *    - Better for long forms
 *    - Overkill for our 4-field form
 *
 * 8. NEW UI COMPONENTS (from design system update)
 *
 *    We now use our custom components:
 *    - <Input> instead of custom TextInput + PasswordInput
 *    - <Button isLoading> instead of Button loading prop
 *    - <Text variant="..."> instead of styled Text
 *
 * 9. TAILWIND CLASS BENEFITS
 *
 *    - gap-4: Consistent 16px spacing between form elements
 *    - mb-6, mb-8: Clear visual sections
 *    - flex-row items-center: Easy horizontal layouts
 *    - bg-destructive, text-destructive-foreground: Semantic error colors
 *
 * 10. FORM VALIDATION UX (NEW)
 *
 *    - isFormValid computed value checks all required fields
 *    - Button disabled until form is complete and valid
 *    - Provides visual feedback (50% opacity when disabled)
 *    - Prevents unnecessary error messages from premature taps
 *    - displayName is optional, so not included in validation
 *
 * 11. BOTTOM BUTTON PATTERN (NEW)
 *
 *    - Button placed outside ScrollView
 *    - Stays at bottom of screen (ergonomic for thumb)
 *    - Moves up with keyboard (easy to tap after typing)
 *    - Common mobile UX pattern used by major apps
 *    - Footer link grouped with button for cohesive action area
 *
 * SECURITY NOTES:
 * - Never log passwords (even during debugging)
 * - Password confirmation is client-side only (Firebase never sees it)
 * - Firebase handles password hashing and storage
 * - Consider adding email verification for production apps
 *
 * NEXT STEPS:
 * - Phase 7: Add forgot-password screen
 * - Phase 8: Implement route protection based on Redux auth state
 * - Enhancement: Add password strength indicator
 * - Enhancement: Add email verification requirement
 */
