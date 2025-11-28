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
 * 1. Set up global providers (Redux, themes, etc.)
 * 2. Configure navigation options
 * 3. Handle loading states while the app initializes
 * 4. Set up fonts, splash screens, and other global setup
 *
 * REDUX + FIREBASE INTEGRATION:
 * We wrap the entire app with Redux Provider to make the store
 * accessible to all components. We also set up the Firebase Auth
 * listener to sync auth state changes with Redux.
 *
 * MIGRATION FROM SUPABASE TO FIREBASE:
 * The main change here is how we handle auth initialization:
 * - Supabase: Called getSession() + set up onAuthStateChange
 * - Firebase: Just set up onAuthStateChanged (it handles both!)
 *
 * Firebase's onAuthStateChanged listener fires immediately with the current
 * user (or null), so we don't need a separate initialization step.
 */

import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { store, useAppDispatch } from "../src/store";
import { setAuthState } from "../src/store/slices/authSlice";
import {
  loadPreferences,
  clearPreferences,
} from "../src/store/slices/userPreferencesSlice";

/**
 * Global CSS Import
 *
 * This imports our Tailwind CSS styles processed by NativeWind.
 * IMPORTANT: This must be imported in the root layout to make
 * Tailwind classes available throughout the entire app.
 *
 * Without this import, className props won't work!
 */
import "../src/styles/global.css";

// Import Firebase auth instance and listener function
// onAuthStateChanged: Listens for auth state changes (sign in, sign out, token refresh)
// auth: Our configured Firebase Auth instance from firebase.ts
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../src/config/firebase";

/**
 * AppInitializer Component
 *
 * This component handles auth initialization, state syncing, and
 * loading user preferences when authenticated.
 *
 * It must be INSIDE the Provider so it can use Redux hooks.
 *
 * WHY A SEPARATE COMPONENT?
 * We can't use Redux hooks (useAppDispatch) in RootLayout because
 * the Provider hasn't wrapped us yet. So we create a child component
 * that lives inside the Provider.
 *
 * FIREBASE VS SUPABASE INITIALIZATION:
 *
 * SUPABASE (before):
 * 1. dispatch(initializeAuth()) - checks for existing session
 * 2. supabase.auth.onAuthStateChange() - listens for changes
 *
 * FIREBASE (now):
 * 1. onAuthStateChanged() - does BOTH initialization AND listening!
 *    - Fires immediately with current user (or null) on subscription
 *    - Continues to fire on auth state changes
 *
 * PREFERENCES LOADING:
 * When a user is authenticated, we also need to load their preferences
 * from Firestore. This includes their onboarding status, which determines
 * whether they should see the onboarding flow or the main app.
 *
 * FLOW:
 * 1. onAuthStateChanged fires with user
 * 2. If user: dispatch loadPreferences(user.uid)
 * 3. If no user: dispatch clearPreferences()
 * 4. IndexScreen reads both auth and preferences state for routing
 */
