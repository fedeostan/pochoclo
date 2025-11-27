/**
 * Home Screen - Main Dashboard Tab
 *
 * This is the default screen users see when they open the app after signing in.
 * It serves as the main landing page and dashboard for the authenticated experience.
 *
 * PURPOSE:
 * The Home screen is typically used for:
 * - Personalized welcome message
 * - Quick access to key features
 * - Activity feed or recent items
 * - Dashboard-style overview of important information
 *
 * For now, this is a placeholder that demonstrates the tab navigation.
 * In a real app, you would add:
 * - Featured content
 * - Personalized recommendations
 * - Recent activity
 * - Quick action buttons
 *
 * DESIGN SYSTEM:
 * Follows UI_RULES.md principles:
 * - Minimal: Clean layout with purposeful whitespace
 * - Light: Off-white background (#FAFAF9)
 * - Soft: Muted colors, no harsh tones
 * - Modern: Rounded corners, clean typography
 */

import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { Text, Card, CardContent } from '@/components/ui';
import { useAppSelector } from '@/store';
import { colors } from '@/theme';

/**
 * HomeScreen Component
 *
 * The main dashboard tab of the authenticated app experience.
 * Currently shows a welcome message and placeholder content.
 *
 * STATE:
 * - Reads user data from Redux to personalize the greeting
 *
 * FUTURE ENHANCEMENTS:
 * - Add featured content carousel
 * - Show recent activity
 * - Display personalized recommendations
 * - Add quick action cards
 *
 * @returns The home screen component
 */
export default function HomeScreen() {
  /**
   * Get User from Redux
   *
   * We read the user object to personalize the welcome message.
   * The user object contains displayName, email, etc. from Firebase Auth.
   */
  const { user } = useAppSelector((state) => state.auth);

  /**
   * Get Greeting Based on Time of Day
   *
   * Returns a contextual greeting:
   * - Morning: 5am - 12pm
   * - Afternoon: 12pm - 5pm
   * - Evening: 5pm - 5am
   *
   * This small personalization makes the app feel more human and friendly.
   */
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  /**
   * Get User's First Name
   *
   * Extracts the first name from displayName for a more personal greeting.
   * Falls back to "there" if no displayName is set.
   *
   * Examples:
   * - "John Doe" → "John"
   * - "Jane" → "Jane"
   * - null → "there"
   */
  const getFirstName = (): string => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0];
    }
    return 'there';
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/**
       * ScrollView Container
       *
       * Using ScrollView even though content might fit because:
       * - Content might grow as features are added
       * - Better accessibility (users expect to scroll)
       * - Consistent behavior with other screens
       */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          {/**
           * Header Section - Personalized Welcome
           *
           * Shows a time-appropriate greeting with the user's name.
           * This creates a warm, personalized experience.
           */}
          <View className="mb-8">
            <Text variant="h1" className="mb-2">
              {getGreeting()}, {getFirstName()}!
            </Text>
            <Text variant="lead" className="text-muted-foreground">
              Welcome to your dashboard
            </Text>
          </View>

          {/**
           * Placeholder Content Card
           *
           * This demonstrates where main content would go.
           * In a real app, this could be:
           * - Featured content
           * - Recommendations
           * - Recent activity
           * - Quick actions
           */}
          <Card className="mb-6">
            <CardContent className="items-center py-12">
              {/**
               * Placeholder Icon
               *
               * Using Sparkles icon to represent "coming soon" content.
               * The icon is styled with primary-100 background for a soft look.
               */}
              <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center mb-4">
                <Sparkles size={32} color={colors.primary} />
              </View>
              <Text variant="h3" className="mb-2 text-center">
                Your Dashboard
              </Text>
              <Text variant="muted" className="text-center px-4">
                This is where your personalized content will appear.
                Explore the app using the tabs below!
              </Text>
            </CardContent>
          </Card>

          {/**
           * Quick Stats Row (Placeholder)
           *
           * Shows where quick stats or metrics could go.
           * Common patterns:
           * - Activity count
           * - Notifications
           * - Progress indicators
           */}
          <View className="flex-row gap-4 mb-6">
            <QuickStatCard
              title="Discover"
              subtitle="Explore new content"
              value="New"
            />
            <QuickStatCard
              title="Profile"
              subtitle="Manage your account"
              value="View"
            />
          </View>

          {/**
           * Info Card
           *
           * Educational note about the tab navigation.
           * Helps users understand the app structure.
           */}
          <Card variant="outline">
            <CardContent>
              <Text variant="small" className="text-muted-foreground">
                Use the tab bar below to navigate between Home, Discover,
                and Profile. Each tab has its own content and purpose.
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * =============================================================================
 * QUICK STAT CARD COMPONENT
 * =============================================================================
 *
 * A small card for displaying quick stats or navigation hints.
 * Used in the dashboard to show at-a-glance information.
 *
 * Props:
 * @param title - Main label for the stat
 * @param subtitle - Secondary description
 * @param value - The value or call-to-action text
 */
interface QuickStatCardProps {
  title: string;
  subtitle: string;
  value: string;
}

function QuickStatCard({ title, subtitle, value }: QuickStatCardProps) {
  return (
    <Card className="flex-1">
      <CardContent className="py-4">
        {/**
         * Value Badge
         *
         * Shows the primary value or status.
         * Uses primary-100 background for soft emphasis.
         */}
        <View className="self-start px-2 py-1 rounded-md bg-primary-100 mb-2">
          <Text variant="small" className="text-primary font-medium">
            {value}
          </Text>
        </View>
        {/**
         * Title and Subtitle
         *
         * Title is prominent, subtitle is muted for hierarchy.
         */}
        <Text className="font-medium mb-1">{title}</Text>
        <Text variant="small" className="text-muted-foreground">
          {subtitle}
        </Text>
      </CardContent>
    </Card>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. INDEX.TSX IN ROUTE GROUPS
 *    In Expo Router, index.tsx is special:
 *    - In app/(app)/index.tsx, this becomes the default tab
 *    - The route is "/" relative to the route group
 *    - This is why the Home tab shows this screen
 *
 * 2. TAB BAR BEHAVIOR
 *    Notice the tab bar is visible at the bottom.
 *    It's defined in _layout.tsx and persists across all tab screens.
 *    Each tab is a sibling, not a child, so navigation is instant.
 *
 * 3. SAFE AREA HANDLING
 *    We use edges={['top']} because:
 *    - The tab bar handles bottom safe area
 *    - We only need to handle the top notch/status bar
 *    - This prevents double-padding at the bottom
 *
 * 4. PERSONALIZATION PATTERNS
 *    Small touches like time-based greetings and first-name usage
 *    make the app feel more personal and engaging.
 *    These are low-effort, high-impact UX improvements.
 *
 * 5. PLACEHOLDER CONTENT
 *    It's good practice to have meaningful placeholders:
 *    - Shows users what to expect
 *    - Guides them to explore
 *    - Makes the app feel complete even with minimal content
 *
 * 6. COMPONENT COMPOSITION
 *    QuickStatCard is a private component (not exported).
 *    It's defined in the same file because:
 *    - Only used in this screen
 *    - Simple enough to not need its own file
 *    - Keeps related code together
 *
 *    If reused elsewhere, move it to components/ui/.
 *
 * NEXT STEPS:
 * - Add actual content based on your app's purpose
 * - Connect to backend data (Firestore)
 * - Add pull-to-refresh functionality
 * - Implement quick actions that navigate to features
 */
