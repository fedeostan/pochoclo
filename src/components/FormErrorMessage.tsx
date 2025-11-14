/**
 * FormErrorMessage Component
 *
 * A reusable component for displaying form-level error messages.
 * Unlike the error messages shown directly under individual inputs,
 * this component is for errors that affect the entire form.
 *
 * WHEN TO USE:
 * - API errors (e.g., "Network error, please try again")
 * - Authentication errors (e.g., "Invalid email or password")
 * - Server validation errors (e.g., "Email already registered")
 * - General form submission errors
 *
 * WHY A SEPARATE COMPONENT?
 * Form-level errors are different from field-level errors:
 * - They're shown at the top of the form (not under a specific field)
 * - They're more prominent (often in a colored box)
 * - They may appear/disappear based on API responses
 * - They need to be accessible (announced to screen readers)
 *
 * This component provides consistent styling and behavior for all
 * form-level error messages throughout the app.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, radius, special, shadowSm } from '../theme';

/**
 * FormErrorMessage Props
 *
 * Simple props for controlling the error display.
 */
export interface FormErrorMessageProps {
  /**
   * The error message to display
   * When undefined or empty string, the component is hidden
   */
  error?: string;

  /**
   * Whether to show the error
   * Allows manual control over visibility even when error exists
   * Default: true (show if error exists)
   */
  visible?: boolean;
}

/**
 * FormErrorMessage Component
 *
 * Displays a form-level error message with animation and proper styling.
 * Automatically handles show/hide animations and accessibility.
 */
export default function FormErrorMessage({
  error,
  visible = true,
}: FormErrorMessageProps) {
  /**
   * Animation Value
   *
   * Controls the opacity for fade-in/fade-out animation.
   * Animated.Value is React Native's way of creating animated values:
   * - new Animated.Value(0) creates a value starting at 0
   * - We animate it to 1 (visible) or 0 (hidden)
   *
   * WHY ANIMATE?
   * - Smooth appearance prevents jarring visual changes
   * - Draws user's attention to errors
   * - Professional, polished feel
   * - Less disruptive than instant show/hide
   */
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  /**
   * Determine if error should be shown
   * Show when:
   * 1. error exists (not undefined/empty)
   * 2. visible is true
   */
  const shouldShow = !!error && visible;

  /**
   * Animation Effect
   *
   * useEffect runs when shouldShow changes.
   * We animate the opacity:
   * - shouldShow = true: Fade in (0 → 1)
   * - shouldShow = false: Fade out (1 → 0)
   *
   * ANIMATION TIMING:
   * - duration: 200ms (design system's duration.normal)
   * - useNativeDriver: true (better performance)
   *
   * useNativeDriver moves animation to native thread:
   * - Smoother 60fps animations
   * - Doesn't block JavaScript thread
   * - Better battery life
   *
   * Note: Only works for transform and opacity (which is perfect here)
   */
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: shouldShow ? 1 : 0, // Animate to 1 (show) or 0 (hide)
      duration: 200, // 200ms animation (duration.normal from design system)
      useNativeDriver: true, // Performance optimization
    }).start();
  }, [shouldShow, fadeAnim]);

  /**
   * Don't render anything if no error
   * This prevents the component from taking up space when hidden.
   *
   * We could use visibility: 'hidden' but that would reserve space.
   * By not rendering, we remove it from the layout entirely.
   */
  if (!error) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim, // Animated opacity (0 to 1)
        },
      ]}
      // Accessibility
      accessibilityRole="alert" // Screen readers announce this immediately
      accessible={true} // Ensure it's accessible
    >
      {/*
        Error Icon (Text-based)

        We use ⚠️ (warning sign) as a simple icon.
        In production, you might use:
        - Ionicons: <Ionicons name="alert-circle" />
        - Custom SVG icon
        - Design system icon component

        The icon provides quick visual recognition of an error.
      */}
      <Text style={styles.icon}>⚠️</Text>

      {/*
        Error Message Text

        The actual error message displayed to the user.
        Should be:
        - Clear and concise
        - Helpful (explain what went wrong)
        - Actionable (suggest how to fix it)

        Examples of good error messages:
        ✓ "This email is already registered. Try signing in instead."
        ✓ "Network error. Please check your connection and try again."
        ✓ "Password must be at least 8 characters."

        Examples of bad error messages:
        ✗ "Error 401"
        ✗ "Invalid input"
        ✗ "Something went wrong"
      */}
      <Text style={styles.errorText}>{error}</Text>
    </Animated.View>
  );
}

