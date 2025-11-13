/**
 * animations.ts - Animation Timing and Easing Design Tokens
 *
 * This file defines animation durations and easing curves for smooth, consistent motion.
 * Good animation timing makes your app feel polished and responsive.
 *
 * WHAT ARE ANIMATIONS?
 * ====================
 * Animations are transitions between states (hidden to visible, small to large, etc.)
 * They help users understand:
 * - What changed (a new screen appeared)
 * - Where things went (item moved to cart)
 * - Cause and effect (I tapped, something happened)
 *
 * WHY STANDARDIZE ANIMATION TIMING?
 * ==================================
 * 1. **Consistency**: All modals fade in at the same speed
 * 2. **Feel**: Correct timing makes the app feel responsive (not sluggish or jarring)
 * 3. **Predictability**: Users learn how long things take
 * 4. **Accessibility**: Some users need reduced motion (we'll account for this)
 *
 * ANIMATION PSYCHOLOGY:
 * =====================
 * - Too fast (< 100ms): Jarring, feels broken
 * - Fast (100-200ms): Snappy, responsive, energetic
 * - Normal (200-300ms): Smooth, comfortable (most common)
 * - Slow (300-500ms): Deliberate, important, heavy
 * - Too slow (> 500ms): Frustrating, feels sluggish
 *
 * Rule of thumb: Smaller elements = faster animations, larger elements = slower
 */

/**
 * DURATION SCALE
 * ==============
 * Animation durations in milliseconds (ms)
 */
export const duration = {
  /**
   * INSTANT - 0ms
   * No animation (immediate)
   * Use for: Accessibility (reduced motion), instant feedback
   * Example: When user enables "reduce motion" in accessibility settings
   */
  instant: 0,

  /**
   * FASTEST - 100ms
   * Lightning fast (barely perceptible)
   * Use for: Micro-interactions, hover effects, small elements
   * Example: Button press feedback, icon color changes, tooltips
   */
  fastest: 100,

  /**
   * FAST - 150ms
   * Very quick and snappy
   * Use for: Small transitions, quick feedback
   * Example: Checkbox animations, switch toggles, small dropdowns
   */
  fast: 150,

  /**
   * NORMAL - 200ms
   * Standard animation speed (most common)
   * Use for: Most UI transitions, modals, sheets
   * Example: Modal fade-in, slide-in drawers, most transitions
   * This is your default animation duration!
   */
  normal: 200,

  /**
   * MODERATE - 300ms
   * Comfortably smooth
   * Use for: Larger transitions, screen changes
   * Example: Screen transitions, large cards, bottom sheets
   */
  moderate: 300,

  /**
   * SLOW - 400ms
   * Deliberately slow and smooth
   * Use for: Important transitions, focus-grabbing animations
   * Example: Important modals, onboarding flows, tutorial animations
   */
  slow: 400,

  /**
   * SLOWEST - 500ms
   * Very slow (use sparingly!)
   * Use for: Dramatic effects, special moments
   * Example: Splash screen transitions, celebration animations
   */
  slowest: 500,

  /**
   * EXTRA SLOW - 800ms
   * Extremely slow (rare)
   * Use for: Very important moments, skeleton loading
   * Example: Loading animations, reward reveals
   */
  extraSlow: 800,

} as const;

/**
 * EASING CURVES
 * =============
 * Easing controls HOW the animation progresses (not just how long).
 * It's the "feeling" of the motion.
 *
 * Think of a car:
 * - Linear: Constant speed (robotic, unnatural)
 * - Ease-In: Starts slow, speeds up (accelerating car)
 * - Ease-Out: Starts fast, slows down (braking car)
 * - Ease-In-Out: Starts slow, speeds up, slows down (smooth acceleration and braking)
 *
 * In React Native, we use these with the Animated API.
 */
export const easing = {
  /**
   * LINEAR - Constant speed
   * Use for: Loading spinners, progress bars, continuous animations
   * Feel: Robotic, mechanical (usually avoid for UI transitions)
   */
  linear: 'linear',

  /**
   * EASE - Gradual start and end (default browser easing)
   * Use for: General purpose animations
   * Feel: Natural, comfortable
   */
  ease: 'ease',

  /**
   * EASE-IN - Starts slow, speeds up
   * Use for: Elements leaving the screen
   * Feel: Elements accelerating away
   * Example: Closing modals, dismissing alerts
   */
  easeIn: 'ease-in',

  /**
   * EASE-OUT - Starts fast, slows down (MOST COMMON)
   * Use for: Elements entering the screen
   * Feel: Elements decelerating to rest
   * Example: Opening modals, appearing notifications, new screens
   * This is your default easing!
   */
  easeOut: 'ease-out',

  /**
   * EASE-IN-OUT - Slow start and end, fast middle
   * Use for: Elements moving on screen (not entering/leaving)
   * Feel: Smooth throughout
   * Example: Repositioning elements, swapping content
   */
  easeInOut: 'ease-in-out',

} as const;

