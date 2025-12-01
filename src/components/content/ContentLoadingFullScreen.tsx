/**
 * ContentLoadingFullScreen Component
 *
 * An engaging, full-screen loading animation that entertains users during the
 * 10-30 second wait for AI content generation.
 *
 * DESIGN PHILOSOPHY:
 * ===================
 * When users pull to refresh or tap "Get Content", this component takes over
 * the entire screen with a magical, calming animation. The goal is to:
 * - Make the wait feel shorter through engagement
 * - Communicate that "something is happening" (AI is working)
 * - Match our minimal, soft sage green design system
 *
 * ANIMATION APPROACH:
 * ===================
 * We use react-native-reanimated for smooth 60fps animations that run on the
 * native thread. This prevents any jank or stuttering during the long wait.
 *
 * Visual elements:
 * 1. Floating sparkles - 6 sparkle icons that orbit gently around the center
 * 2. Central breathing pulse - A ring that expands and contracts softly
 * 3. Rotating messages - Text that cycles through different "working" states
 *
 * WHY FULL SCREEN?
 * ================
 * The wait is 10-30 seconds - that's a LONG time in mobile UX. By taking over
 * the full screen, we:
 * - Remove distractions (user focuses on the animation)
 * - Set clear expectations (this is a "process", not a quick load)
 * - Create a memorable moment (like Notion AI or ChatGPT thinking)
 *
 * ACCESSIBILITY:
 * ==============
 * - Respects reduced motion preferences (shows static version)
 * - All animations are gentle and won't trigger motion sensitivity
 * - High contrast text colors maintained
 *
 * USAGE:
 * ======
 * In home.tsx, replace ContentLoadingState with this when isLoading:
 *
 * ```tsx
 * {isLoading ? (
 *   <ContentLoadingFullScreen />
 * ) : (
 *   <>{/* Header and other content *\/}</>
 * )}
 * ```
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { Sparkles, Search, Lightbulb, Wand2, Brain, BookOpen } from 'lucide-react-native';
import { Text } from '@/components/ui';

/**
 * Screen dimensions for centering calculations
 *
 * We need to know the screen size to properly position our floating elements
 * around the center of the screen.
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Animation timing constants
 *
 * These values are carefully chosen to create a calm, magical feeling:
 * - Slower animations (3-4 seconds) feel meditative, not anxious
 * - Staggered timings create organic, natural movement
 * - Message rotation every 4 seconds keeps users engaged
 */
const ORBIT_DURATION = 8000; // Time for one full orbit (ms)
const PULSE_DURATION = 2500; // Breathing pulse cycle (ms)
const MESSAGE_DURATION = 4000; // Time between message changes (ms)
const FLOAT_DURATION = 3000; // Gentle floating motion (ms)

/**
 * Colors from our design system
 *
 * We use the soft sage green palette throughout:
 * - primary: #6B8E7B (main sage green)
 * - primary-100: #E0EBE4 (light sage for backgrounds)
 * - primary-50: #F2F7F4 (lightest sage)
 */
const COLORS = {
  primary: '#6B8E7B',
  primaryLight: '#E0EBE4',
  primaryLightest: '#F2F7F4',
  muted: '#78716C',
  background: '#FAFAF9',
};

/**
 * Loading messages that cycle during the wait
 *
 * These messages tell a story of what the AI is "doing":
 * - Start with searching/finding
 * - Move to crafting/creating
 * - End with "almost there" anticipation
 *
 * Each message has an icon that matches its sentiment.
 */
const LOADING_MESSAGES = [
  { text: 'Searching for the perfect topic...', Icon: Search },
  { text: 'Discovering something interesting...', Icon: Lightbulb },
  { text: 'Our AI is crafting your content...', Icon: Brain },
  { text: 'Adding some magic touches...', Icon: Wand2 },
  { text: 'Preparing your personalized read...', Icon: BookOpen },
  { text: 'Almost there...', Icon: Sparkles },
];

/**
 * Floating Sparkle Component
 *
 * Each sparkle floats around in a gentle, circular-ish pattern.
 * We create 6 of these, each with different:
 * - Starting positions
 * - Animation delays (staggered for organic feel)
 * - Orbit radii (some closer, some farther)
 *
 * @param index - The sparkle's index (0-5) for calculating unique offsets
 */
