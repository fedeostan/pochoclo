/**
 * NavBar Component - Fixed Navigation Bar
 *
 * A fixed/sticky navigation bar that stays at the top of the screen while
 * content scrolls behind it. This creates a polished, native app feel.
 *
 * WHAT MAKES IT "FIXED"?
 * ======================
 * Unlike content that scrolls, a fixed header stays in place:
 * - Uses absolute positioning to "float" above scrolling content
 * - Has a high zIndex to ensure it renders on top of everything
 * - Extends from the very top of the screen (including status bar area)
 *
 * HOW CONTENT SCROLLS "BEHIND" IT:
 * ================================
 * 1. NavBar is positioned absolutely (removed from normal document flow)
 * 2. NavBar has high zIndex (renders on top of other content)
 * 3. ScrollView content has paddingTop equal to NavBar height
 * 4. When user scrolls, content moves but NavBar stays fixed
 * 5. Content that scrolls past the NavBar area is hidden behind it
 *
 * The background color matches the app background (#FAFAF9) so the
 * "hidden" content seamlessly disappears behind the NavBar.
 *
 * VISUAL STRUCTURE:
 * ┌─────────────────────────────────┐
 * │       STATUS BAR AREA           │ ← NavBar extends here
 * │─────────────────────────────────│
 * │ ← Back    [Title]      [Right]  │ ← Interactive NavBar content
 * │─────────────────────────────────│
 * │                                 │
 * │      SCROLLABLE CONTENT         │ ← Scrolls behind NavBar
 * │                                 │
 * └─────────────────────────────────┘
 *
 * USAGE:
 * ```tsx
 * // Basic back button only
 * <NavBar showBackButton />
 *
 * // With title
 * <NavBar showBackButton title="Settings" />
 *
 * // With right element (e.g., action button)
 * <NavBar
 *   showBackButton
 *   title="Edit Profile"
 *   rightElement={<Pressable><SaveIcon /></Pressable>}
 * />
 * ```
 *
 * IMPORTANT: When using NavBar, add paddingTop to your ScrollView content
 * using the NAV_BAR_HEIGHT constant or the useNavBarHeight hook.
 */

import { View, Pressable, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Text } from "./Text";

/**
 * NAV_BAR_CONTENT_HEIGHT - Height of the interactive NavBar content
 *
 * This is the height of the actual navigation bar content (back button, title, etc.)
 * NOT including the status bar area.
 *
 * Why 44px?
 * - This is the standard iOS navigation bar height
 * - Apple's Human Interface Guidelines recommend this size
 * - It provides enough space for touch targets (44pt minimum)
 *
 * The total NavBar height = NAV_BAR_CONTENT_HEIGHT + safe area inset
 */
export const NAV_BAR_CONTENT_HEIGHT = 44;

/**
 * BORDER_COLOR - Color for the bottom border when content is scrolling
 *
 * This matches the Input component's border color for visual consistency.
 * The border appears when content scrolls behind the NavBar, providing
 * a subtle visual separation between the fixed header and scrolling content.
 *
 * Value: #E7E5E4 (stone-200) - same as Tailwind's `border-border`
 */
const BORDER_COLOR = "#E7E5E4";

/**
 * NavBarProps - Configuration options for the NavBar
 *
 * @property showBackButton - Show the back arrow button (default: true)
 * @property title - Optional title text in the center
 * @property rightElement - Optional element on the right side (e.g., action button)
 * @property onBackPress - Custom back button handler (default: router.back())
 * @property isScrolled - Whether content is scrolling behind (shows bottom border)
 */
export interface NavBarProps {
  /** Whether to show the back button (default: true) */
  showBackButton?: boolean;

  /** Optional title displayed in the center of the NavBar */
  title?: string;

  /** Optional element to render on the right side */
  rightElement?: React.ReactNode;

  /** Custom handler for back button press (defaults to router.back()) */
  onBackPress?: () => void;

  /**
   * Whether content is scrolling behind the NavBar
   *
   * When true, a subtle bottom border appears to visually separate
   * the fixed NavBar from the scrolling content beneath it.
   * This provides feedback that content is "hidden" behind the header.
   *
   * Typically set by tracking ScrollView's scroll position:
   * - false when scrollY === 0 (at top)
   * - true when scrollY > 0 (scrolled down)
   */
  isScrolled?: boolean;
}