/**
 * COMPONENT-SPECIFIC ANIMATIONS
 * ==============================
 * Pre-configured animations for common components
 */
export const componentAnimations = {
  /**
   * MODALS & OVERLAYS
   * Dialogs, sheets, and overlays
   */
  modal: {
    // Overlay fade in/out
    overlay: {
      duration: duration.normal,  // 200ms
      easing: easing.easeOut,
    },
    // Modal content slide up
    slideUp: {
      duration: duration.moderate, // 300ms
      easing: easing.easeOut,
    },
    // Modal fade in
    fadeIn: {
      duration: duration.normal,  // 200ms
      easing: easing.easeOut,
    },
  },

  /**
   * BUTTONS
   * Press feedback and state changes
   */
  button: {
    // Press feedback (scale down slightly)
    press: {
      duration: duration.fastest,  // 100ms
      easing: easing.easeOut,
    },
    // Release feedback (scale back up)
    release: {
      duration: duration.fast,     // 150ms
      easing: easing.easeOut,
    },
  },

  /**
   * SCREENS & NAVIGATION
   * Transitions between screens
   */
  screen: {
    // Slide in from right (common navigation)
    slideIn: {
      duration: duration.moderate, // 300ms
      easing: easing.easeOut,
    },
    // Fade transition
    fade: {
      duration: duration.normal,   // 200ms
      easing: easing.easeInOut,
    },
  },

  /**
   * TOASTS & NOTIFICATIONS
   * Alert messages and notifications
   */
  notification: {
    // Slide down from top
    slideDown: {
      duration: duration.moderate, // 300ms
      easing: easing.easeOut,
    },
    // Auto-dismiss (stays on screen)
    autoDismiss: {
      duration: 3000,              // 3 seconds visible
      easing: easing.linear,
    },
  },

  /**
   * LISTS & ITEMS
   * List animations and item interactions
   */
  list: {
    // Item appear
    itemAppear: {
      duration: duration.normal,   // 200ms
      easing: easing.easeOut,
    },
    // Item remove
    itemRemove: {
      duration: duration.fast,     // 150ms
      easing: easing.easeIn,
    },
  },

  /**
   * LOADING & PROGRESS
   * Loading states and progress indicators
   */
  loading: {
    // Spinner rotation
    spinner: {
      duration: duration.extraSlow, // 800ms per rotation
      easing: easing.linear,
    },
    // Skeleton pulse
    skeleton: {
      duration: duration.slowest,  // 500ms pulse
      easing: easing.easeInOut,
    },
  },

} as const;

/**
 * SPRING CONFIGURATIONS
 * ======================
 * Spring animations feel more natural than duration-based animations.
 * React Native's Animated.spring() uses these parameters.
 *
 * Think of a real spring:
 * - Bounciness: How much it oscillates (low = stiff, high = bouncy)
 * - Speed: How fast it reaches the end (low = slow, high = fast)
 */
export const spring = {
  /**
   * GENTLE - Subtle spring (minimal bounce)
   * Use for: Subtle transitions, professional feel
   */
  gentle: {
    bounciness: 2,
    speed: 12,
  },

  /**
   * DEFAULT - Balanced spring
   * Use for: General purpose animations
   */
  default: {
    bounciness: 8,
    speed: 12,
  },

  /**
   * BOUNCY - Playful spring (noticeable bounce)
   * Use for: Playful interactions, celebration
   */
  bouncy: {
    bounciness: 15,
    speed: 10,
  },

  /**
   * SNAPPY - Quick and responsive
   * Use for: Fast feedback, responsive interactions
   */
  snappy: {
    bounciness: 5,
    speed: 18,
  },

} as const;

/**
 * TIMING FUNCTIONS (Custom Bezier Curves)
 * ========================================
 * For advanced users using the Animated API with custom easing.
 * These are cubic-bezier values (x1, y1, x2, y2).
 *
 * Visualize bezier curves: https://cubic-bezier.com/
 */
export const bezier = {
  /**
   * STANDARD - Material Design standard easing
   * Feels: Natural, responsive
   */
  standard: {
    x1: 0.4,
    y1: 0.0,
    x2: 0.2,
    y2: 1.0,
  },

  /**
   * DECELERATE - Material Design deceleration
   * Feels: Elements entering (slowing down to rest)
   */
  decelerate: {
    x1: 0.0,
    y1: 0.0,
    x2: 0.2,
    y2: 1.0,
  },

  /**
   * ACCELERATE - Material Design acceleration
   * Feels: Elements leaving (speeding up)
   */
  accelerate: {
    x1: 0.4,
    y1: 0.0,
    x2: 1.0,
    y2: 1.0,
  },

  /**
   * SHARP - Quick and decisive
   * Feels: Abrupt, attention-grabbing
   */
  sharp: {
    x1: 0.4,
    y1: 0.0,
    x2: 0.6,
    y2: 1.0,
  },

} as const;

