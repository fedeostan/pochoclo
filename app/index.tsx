/**
 * Root Index Screen
 *
 * This is the entry point of the app (route "/").
 * It handles initial routing based on authentication state AND onboarding
 * status from Redux.
 *
 * In Expo Router, app/index.tsx is the root route that users see first.
 * From here, we redirect to the appropriate screen based on:
 * 1. Authentication status (user logged in?)
 * 2. Onboarding status (has user completed onboarding?)
 *
 * ROUTING LOGIC:
 * - Not initialized yet → Show loading (prevent flash)
 * - Not authenticated → /welcome (auth flow)
 * - Authenticated, onboarding incomplete → /onboarding/category-selection
 * - Authenticated, onboarding complete → /home (main app)
 *
 * REDUX INTEGRATION:
 * This screen reads from two Redux slices:
 * - auth: For user authentication state
 * - userPreferences: For onboarding completion status
 *
 * This pattern is called "conditional routing" or "protected routes".
 *
 * WHY CHECK ONBOARDING?
 * New users need to complete onboarding to:
 * - Select learning categories (personalized content)
 * - Set daily learning time (pacing)
 *
 * We check onboardingCompleted to ensure new users go through this flow
 * while returning users skip directly to the home screen.
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
 * 3. If initialized and no user → Redirect to /welcome
 * 4. If initialized and user exists but preferences loading → Show loading
 * 5. If initialized and user exists but onboarding incomplete → Redirect to /onboarding
 * 6. If initialized and user exists and onboarding complete → Redirect to /home
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
 * - Preferences are loaded (to check onboardingCompleted)
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
   */
  const { user, initialized } = useAppSelector((state) => state.auth);

  /**
   * Read Preferences State from Redux
   *
   * We need to know:
   * - onboardingCompleted: Has the user finished onboarding?
   * - loading: Are preferences still being fetched from Firestore?
   *
   * We check loading because after auth initializes, we load preferences.
   * We need to wait for that to complete before routing.
   */
  const { onboardingCompleted, loading: preferencesLoading } = useAppSelector(
    (state) => state.userPreferences
  );

  /**
   * Loading State - Auth Not Initialized
   *
   * If auth hasn't been initialized yet, show a loading indicator.
   * This prevents the "flash" problem described above.
   */
  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  /**
   * Not Authenticated → Welcome Screen
   *
   * If no user is logged in, go to the auth flow.
   */
  if (!user) {
    return <Redirect href="/welcome" />;
  }

  /**
   * Loading State - Preferences Loading
   *
   * User is authenticated but preferences are still being fetched.
   * We need to wait to know if onboarding is complete.
   *
   * This loading is typically brief (< 200ms) but necessary
   * to avoid incorrectly routing to onboarding for returning users.
   */
  if (preferencesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  /**
   * Authenticated, Onboarding Not Completed → Onboarding Flow
   *
   * New users (or users who didn't finish onboarding) go here.
   * They need to:
   * 1. Select learning categories
   * 2. Set daily learning time
   *
   * After completing onboarding, they'll be redirected to /home.
   */
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding/category-selection" />;
  }

  /**
   * Authenticated, Onboarding Complete → Home Screen
   *
   * Returning users who have completed onboarding go directly to the app.
   */
  return <Redirect href="/home" />;
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
 *    - Root screen checks authentication AND onboarding status
 *    - Redirects to appropriate section (auth, onboarding, or app)
 *    - Prevents unauthorized access
 *    - Creates seamless UX (no manual navigation needed)
 *
 * 3. LOADING STATES
 *    We handle TWO loading states:
 *    - Auth initialization: Firebase checking for existing session
 *    - Preferences loading: Fetching onboarding status from Firestore
 *
 *    Both must complete before we can route correctly.
 *    This prevents flash (onboarding → home for returning users).
 *
 * 4. ONBOARDING FLOW
 *
 *    New User:
 *    1. Sign up/Sign in → auth initializes
 *    2. loadPreferences → onboardingCompleted: false
 *    3. Redirect to /onboarding/category-selection
 *    4. User completes onboarding → savePreferences
 *    5. onboardingCompleted: true → Redirect to /home
 *
 *    Returning User:
 *    1. App opens → auth initializes (user found)
 *    2. loadPreferences → onboardingCompleted: true
 *    3. Redirect directly to /home
 *
 * 5. EXPO ROUTER FILE-BASED ROUTING
 *    File structure creates routes automatically:
 *    - app/index.tsx → "/"
 *    - app/(auth)/welcome.tsx → "/welcome"
 *    - app/(auth)/sign-in.tsx → "/sign-in"
 *    - app/(auth)/onboarding/category-selection.tsx → "/onboarding/category-selection"
 *    - app/(auth)/onboarding/time-selection.tsx → "/onboarding/time-selection"
 *    - app/(app)/home.tsx → "/home"
 *
 * 6. READING FROM MULTIPLE SLICES
 *
 *    We read from two Redux slices:
 *    const { user, initialized } = useAppSelector(state => state.auth);
 *    const { onboardingCompleted, loading } = useAppSelector(state => state.userPreferences);
 *
 *    The component re-renders when EITHER slice changes.
 *    This ensures routing is always up-to-date.
 *
 * 7. INITIALIZATION SEQUENCE
 *
 *    App Start:
 *    1. RootLayout renders with Provider
 *    2. AppInitializer sets up onAuthStateChanged listener
 *    3. Firebase fires callback with current user (or null)
 *    4. If user exists, AppInitializer dispatches loadPreferences
 *    5. IndexScreen waits for both auth.initialized AND !preferencesLoading
 *    6. Finally, redirect to appropriate screen
 *
 * TESTING:
 * To test the complete flow:
 * 1. New user: Sign up → Goes to onboarding → Complete → Goes to home
 * 2. Returning user: Open app → Goes directly to home (skips onboarding)
 * 3. Incomplete onboarding: Start onboarding, close app → Returns to onboarding
 * 4. Sign out and back in: Goes to home if onboarding was completed
 */
