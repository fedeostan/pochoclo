/**
 * Root Index Screen
 *
 * This is the entry point of the app (route "/").
 * It handles initial routing based on authentication state from Redux.
 *
 * In Expo Router, app/index.tsx is the root route that users see first.
 * From here, we redirect to the appropriate screen based on whether
 * the user is authenticated or not.
 *
 * REDUX INTEGRATION:
 * This screen reads auth state from Redux using useAppSelector.
 * The routing logic is:
 * - If not initialized yet → Show nothing (or loading screen)
 * - If user is authenticated → Redirect to home
 * - If user is not authenticated → Redirect to welcome
 *
 * This pattern is called "conditional routing" or "protected routes".
 *
 * WHY USE REDIRECT?
 * The Redirect component from expo-router immediately navigates to
 * another screen. This prevents showing a blank or loading screen
 * and ensures users always see the correct screen for their state.
 */

import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/store';
import { colors } from '../src/theme';

/**
 * IndexScreen Component
 *
 * ROUTING LOGIC:
 * 1. Check if auth has been initialized
 * 2. If not initialized → Show loading (prevents flash)
 * 3. If initialized and user exists → Redirect to /home
 * 4. If initialized and no user → Redirect to /welcome
 *
 * WHY CHECK INITIALIZED?
 * On app start, Redux state is:
 * - user: undefined
 * - initialized: false
 *
 * Without waiting for initialized:
 * - App sees user = undefined (falsy)
 * - Redirects to /welcome immediately
 * - Then auth initializes, finds session, user becomes defined
 * - App would need to redirect to /home
 *
 * This causes a flash: Welcome → Home
 *
 * With initialized check:
 * - App sees initialized = false
 * - Shows loading screen
 * - Auth initializes (checks AsyncStorage for session)
 * - initialized becomes true, user becomes User or null
 * - Now we redirect to correct screen
 *
 * No flash! User goes directly to the right screen.
 */
export default function IndexScreen() {
  /**
   * Read Auth State from Redux
   *
   * We need two pieces of state:
   * - user: Is someone logged in?
   * - initialized: Has the auth check completed?
   *
   * useAppSelector is our typed hook that knows about RootState.
   * TypeScript knows:
   * - user is User | null | undefined
   * - initialized is boolean
   */
  const { user, initialized } = useAppSelector((state) => state.auth);

  /**
   * Loading State
   *
   * If auth hasn't been initialized yet, show a loading indicator.
   * This prevents the "flash" problem described above.
   *
   * This loading screen is very brief (usually < 100ms) because:
   * - AsyncStorage reads are fast
   * - If no session, initialized = true quickly
   * - If session exists, initialized = true with user data
   *
   * FUTURE ENHANCEMENT:
   * You could replace this with a branded splash screen
   * or animation for a more polished experience.
   */
  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  /**
   * Redirect Based on Auth State
   *
   * Now that we know the auth state for sure:
   * - user exists → User is logged in → Go to home
   * - user is null → User is not logged in → Go to welcome
   *
   * REDIRECT COMPONENT:
   * Redirect is a special component from expo-router that:
   * - Immediately navigates to the specified route
   * - Replaces the current screen (can't go back to index)
   * - Works during initial render (no flash of wrong screen)
   */
  if (user) {
    /**
     * User is Authenticated
     *
     * Redirect to the main app (home screen).
     * The home screen will show the authenticated user experience.
     *
     * The /home route is defined in app/(app)/home.tsx.
     * It displays:
     * - User profile data from Firebase Auth
     * - Sign out button to test the auth flow
     */
    return <Redirect href="/home" />;
  }

  /**
   * User is Not Authenticated
   *
   * Redirect to the welcome screen to start the auth flow.
   */
  return <Redirect href="/welcome" />;
}

/**
 * Styles for Index Screen
 *
 * Only needed for the loading state.
 */
const styles = StyleSheet.create({
  /**
   * Loading Container
   *
   * Centers the loading indicator on screen.
   * Uses the app's background color for consistency.
   */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

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
 *    Always handle the loading/initializing state:
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
 * 7. AUTHENTICATION FLOW WITH REDUX
 *
 *    App Start:
 *    1. RootLayout renders
 *    2. Provider wraps app
 *    3. AppInitializer dispatches initializeAuth()
 *    4. Redux updates: initialized = true, user = User | null
 *
 *    IndexScreen:
 *    1. Reads { user, initialized } from Redux
 *    2. If not initialized → Show loading
 *    3. If initialized → Redirect based on user
 *
 *    Sign In:
 *    1. User enters credentials on /sign-in
 *    2. dispatch(signIn({ email, password }))
 *    3. On success: Redux updates user
 *    4. onAuthStateChange fires → setAuthState()
 *    5. Any component watching user re-renders
 *
 * 8. SELECTOR USAGE
 *
 *    We use useAppSelector to read from Redux:
 *    const { user, initialized } = useAppSelector(state => state.auth);
 *
 *    This component re-renders when auth state changes.
 *    After successful sign-in, user changes, and we redirect to home.
 *
 * 9. COMPARING TO CONTEXT APPROACH
 *
 *    Before (Context):
 *    const { user, initialized } = useAuth();
 *
 *    After (Redux):
 *    const { user, initialized } = useAppSelector(state => state.auth);
 *
 *    Very similar! The main difference is:
 *    - Context: State managed in AuthProvider component
 *    - Redux: State managed in global store
 *    - Redux: DevTools show state changes
 *    - Redux: Easier to add more slices (user profile, settings, etc.)
 *
 * PHASE PROGRESSION:
 * - Phase 5: Build auth screens, auth-based routing ✓
 * - Phase 6: Add sign-up screen ✓
 * - Phase 7: Add password recovery (future)
 * - Phase 8: Implement home screen at /home route ✓
 *
 * TESTING:
 * To test the auth flow:
 * 1. App opens → Loading briefly → Redirects to /welcome (if not logged in)
 * 2. Sign in with valid credentials → Redirects to /home
 * 3. Home screen shows user data (email, displayName, uid, etc.)
 * 4. Tap Sign Out → Redirects back to /welcome
 * 5. Close and reopen app → Should stay logged in (session persisted)
 */