/**
 * HOW TO USE ANIMATIONS IN YOUR COMPONENTS:
 * ==========================================
 *
 * Import animation values:
 * ```typescript
 * import { duration, easing, componentAnimations } from '../theme/animations';
 * ```
 *
 * With React Native's Animated API:
 * ```typescript
 * import { Animated } from 'react-native';
 *
 * // Fade in animation
 * const opacity = new Animated.Value(0);
 *
 * Animated.timing(opacity, {
 *   toValue: 1,
 *   duration: duration.normal,  // 200ms
 *   useNativeDriver: true,
 * }).start();
 * ```
 *
 * With spring animation:
 * ```typescript
 * Animated.spring(scale, {
 *   toValue: 1,
 *   ...spring.default,          // Spring configuration
 *   useNativeDriver: true,
 * }).start();
 * ```
 *
 * Component-specific:
 * ```typescript
 * // Modal fade in
 * Animated.timing(opacity, {
 *   toValue: 1,
 *   ...componentAnimations.modal.fadeIn,
 *   useNativeDriver: true,
 * }).start();
 * ```
 */

/**
 * ACCESSIBILITY: REDUCED MOTION
 * ==============================
 * Some users get motion sickness from animations.
 * Always respect the user's "reduce motion" preference!
 *
 * ```typescript
 * import { AccessibilityInfo } from 'react-native';
 *
 * const [reduceMotion, setReduceMotion] = useState(false);
 *
 * useEffect(() => {
 *   AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
 * }, []);
 *
 * // Use instant duration if reduce motion is enabled
 * const animDuration = reduceMotion ? duration.instant : duration.normal;
 * ```
 */

/**
 * PERFORMANCE TIPS:
 * =================
 *
 * 1. **Use Native Driver**: Always set `useNativeDriver: true`
 *    - Animations run on native thread (60fps)
 *    - Works for: opacity, transform (scale, rotate, translate)
 *    - Doesn't work for: layout properties (width, height, padding)
 *
 * 2. **Avoid Layout Animations**: They're expensive
 *    - Bad: Animating width, height, margin
 *    - Good: Animating transform: scale, translateX/Y
 *
 * 3. **Batch Animations**: Run multiple animations together
 *    - Use Animated.parallel() for simultaneous animations
 *    - Use Animated.sequence() for ordered animations
 *
 * 4. **Clean Up**: Stop animations when component unmounts
 *    ```typescript
 *    useEffect(() => {
 *      return () => animation.stop();
 *    }, []);
 *    ```
 */

/**
 * REAL-WORLD EXAMPLES:
 * ====================
 *
 * Button Press:
 * - Duration: duration.fastest (100ms)
 * - Easing: easing.easeOut
 * - Effect: Scale down to 0.95, then back to 1
 *
 * Modal Open:
 * - Overlay: fade in (duration.normal, 200ms)
 * - Content: slide up (duration.moderate, 300ms)
 * - Both use easeOut easing
 *
 * Toast Notification:
 * - Appear: slide down (duration.moderate, 300ms)
 * - Stay: 3000ms
 * - Dismiss: slide up (duration.fast, 150ms)
 *
 * Screen Transition:
 * - Duration: duration.moderate (300ms)
 * - Easing: easeOut for entering, easeIn for leaving
 */

/**
 * ANIMATION GUIDELINES:
 * =====================
 *
 * DO:
 * - Use animations to guide attention
 * - Keep animations short (< 400ms usually)
 * - Use easeOut for elements entering
 * - Use easeIn for elements leaving
 * - Respect "reduce motion" preferences
 * - Use native driver when possible
 *
 * DON'T:
 * - Animate everything (becomes overwhelming)
 * - Use slow animations for frequent actions
 * - Block user interaction during animations
 * - Forget to clean up animations
 * - Animate layout properties (use transforms instead)
 */

/**
 * LEARN MORE:
 * ===========
 * - React Native Animations: https://reactnative.dev/docs/animations
 * - Material Motion: https://material.io/design/motion/
 * - iOS Animation: https://developer.apple.com/design/human-interface-guidelines/motion
 * - Easing Functions: https://easings.net/
 * - Bezier Curves: https://cubic-bezier.com/
 */

// Export all animation constants
export const animations = {
  duration,
  easing,
  spring,
  bezier,
  component: componentAnimations,
} as const;
