/**
 * Welcome Screen (Onboarding Entry Point)
 *
 * This is the first screen users see when they open the app for the first time
 * or when they're not logged in. It serves as the gateway to authentication.
 *
 * PURPOSE:
 * The Welcome screen should:
 * 1. Make a great first impression (brand identity, welcoming design)
 * 2. Clearly communicate what the app does
 * 3. Provide clear paths to sign in or sign up
 * 4. Build trust and excitement about using the app
 *
 * DESIGN SYSTEM:
 * This screen uses our new NativeWind/Tailwind-based UI components:
 * - Text component with variants (h1, body, muted)
 * - Button component with variants (default, secondary, ghost)
 * - Tailwind classes for layout and spacing
 *
 * The design follows our UI_RULES.md principles:
 * - Minimal: Clean, uncluttered layout with purposeful whitespace
 * - Light: Off-white background (#FAFAF9)
 * - Soft: Muted sage green accent (#6B8E7B)
 * - Modern: Rounded corners, clean typography
 */

import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from '@/components/ui';
import { Check } from 'lucide-react-native';

/**
 * WelcomeScreen Component
 *
 * A functional component that renders the welcome/onboarding screen.
 *
 * LAYOUT STRUCTURE (using Tailwind classes):
 * - SafeAreaView: Handles notch/status bar on modern devices
 * - Main container: flex-1, bg-background, centered content
 * - Hero section: Logo, app name, tagline
 * - Features section: Key benefits list
 * - CTA section: Sign up and sign in buttons
 *
 * NAVIGATION:
 * Uses expo-router's navigation functions:
 * - router.push() to navigate to other screens
 * - Automatically handles back button behavior
 */
