/**
 * ContentLoadingState Component
 *
 * Displays an engaging loading animation while waiting for AI-generated content.
 * This component creates a calm, peaceful experience during the 10-30 second
 * wait for content generation.
 *
 * DESIGN PHILOSOPHY:
 * - Calm, not anxious: Slow, gentle animations (2-second cycles)
 * - Reassuring: Clear message about what's happening
 * - On-brand: Uses the app's design system colors
 * - Minimal: No overwhelming spinners or complex animations
 *
 * WHY A CUSTOM LOADING STATE?
 * Content generation takes 10-30 seconds - much longer than typical
 * API calls. A standard spinner would feel wrong because:
 * - Users might think the app is frozen
 * - Spinners feel "urgent" and create anxiety
 * - We want to set expectations ("getting you the BEST knowledge")
 *
 * ANIMATION APPROACH:
 * We use React Native's Animated API for a simple opacity fade:
 * - Text fades from 40% to 100% opacity
 * - 1 second fade up, 1 second fade down
 * - Creates a gentle "breathing" effect
 *
 * USAGE:
 * ```tsx
 * <ContentLoadingState isLoading={isContentLoading} />
 * ```
 *
 * The component renders nothing when isLoading is false.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Text, Card, CardContent } from '@/components/ui';
import { colors } from '@/theme';

/**
 * Component Props Interface
 *
 * @param isLoading - Whether to show the loading state
 *
 * When isLoading is false, the component returns null (renders nothing).
 * This makes it easy to conditionally render:
 *
 * <ContentLoadingState isLoading={state.isLoading} />
 * {!state.isLoading && state.content && <ContentCard content={content} />}
 */
interface ContentLoadingStateProps {
  isLoading: boolean;
}

/**
 * ContentLoadingState Component
 *
 * A peaceful loading animation for content generation.
 *
 * WHAT IT SHOWS:
 * - Animated sparkles icon (represents AI/magic)
 * - Fading text message
 * - Subtle subtext about the wait
 *
 * ACCESSIBILITY:
 * - Uses semantic Text components
 * - Animation is subtle (doesn't trigger motion sensitivity issues)
 * - High contrast text colors
 */
export function ContentLoadingState({ isLoading }: ContentLoadingStateProps) {
  /**
   * Animation Value
   *
   * useRef stores the Animated.Value so it persists across renders.
   * Starting at 0.4 (40% opacity) gives a "dimmed" starting point.
   *
   * WHY useRef AND NOT useState?
   * - Animated.Value is mutable and shouldn't cause re-renders
   * - useRef is the correct pattern for animation values
   * - It persists the same object across renders
   */
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  /**
   * Icon Animation Value
   *
   * Separate animation for the icon (slightly different timing)
   * Creates visual interest with two elements animating at different rates.
   */
  const iconFadeAnim = useRef(new Animated.Value(0.6)).current;

  /**
   * Animation Effect
   *
   * Sets up the looping fade animation when isLoading becomes true.
   * Cleans up (stops) the animation when isLoading becomes false or unmounts.
   *
   * ANIMATION BREAKDOWN:
   *
   * 1. Animated.loop() - Repeats indefinitely
   * 2. Animated.sequence() - Runs animations in order
   * 3. Two Animated.timing():
   *    - Fade up to 1.0 (100%) over 1000ms
   *    - Fade down to 0.4 (40%) over 1000ms
   * 4. Total cycle: 2 seconds
   *
   * useNativeDriver: true means the animation runs on the native thread,
   * not the JS thread. This makes it smoother and doesn't block JS.
   */
  useEffect(() => {
    if (isLoading) {
      // Start text animation
      const textAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Start icon animation (slightly offset timing for visual interest)
      const iconAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(iconFadeAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(iconFadeAnim, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );

      textAnimation.start();
      iconAnimation.start();

      /**
       * Cleanup Function
       *
       * When isLoading becomes false or the component unmounts,
       * we need to stop the animations. If we don't:
       * - Animations continue running (waste resources)
       * - May cause errors if component is gone
       * - Can cause memory leaks
       */
      return () => {
        textAnimation.stop();
        iconAnimation.stop();
        // Reset to initial values
        fadeAnim.setValue(0.4);
        iconFadeAnim.setValue(0.6);
      };
    }
  }, [isLoading, fadeAnim, iconFadeAnim]);

  /**
   * Early Return for Not Loading
   *
   * When isLoading is false, render nothing.
   * This is cleaner than wrapping everything in a conditional.
   */
  if (!isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/**
       * Content Card
       *
       * Using the app's Card component for consistency.
       * The card contains the animated content.
       */}
      <Card className="mx-4">
        <CardContent className="items-center py-12">
          {/**
           * Animated Icon
           *
           * Sparkles icon represents AI/magic/creation.
           * Wrapped in Animated.View for opacity animation.
           * The icon animates at a slightly different rate than the text.
           */}
          <Animated.View
            style={[
              styles.iconContainer,
              { opacity: iconFadeAnim },
            ]}
          >
            <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center">
              <Sparkles size={32} color={colors.primary} />
            </View>
          </Animated.View>

          {/**
           * Animated Text Container
           *
           * Contains the main message and subtext.
           * Both animate together for cohesion.
           */}
          <Animated.View style={{ opacity: fadeAnim }}>
            {/**
             * Main Message
             *
             * "Getting you the best knowledge..."
             *
             * WHY THIS WORDING?
             * - "Getting" implies active work being done
             * - "best" sets quality expectations
             * - "knowledge" reinforces the app's purpose
             * - Ellipsis (...) suggests ongoing process
             */}
            <Text
              variant="h3"
              className="text-center text-primary mb-2"
            >
              Getting you the best knowledge...
            </Text>

            {/**
             * Subtext
             *
             * Sets expectations about the wait time.
             * Helps users understand this is normal, not broken.
             */}
            <Text
              variant="muted"
              className="text-center px-8"
            >
              Our AI is crafting personalized content just for you.
              This usually takes a few moments.
            </Text>
          </Animated.View>
        </CardContent>
      </Card>

      {/**
       * Tip Text (Below Card)
       *
       * Optional helpful tip to fill the wait time.
       * Keeps users engaged and informed.
       */}
      <View className="mt-6 px-8">
        <Text variant="small" className="text-center text-muted-foreground">
          Tip: You can pull down to refresh if you want to try again.
        </Text>
      </View>
    </View>
  );
}

