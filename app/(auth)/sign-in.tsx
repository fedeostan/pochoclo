/**
 * Sign In Screen
 *
 * This screen allows existing users to log into their accounts using
 * email and password authentication through Supabase.
 *
 * PURPOSE:
 * The Sign In screen handles:
 * 1. Email and password input with validation
 * 2. Form submission to Supabase Auth
 * 3. Error handling and user feedback
 * 4. Loading states during authentication
 * 5. Navigation to other auth screens (sign-up, password recovery)
 *
 * USER FLOW:
 * 1. User enters email and password
 * 2. User taps "Sign In" button
 * 3. App validates input (client-side)
 * 4. App sends credentials to Supabase (server-side)
 * 5. On success: Navigate to home screen (handled by auth state)
 * 6. On error: Show error message, let user retry
 *
 * AUTHENTICATION ARCHITECTURE:
 * This screen uses AuthContext (from Phase 4) which:
 * - Manages authentication state
 * - Provides signIn() function
 * - Handles Supabase integration
 * - Automatically updates app-wide auth state on success
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, headings, body } from '../../src/theme';
import Button from '../../src/components/Button';
import TextInput from '../../src/components/TextInput';
import PasswordInput from '../../src/components/PasswordInput';
import FormErrorMessage from '../../src/components/FormErrorMessage';
import { useAuth } from '../../src/context/AuthContext';
import { validateEmail } from '../../src/utils/validation';

/**
 * SignInScreen Component
 *
 * A form-based screen that handles user authentication.
 *
 * STATE MANAGEMENT:
 * Uses local state (useState) for:
 * - Form field values (email, password)
 * - Validation errors
 * - Loading state
 *
 * Uses context (useAuth) for:
 * - Authentication functions (signIn)
 * - Global auth state
 *
 * WHY LOCAL STATE FOR FORMS?
 * Form inputs change frequently (every keystroke), and only this
 * component needs to know about them. Using local state:
 * - Prevents unnecessary re-renders in other components
 * - Keeps form logic encapsulated
 * - Makes the component easier to test and reason about
 */
