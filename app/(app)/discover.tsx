/**
 * Discover Screen - Content Exploration Tab
 *
 * This screen is dedicated to content discovery and exploration.
 * It's where users find new content, browse categories, and search.
 *
 * PURPOSE:
 * The Discover screen typically serves as:
 * - Content browser (movies, articles, products, etc.)
 * - Search interface
 * - Category navigation
 * - Recommendations engine
 *
 * For now, this is a placeholder that demonstrates the tab structure.
 * In a real app (like a movie app called POCHOCLO), you might add:
 * - Search bar for finding content
 * - Genre/category filters
 * - Trending content section
 * - Recommended for you section
 * - Recently added content
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
import { Compass, Search, Film, TrendingUp, Star } from 'lucide-react-native';
import { Text, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { colors } from '@/theme';

/**
 * DiscoverScreen Component
 *
 * The content discovery tab of the app.
 * Currently shows placeholder sections for future content features.
 *
 * FUTURE ENHANCEMENTS:
 * - Add search functionality
 * - Integrate with backend for content listing
 * - Add category filtering
 * - Implement infinite scroll for content lists
 * - Add pull-to-refresh
 *
 * @returns The discover screen component
 */
export default function DiscoverScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/**
       * ScrollView Container
       *
       * Content discovery screens typically have lots of scrollable content.
       * ScrollView is essential here for:
       * - Multiple content sections
       * - Search results
       * - Category lists
       */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          {/**
           * Header Section
           *
           * Title and subtitle for the Discover section.
           * In a full implementation, this might include a search bar.
           */}
          <View className="mb-8">
            <Text variant="h1" className="mb-2">
              Discover
            </Text>
            <Text variant="lead" className="text-muted-foreground">
              Explore and find new content
            </Text>
          </View>

          {/**
           * Search Hint Card
           *
           * Placeholder for where search functionality would go.
           * In a real app, this would be an interactive search input.
           */}
          <Card className="mb-6">
            <CardContent className="flex-row items-center py-4">
              <View className="w-10 h-10 rounded-lg bg-primary-100 items-center justify-center mr-3">
                <Search size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Search coming soon</Text>
                <Text variant="small" className="text-muted-foreground">
                  Find movies, shows, and more
                </Text>
              </View>
            </CardContent>
          </Card>

          {/**
           * Categories Section
           *
           * Quick access to different content categories.
           * These would typically link to filtered content lists.
           */}
          <View className="mb-6">
            <Text variant="h4" className="mb-4">
              Browse Categories
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <CategoryChip icon={Film} label="Movies" />
              <CategoryChip icon={TrendingUp} label="Trending" />
              <CategoryChip icon={Star} label="Top Rated" />
              <CategoryChip icon={Compass} label="Explore" />
            </View>
          </View>

          {/**
           * Featured Content Placeholder
           *
           * Shows where featured/recommended content would appear.
           * In a real app, this could be a horizontal carousel.
           */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Featured</CardTitle>
            </CardHeader>
            <CardContent className="items-center py-8">
              <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center mb-4">
                <Film size={32} color={colors.primary} />
              </View>
              <Text variant="h4" className="mb-2 text-center">
                Content Coming Soon
              </Text>
              <Text variant="muted" className="text-center px-4">
                This is where featured content will appear.
                Stay tuned for updates!
              </Text>
            </CardContent>
          </Card>

          {/**
           * Info Card
           *
           * Educational note about the Discover section.
           * Helps users understand what this section will offer.
           */}
          <Card variant="outline">
            <CardContent>
              <Text variant="small" className="text-muted-foreground">
                The Discover tab is where you'll find new content to enjoy.
                Search, browse categories, and get personalized recommendations.
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
 * CATEGORY CHIP COMPONENT
 * =============================================================================
 *
 * A small, tappable chip for category selection.
 * Used to provide quick access to content categories.
 *
 * DESIGN:
 * - Rounded pill shape (rounded-full)
 * - Primary background at low opacity (bg-primary-50)
 * - Primary text color for visibility
 * - Icon + label for clarity
 *
 * Props:
 * @param icon - Lucide icon component to display
 * @param label - Category name text
 */
interface CategoryChipProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
}

function CategoryChip({ icon: Icon, label }: CategoryChipProps) {
  return (
    <View className="flex-row items-center px-4 py-2 rounded-full bg-primary-50">
      {/**
       * Icon
       *
       * Small icon (16px) to identify the category visually.
       * Uses primary color to match the text.
       */}
      <Icon size={16} color={colors.primary} />
      {/**
       * Label
       *
       * Category name in primary color.
       * Medium font weight for emphasis.
       */}
      <Text className="ml-2 text-primary font-medium text-sm">
        {label}
      </Text>
    </View>
  );
}

/**
 * LEARNING NOTES:
 *
 * 1. DISCOVER PATTERN
 *    The Discover/Explore tab is common in content apps:
 *    - Netflix: Browse categories, search
 *    - Spotify: Discover Weekly, Browse
 *    - Instagram: Explore page
 *    - YouTube: Trending, Explore
 *
 *    It's separate from Home (personalized) to give users
 *    a dedicated space for exploration.
 *
 * 2. SEARCH UX CONSIDERATIONS
 *    Search in mobile apps typically:
 *    - Has a prominent search bar at the top
 *    - Shows recent searches
 *    - Provides suggestions as you type
 *    - Shows results in a scrollable list
 *
 *    The search placeholder card hints at this future functionality.
 *
 * 3. CATEGORY CHIPS
 *    Chips are great for:
 *    - Filterable categories
 *    - Tags and labels
 *    - Quick selections
 *    - Multi-select options
 *
 *    They're tappable and provide visual feedback.
 *    In a full implementation, tapping would navigate to filtered content.
 *
 * 4. CONTENT LOADING PATTERNS
 *    When connected to a backend, consider:
 *    - Skeleton loaders while fetching
 *    - Pagination or infinite scroll
 *    - Pull-to-refresh
 *    - Error states with retry options
 *    - Empty states with helpful messages
 *
 * 5. ICON AS PROP
 *    Notice how we pass the icon as a component type:
 *    icon: React.ComponentType<{ size: number; color: string }>
 *
 *    This allows us to render it as <Icon size={16} color={...} />
 *    It's a flexible pattern for icon components.
 *
 * 6. FLEX WRAP FOR CHIPS
 *    Using flex-row flex-wrap gap-3:
 *    - Items flow left to right
 *    - Wrap to next line when needed
 *    - Consistent spacing with gap
 *
 *    This creates a responsive grid of chips.
 *
 * FUTURE IMPLEMENTATION IDEAS:
 * - Search with debounced API calls
 * - Category filter with state management
 * - Infinite scroll content list
 * - Horizontal carousels for featured content
 * - Genre-based navigation
 * - Watchlist/favorites integration
 */