function AppInitializer({ children }: { children: React.ReactNode }) {
  /**
   * Get dispatch function from Redux
   *
   * useAppDispatch is our typed version of useDispatch.
   * It knows about our async thunks, so TypeScript is happy.
   */
  const dispatch = useAppDispatch();

  /**
   * Set Up Firebase Auth State Listener
   *
   * useEffect runs after the component mounts.
   * We set up a single listener that handles:
   * 1. Initial auth state check (user might already be logged in)
   * 2. Ongoing auth state changes (sign in, sign out, token refresh)
   * 3. Loading user preferences when authenticated
   *
   * FIREBASE'S onAuthStateChanged BEHAVIOR:
   * - Fires IMMEDIATELY with current auth state when subscribed
   * - If user is logged in: fires with User object
   * - If user is not logged in: fires with null
   * - Continues to fire whenever auth state changes
   *
   * WHEN DOES IT FIRE?
   * - App starts (immediate callback with current state)
   * - User signs in (via signInWithEmailAndPassword, etc.)
   * - User signs out (via signOut)
   * - Token is refreshed (automatic, invisible to user)
   * - User account is deleted or disabled
   *
   * WHAT WE DO:
   * 1. Dispatch setAuthState with the user (or null)
   * 2. If user exists: Load their preferences from Firestore
   * 3. If no user: Clear preferences (prevent data leakage between users)
   *
   * ERROR HANDLING:
   * If preferences fail to load, we log the error but don't block the app.
   * The user will be routed based on fallback state (assumes not onboarded).
   * This is graceful degradation - the app remains functional.
   */
  useEffect(() => {
    /**
     * Subscribe to Auth State Changes
     *
     * onAuthStateChanged returns an unsubscribe function.
     * We call this function in the cleanup to prevent memory leaks.
     *
     * The callback receives:
     * - user: Firebase User object if signed in
     * - user: null if not signed in
     */
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      /**
       * Auth State Changed
       *
       * This fires:
       * - Immediately when we subscribe (with current auth state)
       * - When user signs in
       * - When user signs out
       * - When token is refreshed
       *
       * We sync this with Redux so our UI stays up to date.
       *
       * The 'user' parameter is:
       * - Firebase User object: User is signed in
       * - null: User is not signed in
       *
       * setAuthState will:
       * - Update state.auth.user with the user (or null)
       * - Set state.auth.initialized to true
       */
      dispatch(setAuthState({ user }));

      /**
       * Load or Clear Preferences Based on Auth State
       *
       * When user is authenticated:
       * - Load their preferences from Firestore
       * - This includes onboardingCompleted status for routing
       * - Categories and dailyLearningMinutes for personalization
       *
       * When user is not authenticated:
       * - Clear preferences from Redux
       * - This prevents data from one user showing for another
       * - Reset to initial state for fresh start
       *
       * WHY IS THIS IMPORTANT?
       * Without loading preferences:
       * - IndexScreen wouldn't know if user completed onboarding
       * - Every user would be sent to onboarding, even returning users
       *
       * Without clearing preferences:
       * - If User A logs out and User B logs in
       * - User B might see User A's categories temporarily
       *
       * ERROR HANDLING:
       * If loadPreferences fails (network error, permissions, etc.):
       * - The error is stored in Redux state
       * - The app continues with fallback behavior (onboardingCompleted: false)
       * - This means returning users might see onboarding again
       * - But the app doesn't crash - graceful degradation
       *
       * We use try/catch with .unwrap() to handle errors explicitly
       * rather than letting them fail silently.
       */
      if (user) {
        // User is authenticated - load their preferences
        try {
          await dispatch(loadPreferences(user.uid)).unwrap();
        } catch (error) {
          // Log error but don't crash - graceful degradation
          // The error is already stored in Redux state by the rejected handler
          // The user will be routed based on fallback state (onboardingCompleted: false)
          console.error(
            'Failed to load user preferences:',
            error,
            '\nUser may see onboarding flow again. This is a temporary issue.'
          );
        }
      } else {
        // User signed out - clear preferences
        dispatch(clearPreferences());
      }
    });

    /**
     * Cleanup Function
     *
     * When the component unmounts (which shouldn't happen for root layout),
     * we unsubscribe from the auth listener to prevent memory leaks.
     *
     * This is a React best practice: always clean up subscriptions.
     */
    return () => {
      unsubscribe();
    };
  }, [dispatch]); // dispatch is stable, but ESLint wants it listed

  // Render children (the navigation stack)
  return <>{children}</>;
}

/**
 * RootLayout Component
 *
 * The main layout that wraps the entire app.
 * Sets up:
 * 1. Redux Provider (global state)
 * 2. AppInitializer (auth setup with Firebase)
 * 3. Stack navigator (navigation)
 *
 * COMPONENT HIERARCHY:
 * GestureHandlerRootView (gesture handling for bottom sheets)
 *   └── SafeAreaProvider (safe area insets)
 *         └── Provider (Redux store)
 *               └── AppInitializer (Firebase auth listener)
 *                     └── Stack (navigation)
 *                           └── Screens
 */