interface FloatingSparkleProps {
  index: number;
  reduceMotion: boolean;
}

function FloatingSparkle({ index, reduceMotion }: FloatingSparkleProps) {
  /**
   * Shared values for animation
   *
   * useSharedValue creates a value that can be animated on the native thread.
   * - progress: Drives the circular orbit (0 to 1 = one full circle)
   * - float: Drives the gentle vertical bobbing
   * - opacity: Fades the sparkle in and out subtly
   */
  const progress = useSharedValue(0);
  const float = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  /**
   * Calculate unique properties for this sparkle
   *
   * Each sparkle gets different values based on its index:
   * - angle: Starting position around the center (evenly distributed)
   * - radius: Distance from center (alternating closer/farther)
   * - delay: When it starts animating (staggered entrance)
   */
  const angle = (index / 6) * Math.PI * 2; // Distribute evenly around circle
  const radius = 60 + (index % 3) * 25; // Vary radius: 60, 85, or 110
  const delay = index * 300; // Stagger by 300ms each
  const size = 18 + (index % 2) * 6; // Vary size: 18 or 24

  useEffect(() => {
    if (reduceMotion) return;

    /**
     * Orbit animation
     *
     * withRepeat(-1, ...) repeats forever
     * The progress goes from 0 to 1 over ORBIT_DURATION
     * We add a delay so sparkles don't all move in sync
     */
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: ORBIT_DURATION + index * 500, // Slightly different speeds
          easing: Easing.linear,
        }),
        -1, // Repeat forever
        false // Don't reverse
      )
    );

    /**
     * Float animation (gentle bobbing)
     *
     * Creates a subtle up-down motion that adds life to the sparkles.
     * withSequence runs animations in order: up, then down.
     */
    float.value = withDelay(
      delay + 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: FLOAT_DURATION, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: FLOAT_DURATION, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );

    /**
     * Opacity animation (subtle fade)
     *
     * Sparkles gently pulse between 40% and 100% opacity.
     * This creates a twinkling effect.
     */
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    /**
     * Cleanup function
     *
     * When component unmounts, cancel all animations to prevent memory leaks.
     */
    return () => {
      cancelAnimation(progress);
      cancelAnimation(float);
      cancelAnimation(opacity);
    };
  }, [index, delay, reduceMotion]);

  /**
   * Animated style for the sparkle
   *
   * useAnimatedStyle creates a style that updates with our shared values.
   * This runs on the native thread for smooth 60fps animation.
   */
  const animatedStyle = useAnimatedStyle(() => {
    // Convert progress (0-1) to radians for circular motion
    const rotation = progress.value * Math.PI * 2 + angle;

    // Calculate X and Y position using trigonometry
    // cos for X, sin for Y creates circular motion
    const x = Math.cos(rotation) * radius;
    const y = Math.sin(rotation) * radius;

    // Add floating offset (converts 0-1 to -8 to +8 pixels)
    const floatOffset = interpolate(float.value, [0, 1], [-8, 8]);

    return {
      transform: [
        { translateX: x },
        { translateY: y + floatOffset },
      ],
      opacity: opacity.value,
    };
  });

  // For reduced motion, show static sparkles at fixed positions
  if (reduceMotion) {
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return (
      <View
        style={[
          styles.sparkle,
          {
            transform: [{ translateX: x }, { translateY: y }],
            opacity: 0.6,
          },
        ]}
      >
        <Sparkles size={size} color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.sparkle, animatedStyle]}>
      <Sparkles size={size} color={COLORS.primary} />
    </Animated.View>
  );
}

/**
 * Central Pulse Ring Component
 *
 * A soft ring that expands and contracts around the center.
 * This creates a gentle "breathing" effect that's calming and
 * communicates that the app is "alive" and working.
 */
