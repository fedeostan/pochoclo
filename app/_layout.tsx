/**
 * Root Layout Component for Expo Router
 *
 * This file is the entry point for the entire app when using Expo Router.
 * Think of it as the "wrapper" around your entire application - everything
 * your users see will be rendered inside this layout.
 *
 * WHAT IS EXPO ROUTER?
 * Expo Router brings file-based routing to React Native, similar to Next.js for web.
 * Instead of manually configuring navigation (like with React Navigation),
 * the file structure in the app/ folder automatically determines your routes.
 *
 * For example:
 * - app/index.tsx → becomes the root route "/"
 * - app/profile.tsx → becomes "/profile"
 * - app/(auth)/sign-in.tsx → becomes "/sign-in" (grouped routes)
 *
 * WHY USE A ROOT LAYOUT?
 * The root layout lets us:
 * 1. Set up global providers (like AuthContext, themes, etc.)
 * 2. Configure navigation options
 * 3. Handle loading states while the app initializes
 * 4. Set up fonts, splash screens, and other global setup
 *
 * This file will be updated in Phase 3 to include AuthProvider.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * RootLayout Component
 *
 * The Slot component from expo-router renders the currently active route.
 * For now, we're using Stack for simple stack-based navigation.
 *
 * NAVIGATION TYPES IN EXPO ROUTER:
 * - Stack: Navigate between screens with push/pop (like pages in a book)
 * - Tabs: Bottom tab navigation (like Instagram's main tabs)
 * - Drawer: Side drawer navigation (like a hamburger menu)
 *
 * We'll use Stack for our auth flow since screens transition linearly:
 * Welcome → Sign In → (authenticated) → Home
 */
export default function RootLayout() {
  /**
   * FUTURE ENHANCEMENT (Phase 3):
   * Here we'll add:
   * 1. AuthProvider wrapper for authentication state
   * 2. Loading screen while checking if user is authenticated
   * 3. Redirect logic based on auth state
   *
   * For now, we're keeping it simple to ensure Expo Router works.
   */

  return (
    <>
      {/*
        StatusBar Component

        Controls the appearance of the status bar (the top bar showing time, battery, etc.)
        - "auto" style means: dark text on light background, light text on dark background
        - This respects the user's system appearance preferences

        In React Native, you need to explicitly manage the StatusBar.
        On web, the browser handles this automatically.
      */}
      <StatusBar style="auto" />

      {/*
        Stack Navigator

        Stack provides a stack-based navigation pattern where screens are
        "pushed" onto a stack and can be "popped" off.

        Think of it like a deck of cards - you can add cards on top (push),
        and remove the top card (pop/go back).

        SCREEN OPTIONS:
        We're configuring global options for all screens in the stack:
        - headerShown: false → We'll build custom headers using our design system
        - animation: 'default' → Use platform-native animations (slide on iOS, fade on Android)

        Each individual screen can override these options if needed.
      */}
      <Stack
        screenOptions={{
          headerShown: false, // Hide default header (we'll create custom ones)
          animation: 'default', // Platform-specific navigation animations
        }}
      />
    </>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. FILE-BASED ROUTING
 *    Expo Router uses the file system to define routes. Any file in the app/
 *    folder becomes a route. This is called "file-based routing" and is
 *    inspired by frameworks like Next.js.
 *
 * 2. LAYOUTS VS SCREENS
 *    - Layouts (files named _layout.tsx) wrap multiple screens
 *    - Screens (regular .tsx files) are individual pages
 *    - Layouts persist across screen changes in their group
 *
 * 3. ROUTE GROUPS
 *    Folders wrapped in parentheses like (auth) or (app) are "route groups".
 *    They organize routes without affecting the URL path.
 *
 *    Example:
 *    app/(auth)/sign-in.tsx → URL: "/sign-in" (not "/auth/sign-in")
 *
 *    This is useful for:
 *    - Organizing related screens
 *    - Applying different layouts to different sections
 *    - Conditional rendering (show auth screens OR app screens)
 *
 * 4. NAVIGATION
 *    With Expo Router, you navigate using:
 *    - router.push('/sign-in') → Navigate to sign-in screen
 *    - router.back() → Go back to previous screen
 *    - router.replace('/home') → Replace current screen (can't go back)
 *
 *    We'll see these in action when building our auth screens.
 *
 * 5. DEEP LINKING
 *    Expo Router automatically handles deep links (URLs that open your app).
 *    This is crucial for email verification - when users click the verification
 *    link in their email, it will open your app and navigate to the right screen.
 *
 * NEXT STEPS:
 * In Phase 3, we'll wrap this layout with AuthProvider to manage authentication
 * state across the entire app. For now, this basic setup ensures Expo Router
 * is working correctly.
 */
