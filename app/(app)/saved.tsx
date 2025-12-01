/**
 * Saved Screen - Bookmarked Articles List
 *
 * This screen displays all articles the user has saved/bookmarked.
 * When users save content from the Home screen, it appears here.
 *
 * PURPOSE:
 * - Display all saved articles in a scrollable list
 * - Allow users to tap a card to read the full article
 * - Allow users to unsave (remove) articles
 * - Provide a clean, organized view of bookmarked content
 *
 * USER FLOW:
 * 1. User sees article on Home screen
 * 2. User taps save/bookmark icon
 * 3. Article disappears from Home (moved to Saved)
 * 4. User navigates to Saved tab to find their saved articles
 * 5. User can tap to read, or unsave to remove
 *
 * DESIGN SYSTEM:
 * Follows UI_RULES.md principles:
 * - Minimal: Clean list layout with purposeful whitespace
 * - Light: Off-white background (#FAFAF9)
 * - Soft: Muted colors, no harsh tones
 * - Modern: Rounded corners, clean typography
 *
 * FIREBASE STRUCTURE:
 * Saved content is stored at: users/{userId}/savedContent/{requestId}
 * Each document contains a full copy of the content (denormalized for reliability).
 */

import { useCallback, useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Modal,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkX } from 'lucide-react-native';
import { Text, Card, CardContent } from '@/components/ui';
import { ContentCard, ContentFullView } from '@/components/content';
import { useAppSelector } from '@/store';
import {
  getAllSavedContent,
  unsaveContent,
  SavedContent,
} from '@/services/firebase/savedContentService';
import { GeneratedContent } from '@/types/content';
import { colors } from '@/theme';

/**
 * SavedScreen Component
 *
 * Displays a list of all saved/bookmarked articles.
 *
 * STATE MANAGEMENT:
 * - savedItems: Array of saved content from Firestore
 * - isLoading: Whether we're fetching data
 * - selectedItem: Currently selected item for full view
 * - isFullViewOpen: Whether the reading modal is open
 *
 * KEY BEHAVIORS:
 * - Fetches saved content when screen gains focus
 * - Shows empty state when no saved articles
 * - Allows unsaving (removes from list immediately)
 * - Full view modal for reading saved articles
 *
 * @returns The saved articles screen component
 */