function PulseRing({ reduceMotion }: { reduceMotion: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (reduceMotion) return;

    /**
     * Scale animation (breathing effect)
     *
     * The ring expands to 120% then contracts back to 100%.
     * This creates the "breathing" sensation.
     */
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    /**
     * Opacity animation (fade with breathing)
     *
     * As the ring expands, it fades slightly.
     * As it contracts, it becomes more visible.
     */
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (reduceMotion) {
    return <View style={[styles.pulseRing, { opacity: 0.2 }]} />;
  }

  return <Animated.View style={[styles.pulseRing, animatedStyle]} />;
}

/**
 * Message Carousel Component
 *
 * Cycles through the loading messages every MESSAGE_DURATION ms.
 * Each message has:
 * - An icon that matches the message sentiment
 * - Text describing what the AI is doing
 *
 * This keeps users engaged during the long wait by telling
 * a story of the generation process.
 */
function MessageCarousel({ reduceMotion }: { reduceMotion: boolean }) {
  const [messageIndex, setMessageIndex] = React.useState(0);
  const fadeAnim = useSharedValue(1);

  useEffect(() => {
    /**
     * Message rotation timer
     *
     * Every MESSAGE_DURATION ms, we:
     * 1. Fade out current message
     * 2. Change to next message
     * 3. Fade in new message
     */
    const interval = setInterval(() => {
      if (!reduceMotion) {
        // Fade out
        fadeAnim.value = withTiming(0, { duration: 300 }, () => {
          // This callback runs after fade out completes
          // Note: We can't call setMessageIndex here because it's on UI thread
        });

        // Schedule message change and fade in
        setTimeout(() => {
          setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
          fadeAnim.value = withTiming(1, { duration: 300 });
        }, 300);
      } else {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }
    }, MESSAGE_DURATION);

    return () => {
      clearInterval(interval);
      cancelAnimation(fadeAnim);
    };
  }, [reduceMotion]);

  const currentMessage = LOADING_MESSAGES[messageIndex];
  const IconComponent = currentMessage.Icon;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      {
        translateY: interpolate(fadeAnim.value, [0, 1], [10, 0]),
      },
    ],
  }));

  const content = (
    <View style={styles.messageContent}>
      <View style={styles.messageIconContainer}>
        <IconComponent size={28} color={COLORS.primary} />
      </View>
      <Text variant="h3" className="text-primary text-center mt-4">
        {currentMessage.text}
      </Text>
    </View>
  );

  if (reduceMotion) {
    return <View style={styles.messageContainer}>{content}</View>;
  }

  return (
    <Animated.View style={[styles.messageContainer, animatedStyle]}>
      {content}
    </Animated.View>
  );
}

/**
 * ContentLoadingFullScreen Component
 *
 * The main component that orchestrates the full-screen loading experience.
 *
 * STRUCTURE:
 * - Background layer (warm off-white)
 * - Sparkles layer (floating around center)
 * - Center group:
 *   - Pulse ring (breathing background)
 *   - Message carousel (rotating text + icon)
 * - Bottom hint text
 */
export function ContentLoadingFullScreen() {
  /**
   * Reduced motion preference
   *
   * We respect the user's accessibility settings.
   * If they've enabled "Reduce Motion", we show a static version
   * with no animations to prevent motion sickness.
   */
  const [reduceMotion, setReduceMotion] = React.useState(false);

  useEffect(() => {
    /**
     * Check for reduced motion preference
     *
     * This is an accessibility feature - some users experience
     * motion sickness from animations. We should respect their choice.
     */
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    /**
     * Listen for changes to reduced motion setting
     *
     * If the user changes this setting while the app is open,
     * we should respond immediately.
     */
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/**
       * Sparkles Container
       *
       * This View is centered on screen and contains all 6 floating sparkles.
       * Each sparkle has its own animation offset from this center point.
       */}
      <View style={styles.sparklesContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <FloatingSparkle key={index} index={index} reduceMotion={reduceMotion} />
        ))}
      </View>

      {/**
       * Center Content
       *
       * The main visual focus: pulse ring + message carousel.
       * Positioned at the center of the screen.
       */}
      <View style={styles.centerContent}>
        <PulseRing reduceMotion={reduceMotion} />
        <MessageCarousel reduceMotion={reduceMotion} />
      </View>

      {/**
       * Bottom Hint
       *
       * A subtle message at the bottom reminding users they can
       * pull to refresh or wait patiently.
       */}
      <View style={styles.bottomHint}>
        <Text variant="small" className="text-muted-foreground text-center">
          Our AI is crafting personalized content just for you
        </Text>
        <Text variant="small" className="text-muted-foreground text-center mt-1">
          This usually takes 15-30 seconds
        </Text>
      </View>
    </View>
  );
}

