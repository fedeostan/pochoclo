/**
 * App Layout - Bottom Tab Navigation for Authenticated Screens
 *
 * This layout provides the main navigation structure for authenticated users.
 * It uses Expo Router's Tabs component to create a bottom tab bar with
 * three main sections: Home, Discover, and Profile.
 *
 * WHAT IS TAB NAVIGATION?
 * Tab navigation is a pattern where the main sections of an app are accessible
 * through tabs at the bottom (iOS style) or top (Android Material style) of the screen.
 * Bottom tabs are more common in mobile apps because they're easier to reach with thumbs.
 *
 * WHY USE TABS HERE?
 * 1. Primary Navigation: Main sections should be easily accessible
 * 2. Persistent: Tab bar stays visible as you navigate within sections
 * 3. Familiar: Users expect bottom tabs in mobile apps
 * 4. Efficient: One tap to switch between major sections
 *
 * ROUTE GROUP REMINDER:
 * The (app) folder is a "route group" - the parentheses mean files here
 * create routes like /home, /discover, /profile (not /app/home).
 */

import { Tabs } from 'expo-router';
import { Home, Compass, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Design System Colors
 *
 * We define colors inline here instead of importing from theme because:
 * 1. Tab bar needs these specific values for its configuration
 * 2. Keeps this file self-contained and easy to understand
 * 3. These match our Tailwind config (UI_RULES.md)
 *
 * These colors follow our design system:
 * - Primary: Soft sage green (#6B8E7B)
 * - Muted: Medium gray for inactive states (#78716C)
 * - Background: Warm off-white (#FAFAF9)
 * - Border: Light gray for subtle separation (#E7E5E4)
 */
const TAB_BAR_COLORS = {
  active: '#6B8E7B',      // Primary sage green - stands out for active tab
  inactive: '#78716C',    // Muted gray - recedes for inactive tabs
  background: '#FAFAF9',  // Warm off-white - matches app background
  border: '#E7E5E4',      // Light border - subtle separation
};

/**
 * Icon Size Constant
 *
 * 24px is a standard size for navigation icons:
 * - Large enough to tap easily (touch target should be 44px minimum)
 * - Small enough to not dominate the tab bar
 * - Consistent with Material Design and iOS guidelines
 */
const ICON_SIZE = 24;

/**
 * AppLayout Component - Tab Navigator
 *
 * Configures the bottom tab bar with three tabs:
 * - Home: Main dashboard showing user data (home.tsx)
 * - Discover: Content discovery section (discover.tsx)
 * - Profile: User profile and settings (profile.tsx)
 *
 * TABS VS STACK:
 * - Stack: Screens slide in/out, good for hierarchical navigation
 * - Tabs: Screens are siblings, good for parallel sections
 *
 * We use Tabs because Home, Discover, and Profile are parallel sections
 * that users frequently switch between.
 */
export default function AppLayout() {
  /**
   * Safe Area Insets
   *
   * useSafeAreaInsets() returns the safe area insets for the current device:
   * - top: Status bar height (notch area on iPhone X+)
   * - bottom: Home indicator (iPhone X+) or navigation bar (Android)
   * - left/right: Usually 0, but can be non-zero on landscape or certain devices
   *
   * WHY USE THIS FOR TAB BAR?
   * On Android with gesture navigation or 3-button navigation, there's a system
   * navigation bar at the bottom. Without accounting for this, our tab bar would
   * be hidden behind it.
   *
   * By using insets.bottom, we dynamically add the correct padding so the tab bar
   * sits ABOVE the system navigation bar on all devices.
   *
   * iOS:
   * - iPhone X+: insets.bottom ≈ 34px (home indicator)
   * - Older iPhones: insets.bottom = 0
   *
   * Android:
   * - Gesture navigation: insets.bottom ≈ 24-48px
   * - 3-button navigation: insets.bottom ≈ 48px
   * - No navigation bar: insets.bottom = 0
   */
  const insets = useSafeAreaInsets();

  /**
   * Calculate Tab Bar Height
   *
   * Base height: 60px (content area for icons + labels)
   * Plus bottom inset: Varies by device (0-48px typically)
   *
   * This ensures consistent tab bar content height across all devices,
   * while respecting each device's safe area requirements.
   */
  const TAB_BAR_HEIGHT = 60;
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <Tabs
      /**
       * Screen Options - Global Tab Bar Configuration
       *
       * These options apply to all tabs in this navigator.
       * Individual tabs can override these with their own options.
       */
      screenOptions={{
        /**
         * Hide Header
         *
         * We hide the default tab navigator header because:
         * - Each screen manages its own header/navigation
         * - More control over styling per screen
         * - Some screens might want no header, others custom headers
         */
        headerShown: false,

        /**
         * Tab Bar Style
         *
         * Configures the visual appearance of the tab bar.
         *
         * backgroundColor: Warm off-white to match our design system
         * borderTopColor: Subtle gray line to separate from content
         * borderTopWidth: 1px line (hairline on iOS)
         * elevation: 0 to remove Android shadow (we use border instead)
         *
         * DYNAMIC SAFE AREA HANDLING:
         * - height: Base height + bottom inset for system navigation bar
         * - paddingBottom: Bottom inset ensures content doesn't overlap system UI
         * - paddingTop: Fixed 8px for consistent spacing above icons
         *
         * This works on ALL devices:
         * - iPhone X+ with home indicator
         * - Older iPhones without home indicator
         * - Android with gesture navigation
         * - Android with 3-button navigation
         * - Android without navigation bar (rare)
         */
        tabBarStyle: {
          backgroundColor: TAB_BAR_COLORS.background,
          borderTopColor: TAB_BAR_COLORS.border,
          borderTopWidth: 1,
          elevation: 0, // Removes Android shadow
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },

        /**
         * Tab Bar Active/Inactive Colors
         *
         * tabBarActiveTintColor: Color for the active tab (icon + label)
         * tabBarInactiveTintColor: Color for inactive tabs
         *
         * Active tabs use our primary sage green to draw attention.
         * Inactive tabs use muted gray to recede visually.
         *
         * This creates clear visual hierarchy showing where you are.
         */
        tabBarActiveTintColor: TAB_BAR_COLORS.active,
        tabBarInactiveTintColor: TAB_BAR_COLORS.inactive,

        /**
         * Tab Bar Label Style
         *
         * Configures the text labels below each icon.
         *
         * fontSize: 12px is standard for tab labels (readable but not dominant)
         * fontWeight: 500 (medium) provides good balance of visibility
         * marginTop: Small space between icon and label for visual separation
         */
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      {/**
       * HOME TAB
       *
       * The main screen users see after signing in.
       * name="home" maps to home.tsx file (route "/home").
       *
       * WHY "home" INSTEAD OF "index"?
       * Using index.tsx would conflict with app/index.tsx (root router).
       * By using home.tsx, we have a clear, unique route path "/home".
       * This makes navigation simpler and avoids routing ambiguity.
       */}
      <Tabs.Screen
        name="home"
        options={{
          /**
           * Tab Title
           * Shown below the icon in the tab bar
           */
          title: 'Home',

          /**
           * Tab Icon
           *
           * Function receives { color, size, focused } and returns an icon.
           * We use the provided color to match active/inactive states.
           *
           * lucide-react-native icons accept:
           * - size: Number for width/height in pixels
           * - color: String color value (hex, rgb, etc.)
           * - strokeWidth: Line thickness (2 is default)
           *
           * The Home icon represents the main/dashboard section.
           */
          tabBarIcon: ({ color, focused }) => (
            <Home
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/**
       * DISCOVER TAB
       *
       * Content discovery section for exploring new content.
       * name="discover" maps to discover.tsx file.
       */}
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          /**
           * Compass Icon
           *
           * The Compass represents exploration and discovery.
           * It's a common icon choice for "discover" or "explore" sections.
           * Alternatives: Search, Grid, Globe
           */
          tabBarIcon: ({ color, focused }) => (
            <Compass
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/**
       * PROFILE TAB
       *
       * User profile and account settings.
       * name="profile" maps to profile.tsx file.
       */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          /**
           * User Icon
           *
           * The User icon clearly represents personal/profile content.
           * This is the most universally recognized icon for profiles.
           */
          tabBarIcon: ({ color, focused }) => (
            <User
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. EXPO ROUTER TABS
 *    Expo Router's Tabs component is built on React Navigation's
 *    Bottom Tab Navigator. It integrates with file-based routing.
 *
 * 2. FILE-TO-TAB MAPPING
 *    - home.tsx → Home tab
 *    - discover.tsx → Discover tab
 *    - profile.tsx → Profile tab
 *
 *    The "name" prop in Tabs.Screen must match the filename (without .tsx).
 *
 * 3. SAFE AREA INSETS (CRITICAL FOR ANDROID!)
 *    useSafeAreaInsets() from react-native-safe-area-context provides
 *    the exact pixel values needed to avoid system UI:
 *
 *    REQUIREMENTS:
 *    - SafeAreaProvider must wrap the entire app (in app/_layout.tsx)
 *    - Without it, insets return 0 and UI gets hidden behind system bars
 *
 *    HOW WE USE IT:
 *    - Add insets.bottom to tab bar height
 *    - Add insets.bottom to tab bar paddingBottom
 *    - This pushes the tab bar above the Android navigation bar
 *
 *    WHY NOT FIXED VALUES?
 *    - Different Android devices have different navigation bar heights
 *    - Gesture navigation vs 3-button navigation have different sizes
 *    - Some Android devices have no navigation bar at all
 *    - Dynamic values work everywhere automatically
 *
 * 4. ICON LIBRARIES
 *    We use lucide-react-native for icons because:
 *    - Consistent design language
 *    - Customizable (size, color, stroke width)
 *    - Tree-shakeable (only imports used icons)
 *    - Same icons work in web and native
 *
 * 5. PLATFORM CONSIDERATIONS
 *    iOS and Android have different design conventions:
 *    - iOS: Bottom tabs with home indicator area
 *    - Android: Material Design tabs, system navigation bar
 *
 *    We handle BOTH with useSafeAreaInsets() - no Platform.OS checks needed!
 *
 * 6. FOCUSED STATE
 *    The focused prop tells us if a tab is active.
 *    We use this to make active icons slightly bolder (strokeWidth: 2.5).
 *    This subtle change reinforces which tab is selected.
 *
 * 7. COLOR INHERITANCE
 *    When you set tabBarActiveTintColor and tabBarInactiveTintColor,
 *    the tab bar passes the appropriate color to each icon function.
 *    This keeps colors consistent without manual checking.
 *
 * 8. NAVIGATION WITHIN TABS
 *    Each tab can have its own Stack navigator for deeper navigation.
 *    For example, Profile could have sub-screens like EditProfile.
 *    This is done by creating a folder like (app)/profile/_layout.tsx.
 *
 * 9. TAB BAR HIDING
 *    Sometimes you want to hide the tab bar on certain screens.
 *    This can be done with: tabBarStyle: { display: 'none' }
 *    Or by navigating outside the tab navigator.
 *
 * TROUBLESHOOTING SAFE AREAS:
 * - Tab bar hidden behind navigation bar? Check SafeAreaProvider is in root layout
 * - Insets returning 0? Make sure SafeAreaProvider wraps the entire app
 * - Content cut off? Use SafeAreaView in your screens with appropriate edges
 */