export default function SignInScreen() {
  // Get signIn function from AuthContext
  // This function handles all Supabase authentication logic
  const { signIn } = useAuth();

  // Form field state
  // Each input field needs its own state to track user input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Error state
  // Stores validation or authentication errors to show to the user
  const [error, setError] = useState('');

  // Loading state
  // Shows loading indicator while authentication request is in progress
  // Prevents user from submitting form multiple times
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Form Submission Handler
   *
   * This function is called when the user taps the "Sign In" button.
   * It handles the entire authentication flow:
   * 1. Clear previous errors
   * 2. Validate input (client-side)
   * 3. Call signIn from AuthContext
   * 4. Handle success or failure
   *
   * ASYNC/AWAIT EXPLAINED:
   * Authentication involves network requests, which take time.
   * async/await lets us write asynchronous code that looks synchronous:
   *
   * Without async/await:
   * signIn(email, password).then(result => {
   *   // handle success
   * }).catch(error => {
   *   // handle error
   * });
   *
   * With async/await (cleaner, more readable):
   * try {
   *   await signIn(email, password);
   *   // handle success
   * } catch (error) {
   *   // handle error
   * }
   */
  const handleSignIn = async () => {
    // Clear any previous error messages
    setError('');

    /**
     * CLIENT-SIDE VALIDATION
     *
     * Before sending data to the server, validate it locally.
     * This provides instant feedback to users and reduces unnecessary
     * network requests.
     *
     * Why validate on client AND server?
     * - Client: Fast feedback, better UX
     * - Server: Security (never trust client), data integrity
     */

    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return; // Stop here, don't proceed with sign in
    }

    // Validate password (basic check)
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    /**
     * AUTHENTICATION REQUEST
     *
     * Now we call the signIn function from AuthContext.
     * This function:
     * 1. Sends credentials to Supabase
     * 2. Receives authentication token
     * 3. Updates global auth state
     * 4. Triggers navigation to home screen (via auth state change)
     */

    try {
      // Start loading state (shows spinner, disables button)
      setIsLoading(true);

      // Call signIn from AuthContext (async operation)
      // This will throw an error if authentication fails
      await signIn(email, password);

      /**
       * SUCCESS HANDLING
       *
       * If we reach this point, sign in was successful.
       * The AuthContext will automatically update the auth state,
       * which triggers navigation to the home screen.
       *
       * We don't need to manually navigate here because:
       * 1. AuthContext updates user state
       * 2. Root layout detects auth state change
       * 3. Root layout automatically shows home screen
       *
       * This is called "declarative navigation" - navigation happens
       * based on state, not imperative commands.
       */

      // Navigation is handled by auth state change, nothing to do here

    } catch (err) {
      /**
       * ERROR HANDLING
       *
       * If signIn throws an error, we catch it here and show it to the user.
       *
       * Common errors:
       * - Invalid email/password
       * - Network error (no internet)
       * - Server error (Supabase down)
       * - Account not confirmed (email verification pending)
       */

      // Extract error message from error object
      // err is any type, so we need to safely access the message
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred during sign in';

      // Update error state to show message to user
      setError(errorMessage);

    } finally {
      /**
       * FINALLY BLOCK
       *
       * Code in 'finally' runs whether the try succeeds or fails.
       * Perfect for cleanup operations that should always happen.
       *
       * Here, we always want to stop the loading state, regardless
       * of whether sign in succeeded or failed.
       */
      setIsLoading(false);
    }
  };

  /**
   * Navigation Handler: Go Back
   *
   * Returns to the previous screen (Welcome screen).
   * Uses router.back() which pops the current screen off the stack.
   */
  const handleGoBack = () => {
    router.back();
  };

  /**
   * Navigation Handler: Forgot Password
   *
   * This will navigate to the password recovery screen in Phase 7.
   * For now, it's a placeholder.
   */
  const handleForgotPassword = () => {
    // TODO: Phase 7 - Navigate to forgot-password screen
    router.push('/forgot-password');
  };

  /**
   * Navigation Handler: Create Account
   *
   * Navigates to the sign-up screen (Phase 6).
   */
  const handleCreateAccount = () => {
    // TODO: Phase 6 - Navigate to sign-up screen
    router.push('/sign-up');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/*
        ScrollView for Content

        Wraps content in a scrollable view so:
        1. Users can scroll if keyboard covers inputs
        2. Content is accessible on small screens
        3. Form is usable regardless of keyboard state

        KEYBOARD HANDLING STRATEGY:
        - KeyboardAvoidingView: Pushes content up when keyboard appears
        - ScrollView: Allows scrolling to see all content
        - TouchableWithoutFeedback (in layout): Dismisses keyboard on tap outside

        This combination ensures form is always usable.
      */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/*
          Header Section

          Back button and screen title.
          Consistent header pattern across auth screens.
        */}
        <View style={styles.header}>
          {/* Back Button */}
          <Pressable onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>

          {/* Screen Title */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        {/*
          Form Section

          Email and password inputs with validation.
          Uses our custom form components from Phase 2.
        */}
        <View style={styles.form}>
          {/*
            Email Input

            TextInput component from our design system.
            Features:
            - Email keyboard type (shows @ and .com keys)
            - Auto-capitalize off (emails are lowercase)
            - Auto-correct off (don't correct email addresses)
            - Returns "next" (goes to password on Return key)
          */}
          <TextInput
            label="Email"
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          {/*
            Password Input

            PasswordInput component with show/hide toggle.
            Features:
            - Secure text entry (dots instead of characters)
            - Toggle button to show/hide password
            - Returns "done" (submits form on Return key)
          */}
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleSignIn}
            editable={!isLoading}
            style={styles.passwordInput}
          />

          {/*
            Forgot Password Link

            Text link to password recovery flow.
            Common UX pattern: place near password input.

            Disabled until Phase 7 when we implement password recovery.
          */}
          <Pressable
            onPress={handleForgotPassword}
            disabled={true} // TODO: Enable in Phase 7
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>

          {/*
            Error Message

            Shows validation or authentication errors.
            Only renders if there's an error to show.

            Uses FormErrorMessage component for consistent error styling.
          */}
          {error ? <FormErrorMessage error={error} /> : null}

          {/*
            Sign In Button

            Primary action button.
            Features:
            - Shows loading spinner when authenticating
            - Disabled during loading (prevents multiple submissions)
            - Full width for easy tapping
            - Large size for prominence
          */}
          <Button
            variant="primary"
            size="large"
            title="Sign In"
            onPress={handleSignIn}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            style={styles.signInButton}
          />
        </View>

        {/*
          Footer Section

          Sign up prompt for users who don't have an account yet.
          Common pattern: "Don't have an account? Sign up"
        */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable
            onPress={handleCreateAccount}
            disabled={true} // TODO: Enable in Phase 6
          >
            <Text style={styles.footerLink}>Create one</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Styles for Sign In Screen
 *
 * DESIGN PRINCIPLES:
 * 1. Generous spacing: Forms need breathing room
 * 2. Clear focus: Form is the star, minimal distractions
 * 3. Hierarchy: Title → Form → Footer
 * 4. Accessibility: Large touch targets, clear labels
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },

  // Header: Top section with back button and title
  header: {
    marginBottom: spacing.xxl,
  },

  backButton: {
    alignSelf: 'flex-start', // Align to left
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },

  backButtonText: {
    ...body.regular,
    color: colors.primary,
    fontSize: 16,
  },

  title: {
    ...headings.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  subtitle: {
    ...body.large,
    color: colors.textSecondary,
  },

  // Form: Input fields and button
  form: {
    marginBottom: spacing.xxl,
  },

  passwordInput: {
    marginTop: spacing.lg,
  },

  forgotPasswordContainer: {
    alignSelf: 'flex-end', // Align to right
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  forgotPasswordText: {
    ...body.regular,
    color: colors.textTertiary, // Less prominent (disabled)
    fontSize: 14,
  },

  signInButton: {
    marginTop: spacing.lg,
  },

  // Footer: Sign up prompt
  footer: {
    flexDirection: 'row', // Horizontal layout
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto', // Push to bottom
    paddingTop: spacing.xl,
  },

  footerText: {
    ...body.regular,
    color: colors.textSecondary,
  },

  footerLink: {
    ...body.medium, // Medium weight for emphasis
    color: colors.textTertiary, // Less prominent (disabled)
  },
});

