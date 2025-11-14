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
 * DESIGN GOALS:
 * - Clean, uncluttered layout
 * - Strong visual hierarchy (app name → tagline → actions)
 * - Accessible and easy to understand
 * - Professional appearance using our design system
 *
 * USER FLOWS:
 * From this screen, users can:
 * - Tap "Sign In" → Navigate to sign-in screen
 * - Tap "Create Account" → Navigate to sign-up screen (Phase 6)
 */

import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, headings, body } from '../../src/theme';
import Button from '../../src/components/Button';

/**
 * WelcomeScreen Component
 *
 * A functional component that renders the welcome/onboarding screen.
 *
 * COMPONENT STRUCTURE:
 * 1. Hero section (app name, logo, tagline)
 * 2. Features/benefits (optional - can add later)
 * 3. Call-to-action buttons (Sign In, Create Account)
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
   *
   * router.push() adds the new screen to the navigation stack,
   * allowing users to go back to the welcome screen if needed.
   *
   * The path '/sign-in' corresponds to app/(auth)/sign-in.tsx
   * (route groups like (auth) don't appear in URLs)
   */
  const handleSignIn = () => {
    router.push('/sign-in');
  };

  /**
   * Navigation Handler: Navigate to Sign Up
   *
   * This will be implemented in Phase 6 when we create the sign-up screen.
   * For now, we can add a placeholder or disable the button.
   */
  const handleSignUp = () => {
    // TODO: Phase 6 - Navigate to sign-up screen
    router.push('/sign-up');
  };

  return (
    <View style={styles.container}>
      {/*
        Hero Section

        The top section that immediately communicates:
        - App identity (name, logo)
        - Purpose (tagline)

        This is the first thing users see, so it should be
        visually appealing and clearly communicate value.
      */}
      <View style={styles.heroSection}>
        {/*
          App Logo/Icon

          TODO: Replace this placeholder with actual app logo
          For now, we're using an emoji as a temporary placeholder.

          In a production app, you would:
          1. Import a logo image: import logo from '@/assets/logo.png'
          2. Use Image component: <Image source={logo} style={styles.logo} />
        */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoPlaceholder}>🍿</Text>
        </View>

        {/*
          App Name

          Large, prominent display of the app name using our h1 heading style.
          This establishes brand identity immediately.
        */}
        <Text style={styles.appName}>POCHOCLO</Text>

        {/*
          Tagline

          Brief description of what the app does or its value proposition.
          Should be clear, concise, and compelling.

          Examples from popular apps:
          - Airbnb: "Book unique places to stay and things to do"
          - Instagram: "Capture and Share the World's Moments"
          - Duolingo: "Learn a language for free. Forever."
        */}
        <Text style={styles.tagline}>
          Your personal learning companion for React Native development
        </Text>
      </View>

      {/*
        Features Section (Optional)

        This section can highlight key features or benefits.
        For a learning project, we're keeping it simple for now.

        In a production app, you might add:
        - Feature cards with icons
        - Social proof (user count, ratings)
        - Screenshots or animations
      */}
      <View style={styles.featuresSection}>
        <Text style={styles.featureText}>
          ✓ Learn by doing with real-world examples
        </Text>
        <Text style={styles.featureText}>
          ✓ Comprehensive educational comments
        </Text>
        <Text style={styles.featureText}>
          ✓ Best practices from day one
        </Text>
      </View>

      {/*
        Call-to-Action Section

        Primary conversion point - where users take action.

        BUTTON HIERARCHY:
        - Primary button: Main action (Create Account - new user path)
        - Secondary button: Alternative action (Sign In - returning user path)

        UX PRINCIPLE:
        We prioritize "Create Account" as primary because:
        1. Most first-time visitors are new users
        2. Growing user base is typically the main goal
        3. Creates a clear visual hierarchy

        However, "Sign In" is equally accessible for returning users.
      */}
      <View style={styles.ctaSection}>
        {/*
          Primary CTA: Create Account

          For new users. This should be the most prominent button.
          Uses "primary" variant for maximum visual weight.

          Note: In Phase 6, this will navigate to the sign-up screen.
          For now, it's a placeholder.
        */}
        <Button
          variant="primary"
          size="large"
          title="Create Account"
          onPress={handleSignUp}
          fullWidth
          // Temporarily disabled until sign-up screen is created in Phase 6
          disabled={true}
        />

        {/*
          Secondary CTA: Sign In

          For returning users. Less visually prominent than primary button,
          but still easily accessible.

          Uses "secondary" variant to create visual hierarchy without
          making it feel less important.
        */}
        <Button
          variant="secondary"
          size="large"
          title="Sign In"
          onPress={handleSignIn}
          fullWidth
          style={styles.signInButton}
        />

        {/*
          Terms and Privacy Notice

          Important legal text that's required for most apps.

          Should be:
          - Visible but not prominent (small, secondary color)
          - Readable (not too small)
          - Linked to actual terms/privacy pages (in production)

          For this learning project, it's a static placeholder.
        */}
        <Text style={styles.legalText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

/**
 * Styles for Welcome Screen
 *
 * DESIGN PRINCIPLES APPLIED:
 * 1. Vertical rhythm: Consistent spacing between sections
 * 2. Visual hierarchy: Size and weight indicate importance
 * 3. Whitespace: Breathing room prevents cluttered feeling
 * 4. Alignment: Center-aligned for welcoming, balanced feel
 * 5. Design system: All values come from our theme tokens
 */
const styles = StyleSheet.create({
  // Container: Full-screen flex container
  container: {
    flex: 1, // Take up all available space
    backgroundColor: colors.background,
    padding: spacing.xl, // Large padding for breathing room
    justifyContent: 'space-between', // Push hero to top, CTA to bottom
  },

  // Hero Section: Top of screen, introduces the app
  heroSection: {
    flex: 1, // Take up available space
    justifyContent: 'center', // Center vertically within its flex space
    alignItems: 'center', // Center horizontally
    paddingTop: spacing.xxl, // Extra top padding
  },

  // Logo Container: Circle background for logo
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60, // Half of width/height for perfect circle
    backgroundColor: colors.primary + '20', // Primary color at 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  // Logo Placeholder: Temporary emoji logo
  logoPlaceholder: {
    fontSize: 64, // Large emoji size
  },

  // App Name: Large, bold, prominent
  appName: {
    ...headings.h1, // Import h1 styles from design system
    color: colors.primary, // Brand color
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  // Tagline: Descriptive text below app name
  tagline: {
    ...body.large, // Larger body text for importance
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md, // Prevent edge-to-edge text
    maxWidth: 400, // Limit line length for readability
  },

  // Features Section: List of key benefits
  featuresSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  // Feature Text: Individual feature item
  featureText: {
    ...body.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // CTA Section: Bottom section with buttons
  ctaSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },

  // Sign In Button: Spacing between buttons
  signInButton: {
    marginTop: spacing.md, // Space between Create Account and Sign In
  },

  // Legal Text: Small terms/privacy notice
  legalText: {
    ...body.small, // Smallest body text size
    color: colors.textTertiary, // Least prominent color
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: 18, // Slightly increase line height for readability
  },
});

/**
 * LEARNING NOTES:
 *
 * 1. WELCOME SCREEN BEST PRACTICES
 *    - Keep it simple: Don't overwhelm with too much information
 *    - Clear actions: Make it obvious what users should do next
 *    - Fast loading: Should appear instantly, no heavy assets
 *    - Brand consistency: Use your design system colors/typography
 *    - Social proof: Consider adding user count, ratings, or testimonials
 *
 * 2. BUTTON HIERARCHY
 *    Visual hierarchy guides users to the most important action:
 *    - Primary: Filled button, brand color (Create Account)
 *    - Secondary: Outlined button, less prominent (Sign In)
 *    - Tertiary: Text button, least prominent (Skip, Learn More)
 *
 * 3. SPACING AND LAYOUT
 *    justifyContent: 'space-between' creates three sections:
 *    - Hero at top (flex: 1, centers within its space)
 *    - Features in middle (natural size)
 *    - CTA at bottom (natural size, pinned to bottom)
 *
 * 4. FLEX: 1 EXPLAINED
 *    flex: 1 means "take up all available space after other siblings"
 *
 *    In our layout:
 *    - container: flex: 1 (takes up full screen)
 *    - heroSection: flex: 1 (takes up available space, pushing CTA to bottom)
 *    - other sections: no flex (take up only the space they need)
 *
 * 5. COLOR OPACITY
 *    colors.primary + '20' adds 20% opacity to the primary color
 *    '20' is a hex value: 00 (0%) to FF (100%)
 *    Common values: 10 (10%), 20 (20%), 50 (50%), 80 (80%)
 *
 * 6. RESPONSIVE DESIGN
 *    maxWidth: 400 prevents text from being too wide on tablets
 *    paddingHorizontal ensures content doesn't touch screen edges
 *    This simple approach works well for mobile-first design
 *
 * 7. NAVIGATION WITH EXPO ROUTER
 *    router.push('/sign-in') navigates to app/(auth)/sign-in.tsx
 *    - Route groups (auth) are invisible in URLs
 *    - Stack navigation automatically handles back button
 *    - Type-safe navigation (TypeScript knows available routes)
 *
 * 8. PLACEHOLDER vs PRODUCTION
 *    This screen uses temporary elements:
 *    - Emoji logo (replace with actual logo image)
 *    - Disabled Create Account button (enable in Phase 6)
 *    - Static legal text (should be links to real pages)
 *    This is normal in iterative development - functionality first, polish later
 *
 * NEXT STEPS:
 * - Phase 5: Create sign-in screen (next)
 * - Phase 6: Create sign-up screen
 * - Phase 7: Add password recovery
 * - Polish: Add real logo, images, animations
 */