/**
 * Styles
 *
 * Using StyleSheet for the container.
 * Other styles use NativeWind (Tailwind classes).
 *
 * WHY MIX StyleSheet AND NativeWind?
 * - StyleSheet: For flex layout that needs precise control
 * - NativeWind: For spacing, colors, and typography
 *
 * Both work well together. Use whichever is clearer for each case.
 */
const styles = StyleSheet.create({
  /**
   * Container
   *
   * Centers the loading content vertically and horizontally.
   * Takes up available space (flex: 1).
   */
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  /**
   * Icon Container
   *
   * Adds margin below the icon.
   * Could also use className="mb-4" but StyleSheet is clearer here.
   */
  iconContainer: {
    marginBottom: 16,
  },
});

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. REACT NATIVE ANIMATED API
 *    The Animated API is React Native's built-in animation system.
 *    Key concepts:
 *    - Animated.Value: A number that can change over time
 *    - Animated.timing: Animate to a value over duration
 *    - Animated.View: A View that can be animated
 *    - useNativeDriver: Runs animation on native thread (smoother)
 *
 * 2. WHY NOT react-native-reanimated?
 *    Reanimated is more powerful but:
 *    - More complex API
 *    - Overkill for simple opacity animation
 *    - Animated API is built-in (no extra dependency)
 *
 *    For more complex animations (gestures, spring physics),
 *    Reanimated would be the better choice.
 *
 * 3. ANIMATION CLEANUP
 *    Always stop animations in useEffect cleanup:
 *    - Prevents memory leaks
 *    - Avoids errors when component unmounts
 *    - Resets values for next time
 *
 * 4. ANIMATION TIMING
 *    We use slow animations (1-2 second cycles) because:
 *    - Fast animations feel urgent/anxious
 *    - Slow animations are calming
 *    - Matches the "breathing" metaphor
 *    - Easier on the eyes for long waits
 *
 * 5. OPACITY VS OTHER TRANSFORMS
 *    We animate opacity because:
 *    - It's simple and elegant
 *    - Works well with useNativeDriver
 *    - Doesn't cause layout shifts
 *    - Universally understood as "loading"
 *
 *    Alternatives considered:
 *    - Scale: Can feel jarring
 *    - Rotation: Feels like a spinner (too urgent)
 *    - Position: Distracting for long waits
 *
 * 6. COMPONENT COMPOSITION
 *    This component uses:
 *    - Card from our UI library (consistent styling)
 *    - Text component with variants (typography system)
 *    - Lucide icons (consistent iconography)
 *
 *    This ensures the loading state matches the rest of the app.
 *
 * 7. EARLY RETURN PATTERN
 *    We return null early if not loading:
 *    ```
 *    if (!isLoading) return null;
 *    ```
 *
 *    This is cleaner than:
 *    ```
 *    return isLoading ? <View>...</View> : null;
 *    ```
 *
 *    Early returns make the main code easier to read.
 *
 * FUTURE ENHANCEMENTS:
 * - Add progress indicator if n8n provides status updates
 * - Show estimated time remaining
 * - Add fun facts or tips to display during wait
 * - Support different loading messages based on context
 */