/**
 * useNavBarHeight Hook
 *
 * Returns the total height of the NavBar including the safe area inset.
 * Use this to set paddingTop on your ScrollView content.
 *
 * WHY A HOOK?
 * The safe area inset varies by device:
 * - iPhone X and later: ~44-47px for notch/Dynamic Island
 * - Older iPhones: ~20px for status bar
 * - Android: varies by device
 *
 * This hook dynamically calculates the correct total height,
 * applying the same iOS adjustment as the NavBar component.
 *
 * USAGE:
 * ```tsx
 * const navBarHeight = useNavBarHeight();
 *
 * <ScrollView contentContainerStyle={{ paddingTop: navBarHeight }}>
 *   {content}
 * </ScrollView>
 * ```
 */
export function useNavBarHeight(): number {
  const insets = useSafeAreaInsets();

  /**
   * Calculate top padding with iOS adjustment
   *
   * Same logic as NavBar component:
   * - iOS: Reduce by 6px (min 20px) for tighter spacing
   * - Android: Use full insets.top
   */
  const topPadding =
    Platform.OS === "ios" ? Math.max(insets.top - 6, 20) : insets.top;

  return topPadding + NAV_BAR_CONTENT_HEIGHT;
}

/**
 * NavBar Component
 *
 * A fixed navigation bar that stays at the top while content scrolls behind.
 *
 * IMPLEMENTATION DETAILS:
 *
 * 1. ABSOLUTE POSITIONING
 *    position: 'absolute' removes the NavBar from the normal layout flow.
 *    It "floats" above other content rather than pushing it down.
 *
 * 2. TOP: 0, LEFT: 0, RIGHT: 0
 *    Anchors the NavBar to the top of its parent, stretching edge-to-edge.
 *
 * 3. ZINDEX: 100
 *    Ensures NavBar renders on top of scrolling content.
 *    Higher numbers = closer to the viewer.
 *
 * 4. PADDING TOP = SAFE AREA INSET
 *    Pushes the interactive content (back button, title) below the status bar.
 *    The NavBar background extends into the status bar area.
 *
 * 5. BACKGROUND COLOR = APP BACKGROUND
 *    Using the same color as the app background (#FAFAF9) makes content
 *    "disappear" smoothly as it scrolls behind the NavBar.
 */
export function NavBar({
  showBackButton = true,
  title,
  rightElement,
  onBackPress,
  isScrolled = false,
}: NavBarProps) {
  /**
   * Safe Area Insets
   *
   * useSafeAreaInsets() returns the spacing needed to avoid system UI:
   * - top: notch, Dynamic Island, status bar
   * - bottom: home indicator
   * - left/right: curved screen edges (rare)
   *
   * We use insets.top to push our content below the status bar area
   * while still extending the NavBar background into that area.
   */
  const insets = useSafeAreaInsets();

  /**
   * Back Button Handler
   *
   * Uses the custom handler if provided, otherwise defaults to router.back()
   * which navigates to the previous screen in the stack.
   */
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          /**
           * Dynamic padding based on device safe area
           *
           * This pushes the interactive content (back button, title) below
           * the status bar, while the NavBar background fills the entire
           * space from the top of the screen.
           *
           * iOS ADJUSTMENT:
           * On modern iPhones, insets.top is ~47px (full notch/Dynamic Island height).
           * This creates excessive spacing. We reduce by 6px to bring the back
           * button closer to the status bar area, while keeping a minimum of 20px
           * for older iPhones without a notch.
           *
           * Android: Use full insets.top (typically ~24px) which looks correct.
           */
          paddingTop:
            Platform.OS === "ios" ? Math.max(insets.top - 6, 20) : insets.top,

          /**
           * Conditional Border
           *
           * When isScrolled is true, we show a subtle bottom border.
           * This provides visual feedback that content is scrolling
           * behind the NavBar - a polished UX detail seen in native apps.
           *
           * The border color (#E7E5E4) matches our Input component's
           * border for design system consistency.
           */
          borderBottomWidth: isScrolled ? 1 : 0,
          borderBottomColor: BORDER_COLOR,
        },
      ]}
    >
      {/**
       * NavBar Content Row
       *
       * A horizontal row containing:
       * - Left: Back button (if showBackButton is true)
       * - Center: Title (if provided)
       * - Right: Custom element (if provided)
       *
       * Uses flexbox with space-between for automatic spacing.
       * Fixed height of NAV_BAR_CONTENT_HEIGHT (44px).
       */}
      <View style={styles.content}>
        {/* Left Section - Back Button */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <Pressable
              onPress={handleBackPress}
              style={styles.backButton}
              /**
               * Hit Slop - Expanded Touch Target
               *
               * Makes the button easier to tap by expanding the touchable area
               * beyond the visible button bounds. This follows Apple's
               * recommendation of at least 44x44pt touch targets.
               */
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={20} color="#6B8E7B" />
              <Text className="text-primary ml-1">Back</Text>
            </Pressable>
          )}
        </View>

        {/* Center Section - Title */}
        <View style={styles.centerSection}>
          {title && (
            <Text className="text-foreground font-semibold text-base">
              {title}
            </Text>
          )}
        </View>

        {/* Right Section - Custom Element */}
        <View style={styles.rightSection}>{rightElement}</View>
      </View>
    </View>
  );
}