export default function RootLayout() {
  return (
    /**
     * GestureHandlerRootView
     *
     * This wrapper is REQUIRED for libraries that use react-native-gesture-handler,
     * most notably @gorhom/bottom-sheet which we use for ImagePickerSheet.
     *
     * WHY IS THIS NEEDED?
     * react-native-gesture-handler provides custom gesture handling that's
     * more performant than React Native's built-in gesture system. However,
     * it requires a root view to attach its gesture recognizers.
     *
     * WITHOUT GestureHandlerRootView:
     * - BottomSheet and other gesture-based components won't work
     * - You'll see: "GestureDetector must be used as a descendant of GestureHandlerRootView"
     *
     * WITH GestureHandlerRootView:
     * - All gesture-based libraries work correctly
     * - Swipe-to-dismiss, pan gestures, etc. are handled properly
     *
     * NOTE: style={{ flex: 1 }} is essential to make it fill the entire screen.
     */
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/**
       * SafeAreaProvider
       *
       * This provider is ESSENTIAL for proper safe area handling across the app.
       * It detects and provides inset values for:
       * - Status bar (top) on all devices
       * - Home indicator (bottom) on iPhone X+ and newer Android
       * - Android system navigation bar (bottom)
       *
       * WITHOUT SafeAreaProvider:
       * - useSafeAreaInsets() hook returns 0 for all values
       * - SafeAreaView components don't work correctly
       * - UI gets hidden behind system bars
       *
       * WITH SafeAreaProvider:
       * - All child components can access accurate inset values
       * - Tab bars, headers, and content respect system UI
       * - Works on both iOS and Android (including gesture navigation)
       */}
      <SafeAreaProvider>
      {/**
       * Redux Provider
       *
       * Provider from react-redux makes the Redux store available
       * to all child components via Context (internally).
       *
       * Any component in the tree can now use:
       * - useAppSelector: Read state from the store
       * - useAppDispatch: Dispatch actions to update state
       *
       * Without Provider, these hooks would throw an error.
       *
       * The store prop is our configured Redux store from store/index.ts.
       */}
      <Provider store={store}>
        {/*
          AppInitializer handles Firebase auth setup.
          Must be inside Provider to use Redux hooks.
        */}
        <AppInitializer>
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
            Root View with Background Color

            This View wraps the entire navigation stack and sets the background color
            for the entire app, including the status bar area (top) and home indicator
            area (bottom) on iOS.

            WHY THIS MATTERS:
            - Without this, system areas show a default gray color
            - The background color (#FAFAF9) matches our design system's "background"
            - This creates a seamless look from edge to edge

            flex: 1 ensures this View takes up the full screen.
          */}
          <View style={{ flex: 1, backgroundColor: "#FAFAF9" }}>
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
              - contentStyle: Sets the background color for screen content

              Each individual screen can override these options if needed.
            */}
            <Stack
              screenOptions={{
                headerShown: false, // Hide default header (we'll create custom ones)
                animation: "default", // Platform-specific navigation animations
                contentStyle: { backgroundColor: "#FAFAF9" }, // Match our background color
              }}
            />
          </View>
        </AppInitializer>
      </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. REDUX PROVIDER PATTERN
 *    Provider wraps the app and makes the store available via React Context.
 *    This is similar to how AuthContext.Provider worked, but:
 *    - Redux Provider is from react-redux
 *    - It provides the entire store, not just auth
 *    - Components use useSelector/useDispatch instead of useContext
 *
 * 2. INITIALIZER PATTERN
 *    We need a separate component (AppInitializer) because:
 *    - RootLayout renders Provider
 *    - Components INSIDE Provider can use Redux hooks
 *    - Components OUTSIDE Provider cannot
 *    - So we put setup logic in a child component
 *
 * 3. FIREBASE AUTH LISTENER (onAuthStateChanged)
 *    This is the heart of Firebase auth integration:
 *
 *    - SINGLE LISTENER: Unlike Supabase where we needed getSession() for
 *      initialization and onAuthStateChange for updates, Firebase does both
 *      with onAuthStateChanged.
 *
 *    - IMMEDIATE CALLBACK: The callback fires immediately when subscribed,
 *      giving us the current auth state. This replaces initializeAuth thunk!
 *
 *    - AUTOMATIC TOKEN REFRESH: Firebase handles token refresh internally.
 *      We don't need to configure or think about it.
 *
 *    - NO SESSION OBJECT: Firebase doesn't expose sessions like Supabase.
 *      Tokens are managed internally. We just work with the User object.
 *
 * 4. CLEANUP FUNCTIONS
 *    useEffect can return a cleanup function that runs when:
 *    - Component unmounts
 *    - Before re-running effect (if dependencies change)
 *
 *    unsubscribe() prevents memory leaks.
 *
 * 5. FILE-BASED ROUTING
 *    Expo Router uses the file system to define routes. Any file in the app/
 *    folder becomes a route. This is called "file-based routing" and is
 *    inspired by frameworks like Next.js.
 *
 * 6. LAYOUTS VS SCREENS
 *    - Layouts (files named _layout.tsx) wrap multiple screens
 *    - Screens (regular .tsx files) are individual pages
 *    - Layouts persist across screen changes in their group
 *
 * 7. ROUTE GROUPS
 *    Folders wrapped in parentheses like (auth) or (app) are "route groups".
 *    They organize routes without affecting the URL path.
 *
 *    Example:
 *    app/(auth)/sign-in.tsx → URL: "/sign-in" (not "/auth/sign-in")
 *
 * 8. MIGRATION SUMMARY: SUPABASE → FIREBASE
 *
 *    BEFORE (Supabase):
 *    ```
 *    import { supabase } from '../src/config/supabase';
 *    import { initializeAuth, setAuthState } from '../src/store/slices/authSlice';
 *
 *    useEffect(() => {
 *      dispatch(initializeAuth());
 *
 *      const { data: { subscription } } = supabase.auth.onAuthStateChange(
 *        (_event, session) => {
 *          dispatch(setAuthState({
 *            user: session?.user ?? null,
 *            session: session,
 *          }));
 *        }
 *      );
 *
 *      return () => subscription.unsubscribe();
 *    }, [dispatch]);
 *    ```
 *
 *    AFTER (Firebase):
 *    ```
 *    import { onAuthStateChanged } from 'firebase/auth';
 *    import { auth } from '../src/config/firebase';
 *    import { setAuthState } from '../src/store/slices/authSlice';
 *
 *    useEffect(() => {
 *      const unsubscribe = onAuthStateChanged(auth, (user) => {
 *        dispatch(setAuthState({ user }));
 *      });
 *
 *      return () => unsubscribe();
 *    }, [dispatch]);
 *    ```
 *
 *    KEY DIFFERENCES:
 *    - No initializeAuth dispatch needed (listener handles init)
 *    - No session object (just user)
 *    - Simpler unsubscribe pattern
 *    - Import auth instance + onAuthStateChanged function
 */