/**
 * Styles using Design System
 *
 * The error message appears in a colored box to draw attention.
 * We use:
 * - Error colors (red background, darker red text)
 * - Sufficient padding for readability
 * - Border radius for polish
 * - Shadow for depth
 * - Icon + text layout
 */
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // Icon and text side-by-side
    alignItems: 'center', // Vertically center icon with text
    backgroundColor: colors.errorLight, // Light red background
    borderLeftWidth: 4, // Accent border on left
    borderLeftColor: colors.error, // Dark red accent
    borderRadius: radius.sm, // Rounded corners (8px)
    padding: spacing.md, // Padding inside the box (16px)
    marginBottom: spacing.lg, // Space below error message (24px)
    ...shadowSm, // Subtle shadow for depth
  },
  icon: {
    fontSize: 20, // Slightly larger than text
    marginRight: spacing.sm, // Space between icon and text (12px)
  },
  errorText: {
    ...special.helper, // 12px from design system
    // Override font size to be slightly larger (14px) since this is important
    fontSize: 14,
    color: colors.error, // Dark red text
    flex: 1, // Take up remaining space (text wraps if needed)
    // Ensure text wraps properly on long messages
    flexWrap: 'wrap',
  },
});

/**
 * LEARNING NOTES:
 *
 * 1. ANIMATIONS IN REACT NATIVE
 *    React Native's Animated API provides smooth animations:
 *    - Animated.Value: The animated value
 *    - Animated.timing: Tween animation over time
 *    - Animated.spring: Spring physics animation
 *    - Animated.View/Text: Animated versions of components
 *
 *    For simple fade effects, timing is perfect.
 *    For bouncy effects, spring works better.
 *
 * 2. useNativeDriver
 *    This is a huge performance win:
 *    - JavaScript thread: Running your React code
 *    - Native thread: Running native UI updates
 *
 *    useNativeDriver moves animations to native thread:
 *    - 60fps even if JavaScript is busy
 *    - Smooth animations during API calls
 *    - Better battery life
 *
 *    Limitation: Only works for transform and opacity
 *    (Perfect for our fade-in effect!)
 *
 * 3. ACCESSIBILITY
 *    accessibilityRole="alert":
 *    - Tells screen readers this is important
 *    - Announced immediately when shown
 *    - High priority for users with visual impairments
 *
 *    accessibilityLive="assertive":
 *    - Interrupts current screen reader announcements
 *    - Ensures errors are heard immediately
 *    - Critical for form validation feedback
 *
 * 4. FORM UX BEST PRACTICES
 *    Good error messages should:
 *    - Be visible and prominent (red box, icon)
 *    - Appear close to the submit button
 *    - Persist until user takes action
 *    - Explain what went wrong
 *    - Suggest how to fix it
 *    - Be accessible to screen readers
 *
 * 5. WHEN TO SHOW FORM ERRORS
 *    Form-level errors typically shown for:
 *    - API/network errors
 *    - Authentication failures
 *    - Server-side validation (email already exists)
 *    - Rate limiting
 *    - Unexpected errors
 *
 *    Field-level errors shown for:
 *    - Format validation (invalid email)
 *    - Required fields
 *    - Length requirements
 *    - Pattern matching (password requirements)
 *
 * 6. ERROR MESSAGE PATTERNS
 *    Structure: [What went wrong] [What to do]
 *
 *    Examples:
 *    - "Invalid email or password. Please try again."
 *    - "This email is already registered. Try signing in."
 *    - "Network error. Check your connection and retry."
 *    - "Too many attempts. Please wait 5 minutes."
 *
 * 7. CONDITIONAL RENDERING
 *    We use three approaches:
 *    1. Return null (don't render at all)
 *    2. Animated opacity (fade in/out)
 *    3. visible prop (manual control)
 *
 *    This gives maximum flexibility for different use cases.
 *
 * USAGE EXAMPLES:
 *
 * Basic usage:
 * ```tsx
 * const [error, setError] = useState('');
 *
 * <FormErrorMessage error={error} />
 * ```
 *
 * With API error handling:
 * ```tsx
 * const handleSubmit = async () => {
 *   setError(''); // Clear previous errors
 *   try {
 *     await api.signIn(email, password);
 *   } catch (err) {
 *     setError('Invalid email or password. Please try again.');
 *   }
 * };
 * ```
 *
 * With manual visibility control:
 * ```tsx
 * <FormErrorMessage
 *   error="Network error occurred"
 *   visible={showError}
 * />
 * ```
 *
 * MOBILE CONSIDERATIONS:
 * - Sufficient padding for readability on small screens
 * - Text wraps properly on narrow devices
 * - High contrast (red on light red) for visibility in sunlight
 * - Icon draws attention without being distracting
 * - Animation is smooth even on lower-end devices
 */