/**
 * LEARNING NOTES:
 *
 * 1. FORM VALIDATION STRATEGY
 *    Two layers of validation:
 *    - Client-side (this screen): Fast feedback, better UX
 *    - Server-side (Supabase): Security, data integrity
 *    Never rely on client-side validation alone!
 *
 * 2. KEYBOARD HANDLING
 *    Mobile keyboard can cover inputs, frustrating users.
 *    Our solution:
 *    - KeyboardAvoidingView: Adjusts layout when keyboard appears
 *    - ScrollView: Allows scrolling to covered content
 *    - keyboardShouldPersistTaps="handled": Allows tapping buttons
 *
 * 3. LOADING STATES
 *    Always show loading state during async operations:
 *    - Provides feedback (user knows something is happening)
 *    - Prevents double submissions (button disabled during loading)
 *    - Manages expectations (user knows to wait)
 *
 * 4. ERROR HANDLING
 *    Good error handling:
 *    - Catches all errors (network, validation, auth)
 *    - Shows user-friendly messages
 *    - Allows user to retry
 *    - Logs errors for debugging (in production)
 *
 * 5. ASYNC/AWAIT vs PROMISES
 *    Both handle asynchronous code, but async/await is cleaner:
 *
 *    Promises:
 *    signIn().then(handleSuccess).catch(handleError).finally(cleanup);
 *
 *    Async/await:
 *    try { await signIn(); } catch (err) { } finally { }
 *
 * 6. CONTROLLED COMPONENTS
 *    Our inputs are "controlled" - React controls their value:
 *    - value={email} → React state is source of truth
 *    - onChangeText={setEmail} → Updates React state
 *    - No uncontrolled DOM state
 *
 *    Benefits:
 *    - Easy to validate
 *    - Easy to reset
 *    - Single source of truth
 *
 * 7. DECLARATIVE NAVIGATION
 *    We don't manually navigate on successful sign in.
 *    Instead:
 *    1. Sign in updates auth state
 *    2. Root layout observes auth state
 *    3. Root layout shows appropriate screens
 *
 *    This is "declarative" - UI is a function of state.
 *
 * 8. KEYBOARD TYPES
 *    Different keyboard types optimize input:
 *    - 'email-address': Shows @ and .com keys
 *    - 'numeric': Shows number pad
 *    - 'phone-pad': Shows phone number layout
 *    - 'default': Standard keyboard
 *
 * 9. RETURN KEY TYPES
 *    returnKeyType tells iOS what to show on Return key:
 *    - 'next': Moves to next input
 *    - 'done': Dismisses keyboard
 *    - 'go': Submits form
 *    - 'search': Shows search icon
 *
 * 10. ACCESSIBILITY
 *     Form accessibility requirements:
 *     - Labels for all inputs (we use label prop)
 *     - Clear error messages (we use FormErrorMessage)
 *     - Keyboard navigation (handled by TextInput)
 *     - Screen reader support (handled by React Native)
 *
 * SECURITY NOTES:
 * - Never log passwords (even during debugging)
 * - Always use HTTPS (Supabase enforces this)
 * - Store tokens securely (Supabase handles this)
 * - Validate on server (client validation can be bypassed)
 *
 * NEXT STEPS:
 * - Phase 6: Create sign-up screen (similar structure)
 * - Phase 7: Add forgot-password screen
 * - Phase 8: Test and refine UX
 */
