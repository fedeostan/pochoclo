/**
 * Root Index Screen
 *
 * This is the entry point of the app (route "/").
 * It handles initial routing based on authentication state.
 *
 * In Expo Router, app/index.tsx is the root route that users see first.
 * From here, we redirect to the appropriate screen based on whether
 * the user is authenticated or not.
 *
 * ROUTING LOGIC:
 * For Phase 5, we're building the auth screens, so we redirect everyone
 * to the welcome screen for testing purposes.
 *
 * In Phase 8 (Route Protection), this will be updated to:
 * - Check authentication state (useAuth hook)
 * - Redirect to /home if authenticated
 * - Redirect to /welcome if not authenticated
 *
 * This pattern is called "conditional routing" or "protected routes".
 *
 * WHY USE REDIRECT?
 * The Redirect component from expo-router immediately navigates to
 * another screen. This prevents showing a blank or loading screen
 * and ensures users always see the correct screen for their state.
 */

import { Redirect } from 'expo-router';
// TODO: Phase 8 - Import useAuth to check authentication state
// import { useAuth } from '../src/context/AuthContext';

/**
 * IndexScreen Component
 *
 * CURRENT BEHAVIOR (Phase 5):
 * Always redirects to /welcome for testing auth screens.
 *
 * FUTURE BEHAVIOR (Phase 8):
 * Will check auth state and redirect accordingly:
 * - Authenticated users → /home
 * - Unauthenticated users → /welcome
 *
 * REDIRECT COMPONENT:
 * Redirect is a special component from expo-router that:
 * - Immediately navigates to the specified route
 * - Replaces the current screen (can't go back to index)
 * - Works during initial render (no flash of wrong screen)
 *
 * The href prop specifies where to redirect to.
 */
export default function IndexScreen() {
  /**
   * Phase 8 Implementation Plan:
   *
   * const { user, isLoading } = useAuth();
   *
   * // Show loading screen while checking auth state
   * if (isLoading) {
   *   return <LoadingScreen />;
   * }
   *
   * // Redirect based on authentication state
   * if (user) {
   *   return <Redirect href="/home" />;
   * } else {
   *   return <Redirect href="/welcome" />;
   * }
   */

  // For Phase 5: Always redirect to welcome screen
  return <Redirect href="/welcome" />;
}

/**
 * LEARNING NOTES:
 *
 * 1. REDIRECT VS ROUTER.PUSH
 *    Two ways to navigate in Expo Router:
 *
 *    Redirect component (declarative):
 *    - Used in render: return <Redirect href="/welcome" />
 *    - Replaces current screen (can't go back)
 *    - Best for initial routing decisions
 *    - Works during component render
 *
 *    router.push (imperative):
 *    - Used in functions: router.push('/welcome')
 *    - Adds to navigation stack (can go back)
 *    - Best for user-initiated navigation
 *    - Called in response to events
 *
 * 2. ROUTE PROTECTION PATTERN
 *    This is a common pattern in web and mobile apps:
 *    - Root screen checks authentication
 *    - Redirects to appropriate section (auth or app)
 *    - Prevents unauthorized access
 *    - Creates seamless UX (no manual navigation needed)
 *
 * 3. LOADING STATES
 *    When checking auth state (Phase 8), always handle loading:
 *    - Auth state takes time to initialize (async)
 *    - Show loading screen during initialization
 *    - Prevents redirect flashing (welcome → home)
 *    - Better UX (user sees intentional loading)
 *
 * 4. WHY NOT USE ROUTER.PUSH HERE?
 *    router.push can only be called in response to events or in useEffect.
 *    Redirect works during render, making it perfect for this use case.
 *
 * 5. EXPO ROUTER FILE-BASED ROUTING
 *    File structure creates routes automatically:
 *    - app/index.tsx → "/"
 *    - app/(auth)/welcome.tsx → "/welcome"
 *    - app/(auth)/sign-in.tsx → "/sign-in"
 *    - app/(app)/home.tsx → "/home" (Phase 8)
 *
 * 6. ROUTE GROUPS
 *    Folders with parentheses like (auth) and (app) are route groups:
 *    - Organize files without affecting URLs
 *    - Can have different layouts
 *    - Useful for conditional rendering
 *
 * 7. AUTHENTICATION FLOW
 *    Complete flow across all phases:
 *    - User opens app → index.tsx
 *    - Not authenticated → Redirect to /welcome
 *    - User taps Sign In → /sign-in
 *    - User enters credentials → AuthContext.signIn()
 *    - Auth state updates → Redirect to /home
 *    - User closes/reopens app → Session persists → /home
 *
 * PHASE PROGRESSION:
 * - Phase 5 (Current): Build auth screens, always show /welcome
 * - Phase 6: Add sign-up screen
 * - Phase 7: Add password recovery
 * - Phase 8: Implement proper auth-based routing here
 *
 * TESTING PHASE 5:
 * To test the auth screens we just built:
 * 1. App opens → Redirects to /welcome
 * 2. Tap "Sign In" → Navigate to /sign-in
 * 3. Tap "Back" → Return to /welcome
 * 4. Enter credentials → Test form validation
 * 5. Submit form → Test auth integration (Phase 4)
 */
