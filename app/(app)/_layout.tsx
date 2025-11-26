/**
 * App Layout - Route Group for Authenticated Screens
 *
 * This layout wraps all screens that require authentication (home, profile, etc.)
 * The (app) folder name is a "route group" - the parentheses mean this folder
 * organizes routes without adding to the URL path.
 *
 * WHAT IS A ROUTE GROUP?
 * In Expo Router, folders wrapped in parentheses like (app) are "route groups".
 * They help organize related screens without affecting the URL structure.
 *
 * For example:
 * - app/(app)/home.tsx → URL is "/home" (not "/app/home")
 * - app/(app)/profile.tsx → URL is "/profile" (not "/app/profile")
 *
 * WHY USE A ROUTE GROUP FOR APP SCREENS?
 * 1. Organization: Keep all authenticated screens together
 * 2. Shared Layout: Apply consistent styling/behavior to app screens
 * 3. Separation: Clear distinction between auth screens and app screens
 * 4. Clean URLs: Don't expose internal organization in URLs
 *
 * LAYOUT PURPOSE:
 * This layout provides:
 * - Consistent navigation structure for authenticated screens
 * - Background styling using our design system colors
 * - Stack navigation for screen transitions
 */

import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

/**
 * AppLayout Component
 *
 * Wraps all authenticated app screens with:
 * - Stack navigation for smooth transitions
 * - Consistent background styling
 * - Hidden headers (we use custom NavBar in screens)
 *
 * STACK VS TABS:
 * We use Stack navigation here because:
 * - It's simpler for learning
 * - Works well for single-screen demo (home screen)
 * - Can be converted to Tabs later when needed
 *
 * FUTURE ENHANCEMENT:
 * When you have multiple main sections (Home, Profile, Settings),
 * you might want to use Tabs navigation here instead.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        /**
         * Hide Default Header
         *
         * We hide the default navigation header because:
         * - Our screens use custom NavBar component
         * - More control over styling and behavior
         * - Consistent look across the app
         */
        headerShown: false,

        /**
         * Content Style
         *
         * Sets the background color for all screens in this group.
         * Uses our design system background (#FAFAF9 - warm off-white).
         */
        contentStyle: {
          backgroundColor: colors.background,
        },

        /**
         * Animation Style
         *
         * 'default' uses platform-specific animations:
         * - iOS: Slide from right
         * - Android: Fade with slight slide
         */
        animation: 'default',
      }}
    >
      {/*
        Screen Configuration

        We could configure individual screens here with:
        <Stack.Screen name="home" options={{ ... }} />

        For now, we let each screen handle its own options.
        The Stack automatically discovers .tsx files in this folder.

        Files in this (app) folder will include:
        - home.tsx → /home (current phase)
        - profile.tsx → /profile (future)
        - settings.tsx → /settings (future)
      */}
    </Stack>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. ROUTE GROUPS SUMMARY
 *    (auth) group: Sign in, Sign up, Welcome (unauthenticated)
 *    (app) group: Home, Profile, Settings (authenticated)
 *
 *    This separation makes it clear which screens require auth.
 *
 * 2. LAYOUT HIERARCHY
 *    app/_layout.tsx (root - Redux Provider, Firebase Auth listener)
 *    └── app/(app)/_layout.tsx (this file - authenticated screens)
 *        └── app/(app)/home.tsx (individual screen)
 *
 * 3. NAVIGATION FLOW
 *    App opens → index.tsx checks auth state:
 *    - No user → Redirect to /welcome (auth group)
 *    - Has user → Redirect to /home (app group)
 *
 * 4. WHY MINIMAL LAYOUT?
 *    This layout is simple because:
 *    - We want flexibility in individual screens
 *    - Each screen can have its own header/navigation
 *    - We're keeping things simple for learning
 *
 * 5. FUTURE ENHANCEMENTS
 *    When the app grows, you might add:
 *    - Auth protection (redirect if not logged in)
 *    - Tab navigation for main sections
 *    - Drawer navigation for settings
 *    - Shared bottom navigation bar
 *
 * NEXT STEPS:
 * Now we create home.tsx with user data display and sign out button.
 */