export default function WelcomeScreen() {
  /**
   * Navigation Handler: Navigate to Sign In
   *
   * When user taps "Sign In" button, navigate to the sign-in screen.
   * router.push() adds the new screen to the navigation stack.
   */
  const handleSignIn = () => {
    router.push('/sign-in');
  };

  /**
   * Navigation Handler: Navigate to Sign Up
   *
   * When user taps "Create Account" button, navigate to the sign-up screen.
   */
  const handleSignUp = () => {
    router.push('/sign-up');
  };

  return (
    /**
     * SafeAreaView
     *
     * Ensures content doesn't overlap with the status bar, notch,
     * or home indicator on modern devices.
     *
     * flex-1: Takes up all available space
     * bg-background: Our warm off-white background (#FAFAF9)
     */
    <SafeAreaView className="flex-1 bg-background">
      {/**
       * Main Container
       *
       * Centered layout with generous padding.
       * justify-between: Pushes hero to top, CTA to bottom
       */}
      <View className="flex-1 px-6 py-8 justify-between">
        {/**
         * Hero Section
         *
         * Top of screen - introduces the app.
         * Items centered both horizontally and vertically within its space.
         */}
        <View className="flex-1 items-center justify-center">
          {/**
           * Logo Container
           *
           * Circular container with soft primary background.
           * In production, replace emoji with actual logo image.
           *
           * bg-primary-50: Very light sage green (#F2F7F4)
           * rounded-full: Perfect circle (9999px border radius)
           */}
          <View className="w-28 h-28 rounded-full bg-primary-50 items-center justify-center mb-6">
            <Text className="text-6xl">🍿</Text>
          </View>

          {/**
           * App Name
           *
           * Large, prominent display using h1 variant.
           * Primary color for brand identity.
           */}
          <Text variant="h1" className="text-primary mb-2 text-center">
            POCHOCLO
          </Text>

          {/**
           * Tagline
           *
           * Brief value proposition.
           * Uses lead variant (larger body text) with muted color.
           */}
          <Text variant="lead" className="text-center px-4 max-w-xs">
            Your personal learning companion for React Native development
          </Text>
        </View>

        {/**
         * Features Section
         *
         * Key benefits list with checkmarks.
         * Centered with consistent spacing between items.
         */}
        <View className="items-center mb-8">
          <FeatureItem text="Learn by doing with real-world examples" />
          <FeatureItem text="Comprehensive educational comments" />
          <FeatureItem text="Best practices from day one" />
        </View>

        {/**
         * CTA Section
         *
         * Call-to-action buttons at the bottom.
         *
         * BUTTON HIERARCHY:
         * - Primary: "Create Account" - main action for new users
         * - Secondary: "Sign In" - for returning users
         *
         * gap-3: 12px spacing between buttons
         */}
        <View className="w-full gap-3">
          {/**
           * Primary CTA: Create Account
           *
           * Most prominent button - default variant (sage green).
           * Full width for easy tapping.
           */}
          <Button onPress={handleSignUp}>
            Create Account
          </Button>

          {/**
           * Secondary CTA: Sign In
           *
           * Less prominent but equally accessible.
           * Uses secondary variant (subtle gray background).
           */}
          <Button variant="secondary" onPress={handleSignIn}>
            Sign In
          </Button>

          {/**
           * Terms Notice
           *
           * Legal text - small, muted, centered.
           * In production, these would be links to actual pages.
           */}
          <Text variant="muted" className="text-center mt-4 px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * FeatureItem Component
 *
 * A small helper component that renders a single feature with a checkmark.
 * This keeps the main component clean and follows DRY principles.
 *
 * @param text - The feature text to display
 */
function FeatureItem({ text }: { text: string }) {
  return (
    /**
     * Feature Row
     *
     * Horizontal layout with check icon and text.
     * flex-row: Items side by side
     * items-center: Vertically centered
     * mb-2: 8px bottom margin between items
     */
    <View className="flex-row items-center mb-2">
      {/**
       * Check Icon
       *
       * Using lucide-react-native for consistent icons.
       * Primary color to match brand.
       */}
      <Check size={18} color="#6B8E7B" className="mr-2" />

      {/**
       * Feature Text
       *
       * Muted variant for subtle appearance.
       * ml-2: 8px left margin for spacing from icon
       */}
      <Text variant="muted" className="ml-2">
        {text}
      </Text>
    </View>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. NATIVEWIND/TAILWIND BENEFITS
 *    - Utility-first: No separate StyleSheet needed
 *    - Consistent: Uses our design tokens from tailwind.config.js
 *    - Readable: Class names describe what they do
 *    - Fast: Just add classes, no context switching
 *
 * 2. COMPARISON: STYLESHEET VS TAILWIND
 *
 *    BEFORE (StyleSheet):
 *    ```
 *    const styles = StyleSheet.create({
 *      container: {
 *        flex: 1,
 *        backgroundColor: colors.background,
 *        padding: spacing.xl,
 *      }
 *    });
 *    <View style={styles.container}>
 *    ```
 *
 *    AFTER (Tailwind):
 *    ```
 *    <View className="flex-1 bg-background p-6">
 *    ```
 *
 *    Same result, less code, more readable!
 *
 * 3. DESIGN SYSTEM COLORS
 *    Our custom colors from tailwind.config.js:
 *    - bg-background: #FAFAF9 (warm off-white)
 *    - text-primary: #6B8E7B (sage green)
 *    - bg-primary-50: #F2F7F4 (very light sage)
 *    - text-muted-foreground: #78716C (gray)
 *
 * 4. COMPONENT COMPOSITION
 *    We use our custom UI components:
 *    - <Text variant="h1"> instead of <Text style={styles.h1}>
 *    - <Button variant="secondary"> instead of custom styling
 *    - Components encapsulate design decisions
 *
 * 5. SAFEAREAVIEW IMPORTANCE
 *    Modern phones have:
 *    - Notches (iPhone X+)
 *    - Status bar overlay
 *    - Home indicator bar
 *
 *    SafeAreaView from react-native-safe-area-context
 *    handles all of these automatically.
 *
 * 6. LUCIDE ICONS
 *    We use lucide-react-native for icons:
 *    - Consistent design language
 *    - Tree-shakable (only imports what you use)
 *    - TypeScript support
 *    - Easy to use: <Check size={18} color="#6B8E7B" />
 *
 * 7. RESPONSIVE DESIGN
 *    - max-w-xs: Limits text width on larger screens
 *    - px-6: Consistent horizontal padding
 *    - flex-1: Takes available space, adapts to screen size
 *
 * 8. WHITESPACE AS DESIGN
 *    Notice the generous padding and margins:
 *    - py-8: 32px vertical padding
 *    - mb-6, mb-8: Vertical rhythm
 *    - gap-3: Consistent button spacing
 *
 *    Whitespace creates visual breathing room - essential for minimal design!
 *
 * NEXT STEPS:
 * - Refactor sign-in screen with new components
 * - Refactor sign-up screen with new components
 * - Add app logo (replace emoji placeholder)
 */
