/**
 * Onboarding Layout
 *
 * This layout wraps the onboarding screens (category-selection, time-selection).
 * It's nested inside the (auth) route group, creating a sub-flow after authentication.
 *
 * WHAT IS THIS LAYOUT FOR?
 * ========================
 * After a user signs up or signs in for the first time, they need to complete
 * onboarding before accessing the main app. This layout provides:
 *
 * 1. Consistent navigation behavior for onboarding screens
 * 2. Shared styling across onboarding steps
 * 3. A linear flow (category → time → home)
 *
 * NAVIGATION STRUCTURE:
 * ====================
 * app/(auth)/_layout.tsx          ← Auth route group layout
 *   └── app/(auth)/onboarding/_layout.tsx  ← This file (onboarding sub-layout)
 *         ├── category-selection.tsx       ← Step 1: Choose categories
 *         └── time-selection.tsx           ← Step 2: Choose daily time
 *
 * URL PATHS:
 * - /onboarding/category-selection
 * - /onboarding/time-selection
 *
 * WHY A NESTED LAYOUT?
 * ====================
 * 1. Separation: Onboarding has different needs than sign-in/sign-up
 * 2. Navigation: Stack-based navigation with back button support
 * 3. Flexibility: Easy to add progress indicator or shared header later
 * 4. Organization: Keeps onboarding screens grouped together
 *
 * DESIGN DECISIONS:
 * =================
 * - Uses Stack navigation for linear flow
 * - Hides default header (screens have custom headers)
 * - Animation: default slide transitions
 * - Background: matches app theme (off-white)
 */

import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

/**
 * OnboardingLayout Component
 *
 * Provides the navigation container for onboarding screens.
 * Uses Expo Router's Stack for standard push/pop navigation.
 *
 * STACK NAVIGATION FOR ONBOARDING:
 * ================================
 * Stack is ideal for onboarding because:
 * - Linear flow: Step 1 → Step 2 → Home
 * - Back button support: User can return to previous step
 * - Familiar pattern: Standard mobile navigation
 *
 * Unlike the main (app) layout which uses tabs, onboarding needs
 * a sequential flow where each step builds on the previous.
 */
export default function OnboardingLayout() {
  return (
    /**
     * Stack Navigator Configuration
     *
     * screenOptions applies to ALL screens in this Stack:
     * - headerShown: false → Hide the default React Navigation header
     *   (We'll create custom headers in each screen for more control)
     *
     * - contentStyle: Sets the background color for screen content
     *   (Uses our design system's background color for consistency)
     *
     * - animation: 'default' uses platform-native animations
     *   - iOS: Slide from right
     *   - Android: Fade + slide up
     *
     * - gestureEnabled: true (default) allows swipe back on iOS
     *   User can swipe from left edge to go back to previous step
     */
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'default',
      }}
    >
      {/**
       * Screen Definitions
       *
       * While Expo Router auto-discovers screens from files,
       * we can explicitly define them here for additional configuration.
       *
       * Screen Order:
       * 1. category-selection: First step, user selects learning topics
       * 2. time-selection: Second step, user selects daily time
       *
       * After time-selection, the user is navigated to /home
       * (handled in the time-selection screen after saving preferences)
       */}
      <Stack.Screen
        name="category-selection"
        options={{
          // Title for accessibility (screen readers)
          title: 'Select Categories',
          // Disable going back from first step (no welcome screen to return to)
          // Users can still use the app's back button to cancel onboarding
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="time-selection"
        options={{
          // Title for accessibility
          title: 'Select Time',
          // Allow swipe back to category selection
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. NESTED LAYOUTS IN EXPO ROUTER
 *
 *    Expo Router supports nested layouts through file system structure:
 *
 *    app/
 *    ├── _layout.tsx           → Root layout (wraps everything)
 *    ├── (auth)/
 *    │   ├── _layout.tsx       → Auth layout (wraps auth screens)
 *    │   ├── welcome.tsx
 *    │   ├── sign-in.tsx
 *    │   └── onboarding/
 *    │       ├── _layout.tsx   → THIS FILE (wraps onboarding)
 *    │       ├── category-selection.tsx
 *    │       └── time-selection.tsx
 *    └── (app)/
 *        ├── _layout.tsx       → App layout (tabs)
 *        └── home.tsx
 *
 *    The hierarchy is: Root → (auth) → onboarding
 *    Each layout can add its own navigation, styling, providers, etc.
 *
 * 2. ROUTE GROUPS AND URLS
 *
 *    Parentheses create "route groups" that don't affect URLs:
 *    - app/(auth)/onboarding/category-selection.tsx
 *    - URL: /onboarding/category-selection (no "auth" in URL)
 *
 *    The "onboarding" folder IS in the URL because it's not in parentheses.
 *    If we wanted /category-selection directly, we'd use (onboarding).
 *
 * 3. STACK VS TABS
 *
 *    Stack (used here):
 *    - Linear navigation (forward/back)
 *    - Screens stack on top of each other
 *    - Good for: onboarding, settings, details
 *
 *    Tabs (used in main app):
 *    - Parallel navigation (switch between sections)
 *    - All tabs exist simultaneously
 *    - Good for: main app sections (home, discover, profile)
 *
 * 4. WHY NO SafeAreaView HERE?
 *
 *    Unlike the auth layout, we don't wrap with SafeAreaView here.
 *    Each onboarding screen handles its own safe area because:
 *    - Different screens may need different edge handling
 *    - Gives more flexibility for custom designs
 *    - Consistent with the sign-in/sign-up pattern
 *
 * 5. SCREEN CONFIGURATION OPTIONS
 *
 *    Stack.Screen accepts many options:
 *    - title: Accessibility and header title
 *    - headerShown: Show/hide header
 *    - gestureEnabled: Allow swipe back (iOS)
 *    - animation: Transition animation type
 *    - presentation: 'card', 'modal', 'transparentModal'
 *    - headerLeft, headerRight: Custom header components
 *
 *    We keep it simple here, but these are available for customization.
 *
 * 6. NAVIGATION FLOW
 *
 *    The complete onboarding flow:
 *
 *    Sign Up/Sign In → Check onboardingCompleted (false)
 *         ↓
 *    /onboarding/category-selection
 *         ↓ (Continue)
 *    /onboarding/time-selection
 *         ↓ (Get Started) → Save to Firestore
 *    /home (replace, not push)
 *
 *    "replace" is important - we don't want users to "go back" to onboarding
 *    after completing it. The navigation history is replaced, not extended.
 *
 * NEXT STEPS:
 * ===========
 * Now we need to create:
 * 1. category-selection.tsx - The first onboarding screen
 * 2. time-selection.tsx - The second onboarding screen
 *
 * Each screen will use the UI components we created in Phase 2
 * (CategoryChip, TimeOptionCard) and connect to Redux for state management.
 */