/**
 * Styles
 *
 * We use StyleSheet for layout positioning and NativeWind for colors.
 * StyleSheet is better for complex positioning (absolute, centering)
 * while NativeWind shines for colors, spacing, and typography.
 */
const styles = StyleSheet.create({
  /**
   * Main container
   *
   * Takes up the full screen with the warm off-white background.
   * All children are positioned relative to this container.
   */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Sparkles container
   *
   * Centered on screen. All sparkles are positioned relative to this point.
   * The sparkles' translateX/Y moves them around this center.
   */
  sparklesContainer: {
    position: 'absolute',
    width: 1, // Point-sized container at center
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Individual sparkle wrapper
   *
   * Position absolute lets us move sparkles freely with transforms.
   */
  sparkle: {
    position: 'absolute',
  },

  /**
   * Pulse ring
   *
   * A circle that expands and contracts behind the message.
   * Uses border instead of background for a ring effect.
   */
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primaryLightest,
  },

  /**
   * Center content container
   *
   * Groups the pulse ring and message together.
   */
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    height: 280,
  },

  /**
   * Message container
   *
   * Positioned at center, contains icon and text.
   */
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  /**
   * Message content wrapper
   *
   * Centers the icon and text vertically.
   */
  messageContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Message icon container
   *
   * Circle background for the message icon.
   */
  messageIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Bottom hint
   *
   * Positioned at the bottom of the screen.
   */
  bottomHint: {
    position: 'absolute',
    bottom: 80,
    left: 40,
    right: 40,
  },
});

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. REACT-NATIVE-REANIMATED VS ANIMATED API
 *    We use Reanimated here (not the built-in Animated) because:
 *    - Complex animations need the native thread for smooth 60fps
 *    - Multiple simultaneous animations work better with worklets
 *    - useAnimatedStyle and useSharedValue are more predictable
 *
 * 2. SHARED VALUES (useSharedValue)
 *    These are Reanimated's way of storing animated values:
 *    - .value property can be read/written
 *    - Changes automatically sync to the native thread
 *    - Used with useAnimatedStyle for efficient updates
 *
 * 3. ANIMATION FUNCTIONS
 *    Reanimated provides several animation types:
 *    - withTiming: Animate to value over duration
 *    - withSpring: Bounce physics animation
 *    - withSequence: Run animations in order
 *    - withRepeat: Loop an animation (-1 = forever)
 *    - withDelay: Wait before starting
 *
 * 4. INTERPOLATION
 *    interpolate() maps one range of values to another:
 *    - Input: [0, 1] (our animation progress)
 *    - Output: [-8, 8] (pixels to move)
 *    - Creates smooth transitions between values
 *
 * 5. ACCESSIBILITY
 *    Always check AccessibilityInfo.isReduceMotionEnabled():
 *    - Some users get motion sickness from animations
 *    - Provide a static alternative when reduced motion is on
 *    - This is required for accessibility compliance
 *
 * 6. CLEANUP
 *    Always cancel animations in useEffect cleanup:
 *    - cancelAnimation(sharedValue) stops the animation
 *    - Prevents memory leaks when component unmounts
 *    - Especially important with -1 (infinite) repeats
 *
 * 7. WHY MULTIPLE COMPONENTS?
 *    We split into FloatingSparkle, PulseRing, MessageCarousel:
 *    - Each component manages its own animation logic
 *    - Easier to understand and maintain
 *    - Can reuse (e.g., FloatingSparkle is mapped 6 times)
 *
 * 8. STAGGERED ANIMATIONS
 *    Using withDelay with different values per item:
 *    - Creates organic, natural-feeling movement
 *    - Things don't all move in sync (which looks robotic)
 *    - Index-based delays ensure predictable staggering
 */

export default ContentLoadingFullScreen;