/**
 * NavBar Styles
 *
 * Using StyleSheet.create for performance benefits:
 * - Styles are validated at compile time
 * - Styles are sent to native only once (cached)
 * - Better for static styles that don't change
 */
const styles = StyleSheet.create({
  /**
   * Container - The main NavBar wrapper
   *
   * POSITION: absolute - Removes from normal flow, floats above content
   * TOP/LEFT/RIGHT: 0 - Anchors to top, stretches edge-to-edge
   * ZINDEX: 100 - Renders on top of scrolling content
   * BACKGROUND: #FAFAF9 - Matches app background for seamless hiding of content
   */
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#FAFAF9", // bg-background - matches app background
  },

  /**
   * Content - The row containing back button, title, and right element
   *
   * HEIGHT: 44px - Standard iOS navigation bar height
   * FLEX-DIRECTION: row - Horizontal layout
   * ALIGN-ITEMS: center - Vertically center content
   * PADDING-HORIZONTAL: 16px - Match app padding (px-4)
   */
  content: {
    height: NAV_BAR_CONTENT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  /**
   * Left Section - Contains back button
   *
   * FLEX: 1 - Takes equal space as right section
   * This ensures the center section is truly centered.
   */
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },

  /**
   * Center Section - Contains title
   *
   * FLEX: 2 - Takes double the space of side sections
   * This gives the title more room while keeping it centered.
   */
  centerSection: {
    flex: 2,
    alignItems: "center",
  },

  /**
   * Right Section - Contains custom element
   *
   * FLEX: 1 - Takes equal space as left section
   * ALIGN-ITEMS: flex-end - Aligns content to the right
   */
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },

  /**
   * Back Button - Pressable area for back navigation
   *
   * FLEX-DIRECTION: row - Icon and text side by side
   * ALIGN-ITEMS: center - Vertically aligned
   * PADDING-VERTICAL: 8px - Larger touch target
   */
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
});

/**
 * LEARNING NOTES:
 *
 * 1. FIXED VS STICKY POSITIONING
 *
 *    In web CSS, you'd use position: fixed or position: sticky.
 *    In React Native, we use position: absolute with zIndex.
 *
 *    The key difference:
 *    - Web fixed: Stays in viewport even when scrolling
 *    - RN absolute: Positioned relative to parent, need zIndex to stay on top
 *
 * 2. WHY ABSOLUTE + ZINDEX WORKS
 *
 *    When a component has absolute positioning:
 *    - It's removed from the normal layout flow
 *    - Other components don't "see" it and don't make space for it
 *    - It can overlap other content
 *
 *    zIndex determines the stacking order:
 *    - Higher zIndex = renders on top
 *    - Our NavBar (zIndex: 100) renders above ScrollView (default zIndex: 0)
 *
 * 3. SAFE AREA HANDLING
 *
 *    Different devices have different "unsafe" areas:
 *    - iPhone X+: Notch at top, home indicator at bottom
 *    - iPhone 14 Pro+: Dynamic Island at top
 *    - Android: Status bar, navigation bar
 *
 *    useSafeAreaInsets() gives us the exact pixels to avoid.
 *    We use this for paddingTop to push content below the status bar.
 *
 * 4. FLEXBOX FOR THREE-COLUMN LAYOUT
 *
 *    We use flex: 1, flex: 2, flex: 1 for left, center, right sections.
 *    This creates a 1:2:1 ratio, ensuring the center is truly centered.
 *
 *    Without this, if the back button is wider than the right element,
 *    the title would appear off-center.
 *
 * 5. HIT SLOP FOR BETTER UX
 *
 *    Apple recommends 44x44pt minimum touch targets.
 *    hitSlop expands the touchable area without changing visual size.
 *    This makes buttons easier to tap, especially while moving.
 *
 * 6. STYLESHEET.CREATE PERFORMANCE
 *
 *    StyleSheet.create() has performance benefits:
 *    - Validates styles at compile time
 *    - Creates a reference ID sent to native once
 *    - Subsequent renders use the cached reference
 *
 *    Inline styles (style={{ ... }}) create new objects each render.
 *
 * 7. DESIGN SYSTEM COLORS
 *
 *    We hardcode '#FAFAF9' instead of importing colors because:
 *    - It must exactly match the Tailwind bg-background
 *    - The colors.ts file might have the old value (#F5F5F5)
 *    - Single source of truth is tailwind.config.js
 *
 *    In a production app, you'd ensure colors.ts matches Tailwind.
 */