export default function SavedScreen() {
  // ============================================================================
  // TRANSLATION
  // ============================================================================

  /**
   * Translation Hook
   *
   * useTranslation('content') loads translations from the 'content' namespace.
   */
  const { t } = useTranslation('content');

  // ============================================================================
  // STATE
  // ============================================================================

  /**
   * Auth State - Get current user
   */
  const { user } = useAppSelector((state) => state.auth);

  /**
   * Saved Items State
   *
   * Array of saved content fetched from Firestore.
   * Updated when screen gains focus or after unsave action.
   */
  const [savedItems, setSavedItems] = useState<SavedContent[]>([]);

  /**
   * Loading State
   *
   * True while fetching saved content from Firestore.
   */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Selected Item for Full View
   *
   * When user taps a saved article, we store it here
   * and open the full view modal.
   */
  const [selectedItem, setSelectedItem] = useState<SavedContent | null>(null);

  /**
   * Full View Modal State
   */
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);

  /**
   * Refreshing State for Pull-to-Refresh
   */
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Scroll State for Header Border
   *
   * Tracks whether the user has scrolled the list.
   * When true, the header shows a bottom border to indicate
   * that content is scrolling behind it.
   */
  const [isScrolled, setIsScrolled] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch Saved Content from Firestore
   *
   * Retrieves all saved articles for the current user.
   * Called when screen gains focus and on pull-to-refresh.
   */
  const fetchSavedContent = useCallback(async () => {
    if (!user?.uid) {
      setSavedItems([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('[SavedScreen] Fetching saved content...');
      const items = await getAllSavedContent(user.uid);
      setSavedItems(items);
      console.log('[SavedScreen] Loaded', items.length, 'saved items');
    } catch (err) {
      console.error('[SavedScreen] Failed to fetch saved content:', err);
      // Show empty state on error (could add error state if needed)
      setSavedItems([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  /**
   * Refresh on Screen Focus
   *
   * useFocusEffect runs when the screen gains focus.
   * This ensures the list is always up-to-date when user navigates here.
   *
   * WHY useFocusEffect?
   * - Tab navigation doesn't unmount screens
   * - useEffect only runs on mount
   * - We need to refresh when user switches to this tab
   */
  useFocusEffect(
    useCallback(() => {
      fetchSavedContent();
    }, [fetchSavedContent])
  );

  /**
   * Handle Pull-to-Refresh
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSavedContent();
  }, [fetchSavedContent]);

  /**
   * Handle Scroll Events
   *
   * Updates isScrolled state based on scroll position.
   * When scrollY > 0, content is scrolling behind the header,
   * so we show a bottom border to indicate this.
   *
   * WHY scrollEventThrottle={16}?
   * - 16ms ≈ 60fps, giving smooth updates
   * - Too high = choppy border appearance
   * - Too low = unnecessary renders
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      setIsScrolled(scrollY > 0);
    },
    []
  );

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle Opening Full View
   *
   * When user taps a saved article, open the full reading view.
   */
  const handleOpenFullView = useCallback((item: SavedContent) => {
    setSelectedItem(item);
    setIsFullViewOpen(true);
  }, []);

  /**
   * Handle Closing Full View
   *
   * Just closes the modal. Article stays saved.
   * (Different from Home screen where "Done" can dismiss)
   */
  const handleCloseFullView = useCallback(() => {
    setIsFullViewOpen(false);
    // Keep selectedItem so animation is smooth
    // Clear it after modal animation completes
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  /**
   * Handle Unsave/Remove from Saved
   *
   * Removes the article from saved content.
   * Updates UI immediately for responsive feel.
   *
   * @param requestId - The ID of the content to unsave
   */
  const handleUnsave = useCallback(
    async (requestId: string) => {
      if (!user?.uid) return;

      try {
        console.log('[SavedScreen] Unsaving content:', requestId);

        // Optimistic UI update - remove from list immediately
        setSavedItems((prev) => prev.filter((item) => item.requestId !== requestId));

        // If this was the item being viewed, close the modal
        if (selectedItem?.requestId === requestId) {
          setIsFullViewOpen(false);
          setSelectedItem(null);
        }

        // Actually delete from Firestore
        await unsaveContent(user.uid, requestId);
        console.log('[SavedScreen] Content unsaved successfully');
      } catch (err) {
        console.error('[SavedScreen] Failed to unsave content:', err);
        // On error, refetch to restore correct state
        fetchSavedContent();
      }
    },
    [user?.uid, selectedItem?.requestId, fetchSavedContent]
  );

  /**
   * Handle "Done Reading" in Full View
   *
   * For saved articles, "Done Reading" just closes the modal.
   * The article STAYS saved (user explicitly saved it).
   */
  const handleDoneReading = useCallback(() => {
    handleCloseFullView();
  }, [handleCloseFullView]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Convert SavedContent to GeneratedContent format
   *
   * ContentCard and ContentFullView expect GeneratedContent type.
   * SavedContent has a slightly different structure (content is nested).
   * This function converts between formats.
   *
   * NOTE: GeneratedContent uses generatedAt (ISO string), not createdAt.
   * We convert savedAt (Date) to ISO string for compatibility.
   */
  const toGeneratedContent = (saved: SavedContent): GeneratedContent => ({
    requestId: saved.requestId,
    status: 'completed' as const,
    content: saved.content,
    generatedAt: saved.savedAt.toISOString(),
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header - Shows border when content scrolls behind it */}
      <View
        className="px-6 pt-8 pb-4"
        style={{
          // Conditional border: appears when user scrolls
          // This provides visual feedback that content is behind the header
          borderBottomWidth: isScrolled ? 1 : 0,
          borderBottomColor: '#E7E5E4', // stone-200 - subtle border color
        }}
      >
        <Text variant="h1" className="mb-2">
          {t('saved.title')}
        </Text>
        <Text variant="lead" className="text-muted-foreground">
          {savedItems.length === 0
            ? t('saved.subtitle')
            : t('saved.count', { count: savedItems.length })}
        </Text>
      </View>

      {/* Content List */}
      {isLoading ? (
        // Loading State
        <View className="flex-1 items-center justify-center">
          <Text variant="muted">{t('saved.loading')}</Text>
        </View>
      ) : savedItems.length === 0 ? (
        // Empty State
        <View className="flex-1 px-6">
          <Card className="mt-4">
            <CardContent className="items-center py-12">
              <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center mb-4">
                <Bookmark size={32} color={colors.primary} />
              </View>
              <Text variant="h3" className="mb-2 text-center">
                {t('saved.empty.title')}
              </Text>
              <Text variant="muted" className="text-center px-4">
                {t('saved.empty.subtitle')}
              </Text>
            </CardContent>
          </Card>

          {/* Help Text */}
          <Card variant="outline" className="mt-4">
            <CardContent>
              <Text variant="small" className="text-muted-foreground">
                {t('saved.empty.hint')}
              </Text>
            </CardContent>
          </Card>
        </View>
      ) : (
        // Saved Articles List
        <FlatList
          data={savedItems}
          keyExtractor={(item) => item.requestId}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          // Scroll tracking for header border
          onScroll={handleScroll}
          scrollEventThrottle={16} // 16ms ≈ 60fps for smooth updates
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View className="h-4" />}
          renderItem={({ item }) => (
            <ContentCard
              content={toGeneratedContent(item)}
              onPress={() => handleOpenFullView(item)}
              onSave={() => handleUnsave(item.requestId)}
              onDismiss={() => handleUnsave(item.requestId)}
              isSaved={true} // All items here are saved
              context="saved"
            />
          )}
        />
      )}

      {/*
        FULL VIEW MODAL - CROSS-PLATFORM FIX

        See home.tsx for detailed explanation. Summary:
        - iOS: "pageSheet" creates native card behavior with rounded corners
        - Android: "pageSheet" is IGNORED, so we use transparent modal + wrapper View

        The wrapper View creates:
        1. Semi-transparent overlay (dark background behind modal)
        2. Gap at top (paddingTop) so rounded corners are visible
      */}
      <Modal
        visible={isFullViewOpen && !!selectedItem}
        animationType="slide"
        transparent={Platform.OS === 'android'}
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={handleCloseFullView}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.4)' : 'transparent',
            paddingTop: Platform.OS === 'android' ? 40 : 0,
          }}
        >
          {selectedItem && (
            <ContentFullView
              content={toGeneratedContent(selectedItem)}
              onClose={handleCloseFullView}
              onSave={() => handleUnsave(selectedItem.requestId)}
              onDone={handleDoneReading}
              isSaved={true}
              context="saved"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * =============================================================================
 * LEARNING NOTES
 * =============================================================================
 *
 * 1. useFocusEffect vs useEffect
 *    - useEffect: Runs on mount/unmount and dependency changes
 *    - useFocusEffect: Runs when screen GAINS FOCUS (tab navigation)
 *
 *    Tab navigators don't unmount screens when switching tabs!
 *    So useEffect won't re-run when user switches back to Saved tab.
 *    useFocusEffect solves this by running on every focus event.
 *
 * 2. OPTIMISTIC UI UPDATES
 *    When user unsaves an article, we immediately remove it from the list
 *    BEFORE the Firestore delete completes. This feels instant.
 *
 *    If the delete fails, we refetch to restore the correct state.
 *    This pattern is called "optimistic updates" - assume success, rollback on failure.
 *
 * 3. FlatList vs ScrollView
 *    - ScrollView: Renders ALL children at once (good for small lists)
 *    - FlatList: Renders only visible items (good for long lists)
 *
 *    We use FlatList because users might save many articles.
 *    FlatList is more memory-efficient for dynamic-length lists.
 *
 * 4. SAVEDCONTENT vs GENERATEDCONTENT
 *    These are different types with different structures:
 *    - GeneratedContent: Has requestId, status, content at top level
 *    - SavedContent: Has requestId, content nested, plus savedAt
 *
 *    We convert SavedContent to GeneratedContent format so we can
 *    reuse ContentCard and ContentFullView components.
 *
 * 5. CONTEXT PROP
 *    We pass context="saved" to ContentCard and ContentFullView.
 *    This lets them behave differently in the Saved screen:
 *    - Save button becomes "unsave" (remove from saved)
 *    - "Done Reading" just closes (doesn't delete)
 *
 * 6. MODAL ANIMATION
 *    We delay clearing selectedItem for 300ms after closing.
 *    This allows the slide-out animation to complete smoothly.
 *    Without this, the modal content would disappear mid-animation.
 *
 * 7. PULL-TO-REFRESH
 *    RefreshControl works in FlatList just like ScrollView.
 *    We use isRefreshing state to show the refresh spinner.
 *    Useful if user wants to check for new saved articles
 *    (though saves are local, might be from another device).
 *
 * 8. DENORMALIZATION BENEFIT
 *    Saved content stores a FULL COPY of the article.
 *    This means:
 *    - Saved articles are always available (even if original deleted)
 *    - Fast reads (no need to look up original content)
 *    - Works offline once cached
 *
 * FUTURE ENHANCEMENTS:
 * - Search within saved articles
 * - Sort by date or category
 * - Organize into folders/collections
 * - Share saved articles
 * - Export saved articles
 */
