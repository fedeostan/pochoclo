/**
 * Authentication Layout
 *
 * This layout wraps all authentication screens (welcome, sign-in, sign-up, etc.)
 * The (auth) folder name is a "route group" - the parentheses mean this folder
 * organizes routes without adding to the URL path.
 *
 * WHAT IS A ROUTE GROUP?
 * In Expo Router, folders wrapped in parentheses like (auth) are "route groups".
 * They help organize related screens without affecting the URL structure.
 *
 * For example:
 * - app/(auth)/sign-in.tsx → URL is "/sign-in" (not "/auth/sign-in")
 * - app/(auth)/sign-up.tsx → URL is "/sign-up" (not "/auth/sign-up")
 *
 * WHY USE A ROUTE GROUP FOR AUTH?
 * 1. Organization: Keep all auth screens together
 * 2. Shared Layout: Apply consistent styling/behavior to auth screens
 * 3. Conditional Rendering: Easy to show/hide entire auth section based on state
 * 4. Clean URLs: Don't expose internal organization in URLs
 *
 * LAYOUT PURPOSE:
 * This layout provides:
 * - Consistent keyboard handling for auth forms
 * - Shared styling (safe area, background)
 * - Navigation configuration for auth screens
 * - Dismissable keyboard when tapping outside inputs
 */

import { Stack } from 'expo-router';
import { TouchableWithoutFeedback, Keyboard, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';

/**
 * AuthLayout Component
 *
 * Wraps all authentication screens with:
 * - Safe area handling (avoids notches, status bar)
 * - Keyboard dismissal (tap outside to close keyboard)
 * - Consistent navigation styling
 *
 * SAFE AREA:
 * SafeAreaView ensures content doesn't overlap with:
 * - iPhone notch/Dynamic Island
 * - Status bar
 * - Home indicator
 * - Rounded screen corners
 *
 * Without SafeAreaView, content might be cut off or hidden.
 */
export default function AuthLayout() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/*
        TouchableWithoutFeedback for Keyboard Dismissal

        When users tap outside of a TextInput, we want the keyboard to close.
        This is a common UX pattern in mobile apps.

        TouchableWithoutFeedback doesn't have any visual feedback (unlike Pressable),
        making it perfect for this "tap anywhere to dismiss" pattern.

        onPress={Keyboard.dismiss} tells React Native to close the keyboard
        when the user taps outside of any input field.
      */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {/*
          Stack Navigator for Auth Screens

          Stack navigation means screens are stacked like cards:
          - Push a screen: add it on top
          - Pop a screen: remove the top one (go back)

          This is perfect for auth flow:
          Welcome → Sign In → Sign Up → Password Recovery

          Users can always go back to the previous screen.
        */}
        <Stack
          screenOptions={{
            // Hide the default header - we'll create custom headers in each screen
            headerShown: false,

            // Content style applies to the screen content area
            contentStyle: {
              backgroundColor: colors.background,
            },

            // Animation style for screen transitions
            // 'default' uses platform-specific animations:
            // - iOS: Slide from right
            // - Android: Fade + slight slide
            animation: 'default',

            // Presentation style (how screens appear)
            // 'card' means screens slide in as cards (standard behavior)
            presentation: 'card',
          }}
        >
          {/*
            Screen Configuration

            We could configure individual screens here, but we're letting
            each screen file handle its own options.

            The Stack component automatically discovers all .tsx files
            in this folder and creates routes for them.

            Files in this (auth) folder:
            - welcome.tsx → /welcome
            - sign-in.tsx → /sign-in
            - sign-up.tsx → /sign-up (Phase 6)
            - forgot-password.tsx → /forgot-password (Phase 7)
          */}
        </Stack>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

/**
 * Styles for Auth Layout
 *
 * DESIGN DECISIONS:
 * - flex: 1 ensures the layout takes up the full screen
 * - backgroundColor matches our design system for consistency
 */
const styles = StyleSheet.create({
  container: {
    flex: 1, // Take up full screen height
    backgroundColor: colors.background, // Use design system color
  },
});

/**
 * LEARNING NOTES:
 *
 * 1. ROUTE GROUPS VS REGULAR FOLDERS
 *    - (auth) folder: Groups routes, doesn't affect URLs
 *    - auth folder: Would make URLs like "/auth/sign-in"
 *    Use route groups when you want organization without URL nesting
 *
 * 2. LAYOUT HIERARCHY
 *    Layouts can be nested. Here's our structure:
 *    app/_layout.tsx (root, wraps entire app)
 *    └── app/(auth)/_layout.tsx (auth-specific layout)
 *        └── app/(auth)/sign-in.tsx (individual auth screen)
 *
 * 3. KEYBOARD HANDLING
 *    On mobile, the keyboard takes up screen space and can hide inputs.
 *    Good UX patterns:
 *    - Dismiss keyboard when tapping outside (we do this here)
 *    - Scroll content when keyboard appears (handled by KeyboardAwareScrollView in screens)
 *    - Submit forms when pressing "Return" key (handled in form screens)
 *
 * 4. SAFE AREA EDGES
 *    edges={['top', 'bottom']} means:
 *    - Add padding at top (for status bar/notch)
 *    - Add padding at bottom (for home indicator)
 *    - Don't add padding on left/right (we want edge-to-edge content)
 *
 * 5. STACK VS OTHER NAVIGATORS
 *    Stack is one of several navigation patterns:
 *    - Stack: Linear flow (auth, onboarding, settings)
 *    - Tabs: Parallel sections (home, search, profile)
 *    - Drawer: Side menu (less common in modern apps)
 *
 * 6. WHY SEPARATE AUTH LAYOUT?
 *    Having a dedicated auth layout lets us:
 *    - Apply auth-specific styling consistently
 *    - Handle keyboard behavior for all auth screens
 *    - Easy to add auth-specific features later (e.g., skip button, progress indicator)
 *    - Clean separation between authenticated and unauthenticated UI
 *
 * NEXT STEPS:
 * Now we'll create individual auth screens (welcome, sign-in, sign-up)
 * that live inside this layout and inherit its styling and behavior.
 */
